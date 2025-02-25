'use client';

import { useEffect, useState } from 'react';
import { getAllPages } from '../lib/shopify';
import Pagination from './Pagination';
import { Edge } from '../types/shopify';

export default function PagesList() {
  const [pages, setPages] = useState<Edge<any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  useEffect(() => {
    fetchPages();
  }, [cursor]);

  async function fetchPages() {
    try {
      setLoading(true);
      const response = await getAllPages(cursor || undefined);
      
      if (!response?.pages?.edges) {
        throw new Error('No pages found');
      }

      setPages(response.pages.edges);
      setHasNextPage(response.pages.pageInfo.hasNextPage);
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  }

  const handleNextPage = () => {
    if (pages.length > 0) {
      const lastPage = pages[pages.length - 1];
      setCursor(lastPage.cursor || null);
    }
  };

  const handlePreviousPage = () => {
    setCursor(null);
  };

  if (loading) return <div>Loading pages...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!pages.length) return <div>No pages found.</div>;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6">Store Pages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pages.map(({ node: page }: Edge<any>) => (
          <div key={page.id} className="border rounded-lg p-4 shadow">
            <h3 className="text-xl font-semibold mb-2">{page.title}</h3>
            <div 
              className="prose prose-sm max-w-none text-gray-600"
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
            <div className="mt-4 text-sm text-gray-500">
              <p>Created: {new Date(page.createdAt).toLocaleDateString()}</p>
              <p>Updated: {new Date(page.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
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