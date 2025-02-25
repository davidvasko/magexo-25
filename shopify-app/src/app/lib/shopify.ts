import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;


const httpLink = createHttpLink({
  uri: `https://${domain}/api/2024-01/graphql.json`,
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      'Content-Type': 'application/json',
    }
  };
});

export const shopifyClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
});

export const GET_ALL_PRODUCTS = gql`
  query GetProducts($cursor: String) {
    products(first: 250, after: $cursor) {
      edges {
        node {
          id
          title
          handle
          description
          productType
          vendor
          tags
          collections(first: 250) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
          variants(first: 250) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                sku
                availableForSale
              }
            }
          }
          images(first: 250) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_ALL_COLLECTIONS = gql`
  query GetAllCollections($cursor: String) {
    collections(first: 250, after: $cursor) {
      edges {
        node {
          id
          title
          handle
          description
        }
        cursor
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const ALL_PAGES_QUERY = gql`
  query GetAllPages($cursor: String) {
    pages(first: 250, after: $cursor) {
      edges {
        node {
          id
          title
          handle
          body
          createdAt
          updatedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_PRODUCT_BY_HANDLE = gql`
  query getProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      handle
      productType
      vendor
      tags
      createdAt
      updatedAt
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 250) {
        edges {
          node {
            id
            title
            sku
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            availableForSale
          }
        }
      }
      collections(first: 10) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  }
`;

export const GET_ALL_VENDORS = gql`
  query GetAllVendors {
    products(first: 250) {
      edges {
        node {
          vendor
        }
      }
    }
  }
`;

export const GET_PRODUCTS_IN_COLLECTION = gql`
  query GetProductsInCollection($id: ID!) {
    collection(id: $id) {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            vendor
            tags
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  sku
                  availableForSale
                }
              }
            }
            images(first: 2) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const DEBUG_PRODUCT_VARIANTS = gql`
  query DebugProductVariants($handle: String!) {
    product(handle: $handle) {
      id
      title
      variants(first: 250) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  }
`;

export async function getAllProducts(cursor?: string) {
  try {
    const { data } = await shopifyClient.query({
      query: GET_ALL_PRODUCTS,
      variables: { cursor },
      fetchPolicy: 'no-cache'
    });

    return data;
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    throw error;
  }
}

export async function getAllCollections(cursor?: string) {
  try {
    const { data } = await shopifyClient.query({
      query: GET_ALL_COLLECTIONS,
      variables: { cursor },
      fetchPolicy: 'no-cache'
    });

    return data;
  } catch (error) {
    console.error('Error in getAllCollections:', error);
    throw error;
  }
}

export async function getAllPages(cursor?: string) {
  try {
    const { data } = await shopifyClient.query({
      query: ALL_PAGES_QUERY,
      variables: { cursor },
      fetchPolicy: 'no-cache'
    });

    return data;
  } catch (error) {
    console.error('Error in getAllPages:', error);
    throw error;
  }
}

export async function getProduct(handle: string) {
  try {
    const { data } = await shopifyClient.query({
      query: GET_PRODUCT_BY_HANDLE,
      variables: { handle },
      fetchPolicy: 'no-cache'
    });

    return data;
  } catch (error) {
    console.error('Error in getProduct:', error);
    throw error;
  }
}

export async function getProducts() {
  try {
    const { data } = await shopifyClient.query({
      query: GET_ALL_PRODUCTS,
      variables: {},
      fetchPolicy: 'no-cache'
    });

    const products = data.products.edges.map(({ node }: { node: any }) => node);
    return { products };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [] };
  }
}

export async function getAllVendors() {
  try {
    const { data } = await shopifyClient.query({
      query: GET_ALL_VENDORS
    });
    
    const vendors = new Set(
      data.products.edges.map((edge: any) => edge.node.vendor)
    );
    
    return Array.from(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
}

export async function getProductsInCollection(collectionId: string) {
  try {
    const { data } = await shopifyClient.query({
      query: GET_PRODUCTS_IN_COLLECTION,
      variables: { id: collectionId },
      fetchPolicy: 'no-cache'
    });

    return data;
  } catch (error) {
    console.error('Error in getProductsInCollection:', error);
    throw error;
  }
}

export async function debugProductVariants(handle: string) {
  try {
    const { data } = await shopifyClient.query({
      query: DEBUG_PRODUCT_VARIANTS,
      variables: { handle },
      fetchPolicy: 'no-cache'
    });
    console.log('Debug - All variants for product:', {
      productTitle: data.product.title,
      variantsCount: data.product.variants.edges.length,
      variants: data.product.variants.edges
    });
    return data;
  } catch (error) {
    console.error('Error in debugProductVariants:', error);
    throw error;
  }
}
