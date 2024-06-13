export default defineEventHandler(async (event) => {
  const { admin } = await useShopify(event)

  const products = await admin.request(`#graphql
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }
  }`, {
    variables: {
      first: 1,
    },
  })

  return products.data?.products.edges.map(edge => edge.node)
})
