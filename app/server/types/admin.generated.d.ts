/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as AdminTypes from './admin.types.d.ts';

export type GetProductsQueryVariables = AdminTypes.Exact<{
  first: AdminTypes.Scalars['Int']['input'];
}>;


export type GetProductsQuery = { products: { edges: Array<{ node: Pick<AdminTypes.Product, 'id' | 'handle' | 'title'> }> } };

interface GeneratedQueryTypes {
  "#graphql\n  query getProducts($first: Int!) {\n    products(first: $first) {\n      edges {\n        node {\n          id\n          handle\n          title\n        }\n      }\n    }\n  }": {return: GetProductsQuery, variables: GetProductsQueryVariables},
}

interface GeneratedMutationTypes {
}
declare module '@shopify/admin-api-client' {
  type InputMaybe<T> = AdminTypes.InputMaybe<T>;
  interface AdminQueries extends GeneratedQueryTypes {}
  interface AdminMutations extends GeneratedMutationTypes {}
}
