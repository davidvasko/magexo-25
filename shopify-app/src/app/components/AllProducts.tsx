'use client';

import { useEffect, useState } from 'react';
import { getAllProducts } from '../lib/shopify';
import Pagination from './Pagination';
import ProductCard from './ProductCard';
import { Edge } from '../types/shopify';

export default function AllProducts() {
  const [products, setProducts] = useState<Edge<any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [cursor]);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllProducts(cursor || undefined);
      
      if (!response?.products?.edges) {
        throw new Error('No products found');
      }

      setProducts(response.products.edges);
      setHasNextPage(response.products.pageInfo.hasNextPage);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }

  const handleNextPage = () => {
    if (products.length > 0) {
      const lastProduct = products[products.length - 1];
      setCursor(lastProduct.cursor || null);
    }
  };

  const handlePreviousPage = () => {
    setCursor(null);
  };

  if (loading) return <div>Loading products...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!products.length) return <div>No products found.</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((edge) => (
          <ProductCard key={edge.node.id} product={edge.node} />
        ))}
      </div>
      <Pagination
        hasNextPage={hasNextPage}
        hasPreviousPage={!!cursor}
        onNextPage={handleNextPage}
        onPreviousPage={handlePreviousPage}
      />
    </div>
  );
}
