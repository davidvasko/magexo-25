'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import ProductFilter from './ProductFilter';
import { Product } from '../types/shopify';

interface ProductListProps {
  initialProducts: Product[];
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);

  return (
    <>
      <ProductFilter 
        products={initialProducts} 
        onFilterChange={setFilteredProducts} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
