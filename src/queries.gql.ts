import gql from 'graphql-tag'

export const getBranches = gql`
  query getBranches {
    viewer {
      name
      repositories(first: 100) {
        nodes {
          name
          description
          refs(first: 100, refPrefix: "refs/heads/") {
            nodes {
              id
              name
            }
          }
          branchProtectionRules(first: 100) {
            nodes {
              pattern
            }
          }
        }
      }
    }
  }
`

export const deleteBranches = gql`
  mutation deleteBranches($input: DeleteRefInput!) {
    deleteRef(input: $input) {
      clientMutationId
    }
  }
`
