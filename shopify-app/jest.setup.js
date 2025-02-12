import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'

// Add fetch to global
global.fetch = jest.fn()

// Add Request, Response to global
global.Request = class Request {}
global.Response = class Response {}

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Swiper
jest.mock('swiper/react', () => ({
  Swiper: ({ children }) => <div data-testid="swiper">{children}</div>,
  SwiperSlide: ({ children }) => <div data-testid="swiper-slide">{children}</div>,
}))

jest.mock('swiper/modules', () => ({
  Navigation: jest.fn(),
  Pagination: jest.fn(),
  FreeMode: jest.fn(),
}))

// Mock CSS imports
jest.mock('swiper/css', () => ({}))
jest.mock('swiper/css/navigation', () => ({}))
jest.mock('swiper/css/pagination', () => ({}))
jest.mock('swiper/css/free-mode', () => ({}))

// Mock MongoDB
jest.mock('mongodb', () => {
  const mClient = {
    connect: jest.fn().mockResolvedValue(this),
    db: jest.fn().mockReturnThis(),
    collection: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  }
  return {
    MongoClient: jest.fn(() => mClient),
  }
})
