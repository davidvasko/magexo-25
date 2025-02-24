import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import EditProductModal from '@/app/components/EditProductModal'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    refresh: jest.fn()
  })
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}))

// Mock the shopify lib functions directly with proper return values
jest.mock('@/app/lib/shopify', () => ({
  getAllCollections: jest.fn().mockResolvedValue([{
    id: 'gid://shopify/Collection/123',
    title: 'Test Collection'
  }]),
  getAllTags: jest.fn().mockResolvedValue(['tag1', 'tag2']),
  getAllVendors: jest.fn().mockResolvedValue(['Test Vendor'])
}))

// Mock fetch API
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      success: true,
      collections: [{
        id: 'gid://shopify/Collection/123',
        title: 'Test Collection'
      }],
      tags: ['tag1', 'tag2'],
      vendors: ['Test Vendor']
    })
  })
)

// Create a simpler mock product to avoid rendering complexities
const mockProduct = {
  id: '123',
  title: 'Test Product',
  handle: 'test-product',
  description: 'Test description',
  vendor: 'Test Vendor',
  productType: 'Test Type',
  tags: ['tag1', 'tag2'],
  variants: {
    edges: [
      {
        node: {
          id: 'variant-123',
          price: { amount: '99.99' },
          compareAtPrice: { amount: '129.99' },
          sku: 'TEST-SKU-123',
          stockQuantity: 10,
          title: 'Default Title'
        }
      }
    ]
  },
  collections: {
    edges: [
      { node: { id: 'gid://shopify/Collection/123', title: 'Test Collection' } }
    ]
  },
  images: {
    edges: []
  }
}

describe('EditProductModal', () => {
  const mockOnClose = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders correctly when open', async () => {
    await act(async () => {
      render(<EditProductModal isOpen={true} onClose={mockOnClose} product={mockProduct} />)
    })
    
    // Check for the modal title specifically in a heading element
    const heading = screen.getByRole('heading', { name: /Edit Product/i })
    expect(heading).toBeInTheDocument()
  })
  
  it('has a hidden class on modal container when closed', async () => {
    let result;
    await act(async () => {
      result = render(<EditProductModal isOpen={false} onClose={mockOnClose} product={mockProduct} />)
    })
    
    // Check for the modal container with 'hidden' class
    const modalContainer = result.container.querySelector('.fixed.inset-0.z-50.hidden')
    expect(modalContainer).toBeInTheDocument()
  })
  
  it('calls onClose when Cancel button is clicked', async () => {
    await act(async () => {
      render(<EditProductModal isOpen={true} onClose={mockOnClose} product={mockProduct} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })
}) 