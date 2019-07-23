import DefaultClient from 'apollo-boost'
import fetch from 'unfetch'

import { Nullable } from './helpers'
import { getBranches } from './queries.gql'
import { GetBranchesQuery } from './schema'

import minimatch from 'minimatch'

export interface Branch {
  repository: string
  name: string
}

export class ApolloClientApi {
  client = new DefaultClient({
    fetch,
    headers: {
      Authorization: `Bearer ${this.token}`,
    },
    uri: 'https://api.github.com/graphql',
  })

  constructor(private token: string) {}

  async getBranches() {
    const { data, errors } = await this.client.query<GetBranchesQuery>({
      query: getBranches,
    })

    let owner: Nullable<string>
    let branches: Nullable<Branch[]>

    if (data) {
      const {
        viewer: {
          name,
          repositories: { nodes },
        },
      } = data
      owner = name
      if (nodes) {
        branches = []
        nodes.forEach(repo => {
          const { branchProtectionRules, refs } = repo!
          let allBranches: string[] = []

          if (refs) {
            allBranches = refs.nodes!.map(branch => branch!.name)
          }

          if (branchProtectionRules) {
            const patterns = branchProtectionRules.nodes!.map(
              rule => rule!.pattern,
            )
            allBranches = allBranches.reduce<string[]>((acc, branch) => {
              if (
                !new minimatch.Minimatch('').matchOne([branch], patterns, false)
              ) {
                acc.push(branch)
              }
              return acc
            }, [])
          }

          branches!.push(
            ...allBranches.map(name => ({
              repository: repo!.name,
              name,
            })),
          )
        })
      }
    }

    return {
      owner,
      branches,
      errors,
    }
  }
}
