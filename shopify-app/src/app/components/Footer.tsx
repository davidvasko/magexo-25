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
      <div className="max-w-[1024px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 justify-items-center">
          {/* Logo Column */}
          <div className="flex flex-col items-center">
            <Link href="/">
              <Image
                src="/magexo_logo1.png"
                alt="Magexo Logo"
                width={200}
                height={60}
                className="w-auto h-[60px] object-contain mb-4"
              />
            </Link>
          </div>

          {/* Contact Column */}
          <div className="flex flex-col items-center text-center">
            <ul className="space-y-2 text-black">
              <li>Email: info@magexo.cz</li>
              <li>Phone: +420 123 456 789</li>
              
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8  text-center text-sm text-black">
          © {new Date().getFullYear()} Magexo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
