process.env.MONGODB_URI = 'mongodb://localhost:27017'
process.env.NODE_ENV = 'test'

import { GET } from '@/app/api/collections/route'
import { NextResponse } from 'next/server'

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data)
    }))
  }
}))

const mockCollection = {
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439011',
        id: '1',
        title: 'Test Collection',
        description: 'Test Description',
        source: 'mongodb'
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
    // Suppress console.error
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns collections successfully', async () => {
    const response = await GET()
    const data = await response.json()
    
    expect(data.collections).toBeDefined()
    expect(data.collections.length).toBeGreaterThan(0)
    expect(data.collections[0].title).toBe('Test Collection')
  })

  it('handles database errors', async () => {
    mockCollection.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockRejectedValueOnce(new Error('Database error'))
    })

    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch collections')
  })
}) 