import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import HomePage from '@/app/page'
import { getAllProducts } from '@/app/lib/shopify'

// Mock dependencies
jest.mock('@/app/lib/shopify')
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}))

// Mock fetch responses
const mockProducts = [{
  _id: '1',
  id: '1', // Add this for unique key prop
  title: 'Test Product',
  vendor: 'Test Vendor',
  variants: {
    edges: [{
      node: {
        price: { amount: '10.00', currencyCode: 'CZK' },
        availableForSale: true
      }
    }]
  },
  images: { edges: [] }
}]

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock fetch for both products and collections
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ products: mockProducts })
        })
      }
      if (url.includes('/api/collections')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ collections: [] })
        })
      }
      return Promise.reject(new Error('Not found'))
    }) as jest.Mock

    ;(getAllProducts as jest.Mock).mockResolvedValue({
      products: {
        edges: [{
          node: mockProducts[0]
        }]
      }
    })
  })

  it('renders loading state initially', () => {
    render(<HomePage />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('displays products after loading', async () => {
    await act(async () => {
      render(<HomePage />)
    })

    // Wait for loading spinner to disappear
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Use getAllByText since there might be multiple elements
    await waitFor(() => {
      const productElements = screen.getAllByText('Test Product')
      expect(productElements.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('displays "All Products" heading', async () => {
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'All Products' })).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
})
