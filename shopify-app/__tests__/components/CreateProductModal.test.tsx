import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import CreateProductModal from '@/app/components/CreateProductModal'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />
}))

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    refresh: jest.fn()
  })
}))

// Mock the shopify lib functions directly with proper return values
jest.mock('@/app/lib/shopify', () => ({
  getAllCollections: jest.fn().mockResolvedValue([{
    id: 'gid://shopify/Collection/123',
    title: 'Test Collection'
  }]),
  getAllProducts: jest.fn().mockResolvedValue([]),
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

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url')

describe('CreateProductModal', () => {
  const mockOnClose = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders correctly when open', async () => {
    await act(async () => {
      render(<CreateProductModal isOpen={true} onClose={mockOnClose} />)
    })
    
    // Look specifically for the heading to avoid matching the button
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /Create New Product/i })
      expect(heading).toBeInTheDocument()
    })
  })
  
  it('does not render when closed', async () => {
    // Use a custom render to get the container
    let container;
    await act(async () => {
      const renderResult = render(<CreateProductModal isOpen={false} onClose={mockOnClose} />)
      container = renderResult.container;
    })
    
    // Check that the modal dialog is not visible
    await waitFor(() => {
      expect(container.querySelector('[class*="bg-white rounded-xl"]')).not.toBeInTheDocument()
    })
  })
  
  it('calls onClose when Cancel button is clicked', async () => {
    await act(async () => {
      render(<CreateProductModal isOpen={true} onClose={mockOnClose} />)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })
}) 