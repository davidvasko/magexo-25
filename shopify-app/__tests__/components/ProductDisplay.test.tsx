import { render, screen } from '@testing-library/react'
import ProductDisplay from '@/app/components/ProductDisplay'

const mockProduct = {
  id: '1',
  title: 'Test Product',
  description: 'Test Description',
  vendor: 'Test Vendor',
  variants: {
    edges: [{
      node: {
        id: 'variant1',
        title: 'Default Variant',
        price: { amount: '10.00', currencyCode: 'CZK' },
        availableForSale: true
      }
    }]
  },
  images: {
    edges: [{
      node: {
        url: 'https://test.com/image.jpg',
        altText: 'Test Image'
      }
    }]
  }
}

describe('ProductDisplay', () => {
  it('renders product details correctly', () => {
    render(<ProductDisplay product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test Vendor')).toBeInTheDocument()
    expect(screen.getByText('10,00 Kč')).toBeInTheDocument()
  })

  it('displays available for sale status', () => {
    render(<ProductDisplay product={mockProduct} />)
    expect(screen.getByText('In Stock')).toBeInTheDocument()
  })
}) 