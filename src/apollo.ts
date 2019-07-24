import ApolloClient from 'apollo-boost'
import { GraphQLError } from 'graphql'
import fetch from 'node-fetch'

import { GetBranchesQuery, DeleteBranchesMutation } from './schema'
import { logger } from './logger'
import { batch } from './util'
import { getBranches, deleteBranches } from './queries.gql'

import micromatch from 'micromatch'

export interface Branch {
  id: string
  owner: string
  repository: string
  name: string
}

export class FlatGraphQLError extends Error {
  constructor(public errors: readonly GraphQLError[]) {
    super(errors[0].message)
  }
}

export class ApolloClientApi {
  client = new ApolloClient({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetch: fetch as any,
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
    uri: 'https://api.github.com/graphql',
  })

  constructor(private token: string) {}

  async getBranches(patterns?: string | string[]) {
    const { data, errors } = await this.client.query<GetBranchesQuery>({
      query: getBranches,
    })

    if (errors) {
      throw new FlatGraphQLError(errors)
    }

    const {
      viewer: {
        name: owner,
        repositories: { nodes },
      },
    } = data

    if (!nodes) {
      return null
    }

    const branches: Branch[] = []

    nodes.forEach(repo => {
      const { branchProtectionRules, refs } = repo!

      let branchNames: string[] = []

      const repoBranches = refs!.nodes!.reduce<Record<string, string>>(
        (acc, branch) => {
          const { id, name } = branch!
          acc[name] = id
          branchNames.push(name)
          return acc
        },
        {},
      )

      if (branchProtectionRules.nodes!.length) {
        branchNames = micromatch.not(
          branchNames,
          branchProtectionRules.nodes!.map(rule => rule!.pattern),
        )
      }

      if (patterns && patterns.length) {
        branchNames = micromatch(branchNames, patterns)
      }

      branches!.push(
        ...branchNames.map(name => ({
          id: repoBranches[name],
          owner: owner!,
          repository: repo!.name,
          name,
        })),
      )
    })

    logger.debug('matched branches: ', branches)

    return branches
  }

  async deleteBranches(branches: Branch[]) {
    if (!branches.length) {
      return []
    }

    logger.warn(
      'The following branches will be deleted: ',
      branches.map(
        branch => `${branch.owner}/${branch.repository}#${branch.name}`,
      ),
    )

    const clientMutationIds = await batch(
      branches.map(branch =>
        this.client
          .mutate<DeleteBranchesMutation>({
            mutation: deleteBranches,
            variables: {
              input: {
                refId: branch.id,
              },
            },
          })
          .then(({ data, errors }) => {
            if (errors) {
              throw new FlatGraphQLError(errors)
            }

            return data!.deleteRef!.clientMutationId!
          }),
      ),
    )

    logger.debug('clientMutationIds: ', clientMutationIds)

    return clientMutationIds
  }
}
