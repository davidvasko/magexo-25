import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

console.log('Environment check:', {
  domain,
  hasToken: !!storefrontAccessToken
});

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

export const ALL_PRODUCTS_QUERY = gql`
  query GetAllProducts($cursor: String) {
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
          collections(first: 10) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
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
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        hasNextPage
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
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      handle
      productType
      vendor
      tags
      variants(first: 250) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            sku
            availableForSale
          }
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      createdAt
      updatedAt
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

export async function getAllProducts(cursor?: string) {
  try {
    const { data } = await shopifyClient.query({
      query: ALL_PRODUCTS_QUERY,
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
      query: ALL_PRODUCTS_QUERY,
      variables: {},
      fetchPolicy: 'no-cache'
    });

    const products = data.products.edges.map(({ node }) => node);
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
