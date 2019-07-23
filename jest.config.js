module.exports = {
  preset: 'ts-jest',
  transform: {
    '\\.(gql|graphql)$': 'jest-transform-graphql',
  },
}
