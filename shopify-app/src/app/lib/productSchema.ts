interface ProductImage {
    url: string;
    altText: string | null;
  }
  
  interface ProductVariant {
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    compareAtPrice?: {
      amount: string;
      currencyCode: string;
    };
    sku: string;
    availableForSale: boolean;
  }
  
  export interface MongoProduct {
    id: string;
    title: string;
    description: string;
    handle: string;
    productType: string;
    vendor: string;
    tags: string[];
    variants: {
      edges: Array<{
        node: ProductVariant;
      }>;
    };
    images: {
      edges: Array<{
        node: ProductImage;
      }>;
    };
    createdAt: string;
    updatedAt: string;
    isCustom?: boolean;
  }