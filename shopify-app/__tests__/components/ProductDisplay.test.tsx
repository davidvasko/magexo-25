import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProductDisplay from '@/app/components/ProductDisplay'

const mockProduct = {
  id: '1',
  title: 'Test Product',
  description: 'Test Description',
  handle: 'test-product',
  vendor: 'Test Vendor',
  productType: 'Test Type',
  isCustom: false,
  tags: ['test-tag'],
  variants: {
    edges: [{
      node: {
        id: 'variant1',
        title: 'Default Title',
        price: { amount: '10.00', currencyCode: 'CZK' },
        availableForSale: true,
        selectedOptions: [
          { name: 'Size', value: 'M' }
        ]
      }
    }]
  },
  options: [{
    name: 'Size',
    values: ['S', 'M', 'L']
  }],
  images: {
    edges: [{
      node: {
        url: 'https://test.com/image1.jpg',
        altText: 'Test Image 1'
      }
    }]
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-02'
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}))

describe('ProductDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders product information correctly', () => {
    render(<ProductDisplay product={mockProduct} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getAllByText('Test Description')[0]).toBeInTheDocument()
  })

  it('displays correct price', () => {
    render(<ProductDisplay product={mockProduct} />)
    const priceText = screen.getByText((content) => {
      return content.includes('10') && content.includes('Kč')
    })
    expect(priceText).toBeInTheDocument()
  })

  it('displays product metadata correctly', () => {
    render(<ProductDisplay product={mockProduct} />)
    expect(screen.getByText(/Test Type/)).toBeInTheDocument()
    expect(screen.getAllByText('test-tag')[0]).toBeInTheDocument()
  })

  it('displays all product images in gallery', () => {
    render(<ProductDisplay product={mockProduct} />)
    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('alt', 'Test Image 1')
    expect(images[0].getAttribute('src')).toContain(encodeURIComponent('https://test.com/image1.jpg'))
  })

  it('handles products with no images gracefully', () => {
    const productWithoutImages = {
      ...mockProduct,
      images: { edges: [] }
    }
    render(<ProductDisplay product={productWithoutImages} />)
    expect(screen.getByText(/no image available/i)).toBeInTheDocument()
  })

  it('displays product type', () => {
    render(<ProductDisplay product={mockProduct} />)
    expect(screen.getByText('Test Type')).toBeInTheDocument()
  })

  it('displays vendor information', () => {
    render(<ProductDisplay product={mockProduct} />)
    expect(screen.getByText('Test Vendor')).toBeInTheDocument()
  })
}) 