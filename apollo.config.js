module.exports = {
  client: {
    service: {
      name: 'github',
      localSchemaFile: require.resolve(
        '@octokit/graphql-schema/schema.graphql',
      ),
    },
  },
}
