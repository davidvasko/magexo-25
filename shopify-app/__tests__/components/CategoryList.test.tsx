import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import CategoryList from '@/app/components/CategoryList'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: () => ({
    get: () => null
  })
}))

describe('CategoryList', () => {
  const mockOnCategorySelect = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        collections: [{
          id: '1',
          title: 'Test Collection',
          source: 'shopify'
        }, {
          id: '2',
          title: 'Another Collection',
          source: 'mongodb'
        }]
      })
    })
  })

  it('displays collections after loading', async () => {
    render(
      <CategoryList 
        onCategorySelect={mockOnCategorySelect}
        selectedCategory={null}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Test Collection')).toBeInTheDocument()
    })
  })

  it('handles collection selection', async () => {
    render(
      <CategoryList 
        onCategorySelect={mockOnCategorySelect}
        selectedCategory={null}
      />
    )

    const collection = await waitFor(() => screen.getByText('Test Collection'))
    await act(async () => {
      fireEvent.click(collection)
    })

    expect(mockOnCategorySelect).toHaveBeenCalledWith('1')
  })

  it('shows active state for selected collection', async () => {
    render(
      <CategoryList 
        onCategorySelect={mockOnCategorySelect}
        selectedCategory="1"
      />
    )

    await waitFor(() => {
      const button = screen.getByText('Test Collection')
      expect(button).toHaveClass('bg-[#fe6900]')
    })
  })

  it('handles API errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))
    
    render(
      <CategoryList 
        onCategorySelect={mockOnCategorySelect}
        selectedCategory={null}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument()
    })
  })

  it('displays unassigned products filter', async () => {
    render(
      <CategoryList 
        onCategorySelect={mockOnCategorySelect}
        selectedCategory="unassigned"
      />
    )

    await waitFor(() => {
      const unassignedButton = screen.getByText('Unassigned')
      expect(unassignedButton).toHaveClass('bg-[#fe6900]')
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
})
