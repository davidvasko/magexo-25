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
      
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <style jsx>{`
        .product-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: 1fr;
        }

        @media (min-width: 390px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .product-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </>
  );
}
