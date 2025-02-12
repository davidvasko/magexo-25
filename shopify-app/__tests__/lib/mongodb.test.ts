// Set environment variables before imports
process.env.MONGODB_URI = 'mongodb://localhost:27017'
process.env.NODE_ENV = 'test'

import { MongoClient } from 'mongodb'

// Mock MongoDB client
const mockDb = {
  collection: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([])
}

const mockClient = {
  connect: jest.fn().mockResolvedValue(true),
  db: jest.fn().mockReturnValue(mockDb)
}

// Mock MongoClient constructor
jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => mockClient)
}))

describe('MongoDB Connection', () => {
  beforeEach(() => {
    jest.resetModules()
    process.env.MONGODB_URI = 'mongodb://localhost:27017'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('creates a client instance', async () => {
    const { MongoClient } = require('mongodb')
    const { default: clientPromise } = await import('@/app/lib/mongodb')
    await clientPromise

    expect(MongoClient).toHaveBeenCalledWith(
      'mongodb://localhost:27017',
      expect.any(Object)
    )
  })
}) 