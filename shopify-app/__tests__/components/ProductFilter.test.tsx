import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProductFilter from '@/app/components/ProductFilter'

describe('ProductFilter', () => {
  const mockProducts = [
    {
      id: '1',
      title: 'Test Product',
      vendor: 'Test Vendor',
      productType: 'Test Type',
      tags: ['tag1', 'tag2'],
      variants: {
        edges: [{
          node: {
            price: { amount: '10.00' },
            availableForSale: true
          }
        }]
      }
    }
  ]

  const mockOnFilterChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all filter inputs', () => {
    render(
      <ProductFilter 
        products={mockProducts} 
        onFilterChange={mockOnFilterChange} 
      />
    )

    expect(screen.getByLabelText('Search by Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Vendor')).toBeInTheDocument()
    expect(screen.getByLabelText('Availability')).toBeInTheDocument()
    expect(screen.getByLabelText('Sort By')).toBeInTheDocument()
  })

  it('filters products by title', async () => {
    render(
      <ProductFilter 
        products={mockProducts} 
        onFilterChange={mockOnFilterChange} 
      />
    )

    const searchInput = screen.getByLabelText('Search by Title')
    fireEvent.change(searchInput, { target: { value: 'Test' } })

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalled()
    }, { timeout: 1000 })
  })
})
