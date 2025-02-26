'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductFilter from './ProductFilter';
import CategoryList from './CategoryList';
import Loading from './loading';
import { Product, Collection } from '../types/shopify';
import { Pagination } from '@mui/material';

interface ProductListProps {
  initialProducts: Product[];
  initialCollections: Collection[];
}

export default function ProductList({ initialProducts, initialCollections }: ProductListProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9; // 3 rows × 3 columns

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 500); // Increased delay to ensure smooth loading

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let newFilteredProducts = [...initialProducts];

    if (selectedCategory) {
      if (selectedCategory === 'unassigned') {
        newFilteredProducts = initialProducts.filter(product => 
          !product.collections || !product.collections.edges || product.collections.edges.length === 0
        );
      } else {
        newFilteredProducts = initialProducts.filter(product => 
          product.collections?.edges?.some(edge => 
            edge.node.id === selectedCategory
          )
        );
      }
    }

    setFilteredProducts(newFilteredProducts);
  }, [selectedCategory, initialProducts]);

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    // Scroll to top of product grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) {
    return <Loading />;
  }

  return (
    <>
      <CategoryList 
        initialCollections={initialCollections}
        onCategorySelect={setSelectedCategory}
      />
      <ProductFilter 
        products={initialProducts} 
        onFilterChange={setFilteredProducts} 
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-[1024px] mx-auto mt-12">
        {currentProducts.length > 0 ? (
          currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-neutral-600 animate-[fadeIn_0.5s_ease-in]">
            <div className="inline-flex items-center justify-center">
              <svg
                className="w-20 h-20 text-red-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx={12} cy={12} r={10} />
                <path d="M8 9.05v-.1" />
                <path d="M16 9.05v-.1" />
                <path d="M16 16c-.5-1.5-2.5-2.5-4-2.5-1.5 0-3.5 1-4 2.5" />
              </svg>
            </div>
            <p className="mt-4 text-neutral-600">No products found in this category</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 mb-12">
          <Pagination 
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#666',
              },
              '& .MuiPaginationItem-page.Mui-selected': {
                backgroundColor: '#f97316', // Tailwind orange-500
                color: 'white',
                '&:hover': {
                  backgroundColor: '#ea580c', // Tailwind orange-600
                },
              },
            }}
          />
        </div>
      )}
    </>
  );
}
