
declare module '*/queries.gql' {
  import { DocumentNode } from 'graphql';
  const defaultDocument: DocumentNode;
  export const getBranches: DocumentNode;

  export default defaultDocument;
}
    