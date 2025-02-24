import { render, screen, fireEvent } from '@testing-library/react'
import VariantModal from '@/app/components/EditVariantModal'

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    refresh: jest.fn()
  })
}))

// Mock fetch API
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true })
  })
)

describe('VariantModal', () => {
  const mockOnClose = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders correctly when open', () => {
    render(<VariantModal isOpen={true} onClose={mockOnClose} productId="123" />)
    
    // Verify main elements are present
    expect(screen.getByText('Add New Variant')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., Small, Red, etc.')).toBeInTheDocument()
    
    // Instead of finding by placeholder, find by label text followed by input
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Compare at Price')).toBeInTheDocument()
    
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Add Variant')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })
  
  it('does not render when closed', () => {
    render(<VariantModal isOpen={false} onClose={mockOnClose} productId="123" />)
    expect(screen.queryByText('Add New Variant')).not.toBeInTheDocument()
  })
  
  it('calls onClose when Cancel button is clicked', () => {
    render(<VariantModal isOpen={true} onClose={mockOnClose} productId="123" />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })
  
  it('updates form values when inputs change', () => {
    render(<VariantModal isOpen={true} onClose={mockOnClose} productId="123" />)
    
    // Fill out title field
    const titleInput = screen.getByPlaceholderText('e.g., Small, Red, etc.')
    fireEvent.change(titleInput, { target: { value: 'Test Variant' } })
    
    // Verify value was updated
    expect(titleInput).toHaveValue('Test Variant')
  })
}) 