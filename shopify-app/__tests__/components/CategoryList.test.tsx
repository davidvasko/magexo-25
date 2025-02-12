import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { act } from 'react'
import CategoryList from '@/app/components/CategoryList'
import { getAllCollections } from '@/app/lib/shopify'

jest.mock('@/app/lib/shopify')

describe('CategoryList', () => {
  const mockOnCategorySelect = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getAllCollections as jest.Mock).mockResolvedValue({
      collections: {
        edges: [{
          node: {
            id: '1',
            title: 'Test Collection',
            source: 'shopify'
          }
        }]
      }
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        collections: [{
          id: '2',
          title: 'MongoDB Collection'
        }] 
      })
    })
  })

  it('displays collections after loading', async () => {
    await act(async () => {
      render(
        <CategoryList 
          onCategorySelect={mockOnCategorySelect} 
          selectedCategory={null} 
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Test Collection')).toBeInTheDocument()
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
})
