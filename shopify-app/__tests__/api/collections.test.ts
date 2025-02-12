// Set environment variables before any imports
process.env.MONGODB_URI = 'mongodb://localhost:27017'
process.env.NODE_ENV = 'test'

import { GET } from '@/app/api/collections/route'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data)
    }))
  }
}))

// Mock MongoDB client
const mockCollection = {
  find: jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439011',
        title: 'Test Collection',
        description: 'Test Description'
      }
    ])
  })
}

jest.mock('@/app/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: () => ({
      collection: () => mockCollection
    })
  })
}))

describe('Collections API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns formatted collections', async () => {
    const response = await GET(new Request('http://localhost:3000/api/collections'))
    const data = await response.json()

    expect(data.collections).toBeDefined()
    expect(data.collections[0].title).toBe('Test Collection')
    expect(data.collections[0].id).toBe('507f1f77bcf86cd799439011')
  })

  it('handles database errors', async () => {
    mockCollection.find.mockImplementationOnce(() => {
      throw new Error('Database error')
    })

    const response = await GET(new Request('http://localhost:3000/api/collections'))
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch collections')
  })
}) 