'use client';

import CategoryList from './components/CategoryList';
import ProductCard from './components/ProductCard';
import ProductFilter from './components/ProductFilter';
import { useState, useEffect } from 'react';
import { getAllProducts } from './lib/shopify';

const PRODUCTS_PER_PAGE = 9;
const PRODUCTS_PER_ROW = 4;

export default function HomePage() {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch Shopify products
        const shopifyResponse = await getAllProducts(null);
        const shopifyProducts = shopifyResponse?.products?.edges.map(edge => edge.node) || [];
        
        // Fetch custom products from MongoDB
        const mongoResponse = await fetch('/api/products');
        const mongoData = await mongoResponse.json();
        const mongoProducts = mongoData.products || [];
        
        // Combine both sets of products
        const allProductsList = [...shopifyProducts, ...mongoProducts];
        setAllProducts(allProductsList);
        setFilteredProducts(allProductsList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };

    fetchProducts();
  }, []);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    setIsLoading(true);
    
    let newFilteredProducts;
    if (!categoryId) {
      newFilteredProducts = allProducts;
    } else {
      newFilteredProducts = allProducts.filter(product => {
        // Handle both Shopify and MongoDB collections
        const productCollections = product.collections?.edges || [];
        const productCollectionIds = productCollections.map(edge => 
          edge.node.id.toString()
        );
        return productCollectionIds.includes(categoryId.toString());
      });
    }
    
    setTimeout(() => {
      setFilteredProducts(newFilteredProducts);
      setIsLoading(false);
    }, 300);
  };

  const handleFilterChange = (filteredResults) => {
    setCurrentPage(1);
    setIsLoading(true);
    let results = filteredResults;
    if (selectedCategory) {
      results = filteredResults.filter(product =>
        product.collections?.edges?.some(edge => edge.node.id === selectedCategory)
      );
    }
    setTimeout(() => {
      setFilteredProducts(results);
      setIsLoading(false);
    }, 300);
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    setCurrentPage(newPage);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  return (
    <div className="max-w-[1024px] mx-auto px-4">
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
        <h2 className="text-2xl font-bold mt-8 mb-4 text-neutral-900">
          {selectedCategory ? 'Collection Products' : 'All Products'}
        </h2>
        
        <div className="relative min-h-[800px]">
          {isLoading ? (
            <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-50">
              <div 
                data-testid="loading-spinner"
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" 
              />
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="grid grid-cols-3 gap-6">
                {currentProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={`page-${page}`}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-[#fe6900] text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-neutral-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
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
