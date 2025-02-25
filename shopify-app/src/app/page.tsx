'use client';

import CategoryList from './components/CategoryList';
import ProductCard from './components/ProductCard';
import ProductFilter from './components/ProductFilter';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { getAllProducts } from './lib/shopify';
import { useSwipeable } from 'react-swipeable';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product } from './types/shopify';

// Define the FilterState interface to match the one in ProductFilter
interface FilterState {
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  vendors?: string[];
  productTypes?: string[];
  tags?: string[];
  inStock?: boolean;
}

const PRODUCTS_PER_ROW = 4;

const ArrowLeft = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2} 
    stroke="currentColor" 
    className="w-[0.9rem] h-[0.9rem]"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15.75 19.5L8.25 12l7.5-7.5" 
    />
  </svg>
);

const ArrowRight = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={2} 
    stroke="currentColor" 
    className="w-[0.9rem] h-[0.9rem]"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M8.25 4.5l7.5 7.5-7.5 7.5" 
    />
  </svg>
);

const paginationStyles = {
  track: "relative w-48 h-2 bg-gray-200 rounded-full cursor-pointer touch-none",
  thumb: "absolute h-full bg-[#fe6900] rounded-full transition-all duration-300 cursor-grab active:cursor-grabbing",
  numbers: "absolute w-full flex justify-center items-center gap-4 mt-6 select-none",
  pageNumber: "cursor-pointer transition-all duration-300 transform origin-center text-xl font-medium",
  arrow: "cursor-pointer text-[#fe6900] hover:text-[#e55f00] transition-colors duration-200 flex items-center justify-center"
};

const getProductsPerPage = () => {
  if (typeof window !== 'undefined') {
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 10 : 9;
    return count;
  }
  return 9;
};

function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );

  const [dragPosition, setDragPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [productsPerPage, setProductsPerPage] = useState(getProductsPerPage());

  useEffect(() => {
    const handleResize = () => {
      const newCount = getProductsPerPage();
      setProductsPerPage(newCount);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateURL = (newPage?: number, newCategory?: string | null, newFilters?: any) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    const newParams = new URLSearchParams();
    
    if (newPage && newPage.toString() !== currentParams.get('page')) {
      newParams.set('page', newPage.toString());
    } else if (currentParams.has('page')) {
      newParams.set('page', currentParams.get('page')!);
    }
    
    if (newCategory !== undefined) {
      if (newCategory && newCategory !== currentParams.get('category')) {
        newParams.set('category', newCategory);
      }
    } else if (currentParams.has('category')) {
      newParams.set('category', currentParams.get('category')!);
    }
    
    if (newFilters) {
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && typeof value !== 'undefined' && (typeof value !== 'string' || value.length > 0)) {
          if (Array.isArray(value)) {
            newParams.set(key, value.join(','));
          } else {
            newParams.set(key, value.toString());
          }
        } else {
          newParams.delete(key);
        }
      });
    }
    
    const newURL = `/?${newParams.toString()}`;
    if (newURL !== window.location.pathname + window.location.search) {
      router.push(newURL);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        await fetch('/api/sync', { method: 'POST' });
        
        const response = await fetch('/api/products');
        const data = await response.json();
        const allProductsList = data.products || [];

        let filteredList;
        
        if (selectedCategory === 'unassigned') {
          filteredList = allProductsList.filter((product: any) => {
            // Check if collections is undefined, null, empty object, or has empty edges array
            return !product.collections || 
                   !product.collections.edges || 
                   product.collections.edges.length === 0;
          });
        } else if (selectedCategory) {
          filteredList = allProductsList.filter((product: any) => {
            const productCollections = product.collections?.edges || [];
            return productCollections.some((edge: any) => {
              const collectionId = edge.node.id;
              if (!collectionId) return false;
              
              const normalizedCollectionId = collectionId.includes('gid://')
                ? collectionId.split('/').pop()
                : collectionId;
              const normalizedSelectedCategory = selectedCategory.includes('gid://')
                ? selectedCategory.split('/').pop()
                : selectedCategory;
              
              return normalizedCollectionId === normalizedSelectedCategory;
            });
          });
        } else {
          filteredList = allProductsList;
        }

        setAllProducts(allProductsList);
        setFilteredProducts(filteredList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

   
  useEffect(() => {
    const pageFromURL = parseInt(searchParams.get('page') || '1');
    if (!isLoading && pageFromURL !== currentPage) {
      setCurrentPage(pageFromURL);
    }
  }, [searchParams, isLoading]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    updateURL(1, categoryId);
  };

  const handleFilterChange = (
    filteredProducts: Product[], 
    filterState: FilterState, 
    isInitialLoad?: boolean
  ) => {
    setFilteredProducts(filteredProducts);
    
    const params = new URLSearchParams(window.location.search);
    
    Object.entries(filterState).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(','));
          } else {
            params.delete(key);
          }
        } else if (typeof value === 'string') {
          if (value.length > 0) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        } else if (typeof value === 'boolean') {
          params.set(key, value.toString());
        } else {
          params.set(key, String(value));
        }
      } else {
        params.delete(key);
      }
    });
    
    const currentPage = searchParams.get('page');
    if (currentPage) {
      params.set('page', currentPage);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage) return; 
    setIsLoading(true);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    
    const newURL = `/?${params.toString()}`;
    router.push(newURL);
    
    setCurrentPage(newPage);
    setDragPosition(((newPage - 1) / totalPages) * 100);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [currentPage, productsPerPage, filteredProducts]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    },
    onSwipedRight: () => {
      if (currentPage > 1) {
        handlePageChange(currentPage - 1);
      }
    }
  });

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || isDragging) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPosition = x / rect.width;
    const newPage = Math.ceil(clickPosition * totalPages);
    if (newPage !== currentPage) {
      handlePageChange(Math.min(Math.max(1, newPage), totalPages));
    }
  };

  const handleNumberClick = (pageNum: number) => {
    if (pageNum === currentPage) return;
    handlePageChange(pageNum);
  };

  const handleArrowClick = (direction: 'prev' | 'next') => {
    const newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;
    if (newPage >= 1 && newPage <= totalPages) {
      handlePageChange(newPage);
    }
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setDragPosition(((currentPage - 1) / totalPages) * 100);
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const dx = clientX - startX;
    const trackWidth = trackRef.current.offsetWidth;
    const percentMoved = (dx / trackWidth) * 100;
    
    const newPosition = Math.max(0, Math.min(dragPosition + percentMoved, 100 - (100 / totalPages)));
    setDragPosition(newPosition);
    setStartX(clientX);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const newPage = Math.round((dragPosition / 100) * totalPages) + 1;
    handlePageChange(Math.min(Math.max(1, newPage), totalPages));
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, dragPosition]);

  useEffect(() => {
    if (!isDragging) {
      setDragPosition(((currentPage - 1) / totalPages) * 100);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      handlePageChange(totalPages);
    }
  }, [totalPages, productsPerPage]);

  // Add this effect to listen for collection updates
  useEffect(() => {
    const handleCollectionsUpdated = () => {
      // Refresh the page when collections are updated
      window.location.reload();
    };
    
    window.addEventListener('collectionsUpdated', handleCollectionsUpdated);
    
    return () => {
      window.removeEventListener('collectionsUpdated', handleCollectionsUpdated);
    };
  }, []);

  return (
    <div className="max-w-[924px] mx-auto px-4">
      <CategoryList 
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
      
      <div className="mb-8">
        <ProductFilter 
          products={allProducts}
          onFilterChange={handleFilterChange}
        />
      </div>
      
      <div className="min-h-[400px]">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold mt-8 mb-4 text-neutral-900">
            {selectedCategory ? 'Collection Products' : 'All Products'}
          </h2>
          <span className="text-sm font-medium text-neutral-600 mt-8 mb-4">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} 
          </span>
        </div>
        
        <div className="relative min-h-[800px]">
          {isLoading ? (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-50">
              <div 
                data-testid="loading-spinner"
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" 
              />
            </div>
          ) : (
            <div className="animate-fade-in" {...swipeHandlers}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {currentProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 mb-12 flex items-center justify-center">
                  <div className="relative">
                    <div
                      ref={trackRef}
                      className={paginationStyles.track}
                      onClick={handleTrackClick}
                      onMouseDown={handleDragStart}
                      onTouchStart={handleDragStart}
                      onMouseMove={handleDragMove}
                      onTouchMove={handleDragMove}
                    >
                      <div
                        className={paginationStyles.thumb}
                        style={{
                          width: `${100 / totalPages}%`,
                          left: `${dragPosition}%`,
                          transition: isDragging ? 'none' : 'left 0.3s ease-out'
                        }}
                      />
                      <div className={paginationStyles.numbers}>
                        {/* Left Arrow */}
                        <button
                          onClick={() => handleArrowClick('prev')}
                          className={`${paginationStyles.arrow} ${
                            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={currentPage === 1}
                        >
                          <ArrowLeft />
                        </button>

                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          const pagePosition = ((pageNum - 1) / totalPages) * 100;
                          const distance = Math.abs(pagePosition - dragPosition);
                          const maxDistance = totalPages > 1 ? 100 / totalPages : 100;
                          
                          // Calculate scale based on distance from current position
                          const scale = distance < maxDistance ? 
                            1 + (0.3 * (1 - distance / maxDistance)) : 
                            0.7;
                          
                          // Calculate color transition based on distance
                          const colorIntensity = Math.max(0, Math.min(1, 1 - (distance / maxDistance)));
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handleNumberClick(pageNum)}
                              className={`${paginationStyles.pageNumber}`}
                              style={{
                                transform: `scale(${scale})`,
                                color: colorIntensity > 0.5 ? '#fe6900' : '#666666',
                                opacity: colorIntensity || 0.5, // Provide fallback value if colorIntensity is NaN
                                transition: isDragging ? 'none' : 'all 0.3s ease-out'
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        {/* Right Arrow */}
                        <button
                          onClick={() => handleArrowClick('next')}
                          className={`${paginationStyles.arrow} ${
                            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={currentPage === totalPages}
                        >
                          <ArrowRight />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center text-neutral-800 py-12">
            No products found matching the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
}

// Wrap the HomePage component with Suspense
export default function HomePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
