export interface Price {
  amount: string;
  currencyCode: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  price: Price;
  compareAtPrice?: Price;
  sku: string;
  stockQuantity: number;
  availableForSale: boolean;
}

export interface ProductImage {
  url: string;
  altText: string | null;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  productType: string;
  vendor: string;
  tags: string[];
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        compareAtPrice?: {
          amount: string;
          currencyCode: string;
        } | null;
        sku: string;
        availableForSale: boolean;
        stockQuantity?: number;
      };
    }>;
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText?: string;
      };
    }>;
  };
  collections?: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        handle?: string;
      };
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  title: string;
  handle: string;
  description: string;
  products: {
    edges: Array<{
      node: Product;
    }>;
  };
}

export interface Page {
  id: string;
  title: string;
  handle: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string;
}

export interface Edge<T> {
  node: T;
  cursor: string;
}
