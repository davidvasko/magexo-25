import { render, screen } from '@testing-library/react'
import ProductCard from '@/app/components/ProductCard'

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}))

// Suppress SVG fill attribute warning
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (args[0]?.includes('Received `true` for a non-boolean attribute `fill`')) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

const mockProduct = {
  id: '1',
  title: 'Test Product',
  handle: 'test-product',
  vendor: 'Test Vendor',
  variants: {
    edges: [{
      node: {
        price: { amount: '10.00', currencyCode: 'CZK' },
        availableForSale: true
      }
    }]
  },
  images: {
    edges: [{
      node: {
        url: 'test-image.jpg',
        altText: 'Test Image'
      }
    }]
  },
  tags: []
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('10 Kč')).toBeInTheDocument()
    expect(screen.getByText('In Stock')).toBeInTheDocument()
  })

  it('renders image correctly', () => {
    render(<ProductCard product={mockProduct} />)
    const image = screen.getByRole('img')
    expect(image).toBeInTheDocument()
  })

  it('links to the correct product page', () => {
    render(<ProductCard product={mockProduct} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/product/test-product')
  })
}) 