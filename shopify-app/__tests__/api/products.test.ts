import { GET } from '@/app/api/products/route'

// Set environment variables before imports
process.env.MONGODB_URI = 'mongodb://localhost:27017'
process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'test-token'
process.env.SHOPIFY_STORE_DOMAIN = 'test-store.myshopify.com'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data)
    }))
  }
}))

// Mock Apollo Client with proper link structure
jest.mock('@apollo/client', () => {
  const mockHttpLink = { request: jest.fn() }
  const mockAuthLink = { request: jest.fn() }
  
  mockAuthLink.concat = jest.fn().mockReturnValue({
    request: jest.fn()
  })

  return {
    ApolloClient: jest.fn().mockImplementation(() => ({
      query: jest.fn().mockResolvedValue({
        data: {
          products: {
            edges: [{
              node: {
                id: 'gid://shopify/Product/1',
                title: 'Test Product',
                vendor: 'Test Vendor',
                variants: {
                  edges: [{ node: { price: { amount: '10.00' } } }]
                }
              }
            }]
          }
        }
      })
    })),
    InMemoryCache: jest.fn(),
    createHttpLink: jest.fn().mockReturnValue(mockHttpLink),
    setContext: jest.fn().mockReturnValue(mockAuthLink),
    gql: jest.fn((strings, ...args) => strings.join(''))
  }
})

// Mock MongoDB client
const mockCollection = {
  find: jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue([{
      _id: '507f1f77bcf86cd799439011',
      title: 'Test Product',
      price: 10.00
    }])
  }),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
}

jest.mock('@/app/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: () => mockCollection
    })
  })
}))

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns formatted products', async () => {
    const request = new Request('http://localhost:3000/api/products')
    const response = await GET(request)
    const data = await response.json()

    expect(data.products).toBeDefined()
    expect(Array.isArray(data.products)).toBe(true)
  })

  it('handles errors gracefully', async () => {
    mockCollection.find.mockImplementationOnce(() => {
      throw new Error('Database error')
    })

    const request = new Request('http://localhost:3000/api/products')
    const response = await GET(request)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch products')
  })
}) 