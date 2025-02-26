'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductFilter from './ProductFilter';
import CategoryList from './CategoryList';
import { Product, Collection } from '../types/shopify';

interface ProductListProps {
  initialProducts: Product[];
  initialCollections: Collection[];
}

export default function ProductList({ initialProducts, initialCollections }: ProductListProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-[924px] mx-auto mt-12">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-neutral-600 animate-[fadeIn_0.5s_ease-in]">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-500">
              <span className="text-6xl text-white">☹</span>
            </div>
            <p className="mt-2">No products found in this category</p>
          </div>
        )}
      </div>
    </>
  );
}
