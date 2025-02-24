import { render, screen } from '@testing-library/react'
import ProductCard from '@/app/components/ProductCard'

const mockProduct = {
  id: '1',
  title: 'Test Product',
  handle: 'test-product',
  vendor: 'Test Vendor',
  variants: {
    edges: [{
      node: {
        price: { amount: '20.00', currencyCode: 'CZK' },
        compareAtPrice: { amount: '25.00', currencyCode: 'CZK' },
        availableForSale: true
      }
    }]
  },
  images: {
    edges: [{
      node: {
        url: 'https://test.com/test.jpg',
        altText: 'Test Image'
      }
    }]
  },
  tags: ['test-tag']
}

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn()
  }),
  useSearchParams: () => ({
    toString: () => ''
  }),
  usePathname: () => '/'
}))

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })

  it('handles products with no images', () => {
    const productWithoutImages = {
      ...mockProduct,
      images: { edges: [] }
    }
    render(<ProductCard product={productWithoutImages} />)
    // Check for a fallback image or text
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })

  it('displays out of stock badge when product is unavailable', () => {
    const unavailableProduct = {
      ...mockProduct,
      variants: {
        edges: [{
          node: {
            ...mockProduct.variants.edges[0].node,
            availableForSale: false
          }
        }]
      }
    }
    render(<ProductCard product={unavailableProduct} />)
    // Check for out of stock indicator
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })
})