'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllPages } from '../lib/shopify';
import { Page } from '../types/shopify';
import Image from 'next/image';

export default function Footer() {
  const [pages, setPages] = useState<Page[]>([]);

  useEffect(() => {
    async function fetchPages() {
      try {
        const response = await getAllPages();
        if (response?.pages?.edges) {
          const validPages = response.pages.edges
            .map((edge: any) => edge.node)
            .filter((page: Page) => page.handle);
          setPages(validPages);
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      }
    }

    fetchPages();
  }, []);

  return (
    <footer className="bg-white border-t">
      <div className="max-w-[924px] mx-auto px-4 py-8">
        <div className="text-center text-sm text-black">
          © {new Date().getFullYear()} Magexo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
