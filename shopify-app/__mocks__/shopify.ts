export const getAllProducts = jest.fn().mockResolvedValue({
  products: {
    edges: [
      {
        node: {
          id: '1',
          title: 'Test Product',
          handle: 'test-product',
          vendor: 'Test Vendor',
          variants: {
            edges: [{ node: { price: { amount: '10.00', currencyCode: 'CZK' } } }]
          },
          images: { edges: [] }
        }
      }
    ]
  }
});

export const getAllCollections = jest.fn().mockResolvedValue({
  collections: {
    edges: [
      {
        node: {
          id: '1',
          title: 'Test Collection',
          handle: 'test-collection'
        }
      }
    ]
  }
});

export const getProduct = jest.fn().mockResolvedValue({
  product: {
    id: '1',
    title: 'Test Product',
    handle: 'test-product'
  }
}); 