export const mockFind = {
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue([])
}

export const mockCollection = {
  find: jest.fn().mockReturnValue(mockFind),
  aggregate: jest.fn().mockReturnValue({
    toArray: jest.fn().mockResolvedValue([{ count: 10 }])
  }),
  insertMany: jest.fn().mockResolvedValue({ insertedCount: 1 }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  findOne: jest.fn().mockResolvedValue(null)
}

jest.mock('@/app/lib/mongodb', () => ({
  getCollection: jest.fn().mockReturnValue(mockCollection),
  client: {
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection)
    })
  }
})) 