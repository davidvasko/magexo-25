'use client';

import { useEffect, useState } from 'react';
import { getAllCollections } from '../lib/shopify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

interface CategoryListProps {
  onCategorySelect: (collectionId: string | null) => void;
  selectedCategory: string | null;
}

interface Collection {
  node: {
    id: string;
    title: string;
    description?: string;
    source?: 'shopify' | 'mongodb'; 
  };
}

export default function CategoryList({ onCategorySelect, selectedCategory }: CategoryListProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter
      const timestamp = Date.now();
      const response = await fetch(`/api/collections?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map all collections to the expected format
      const formattedCollections = data.collections.map((collection: any) => ({
        node: {
          id: collection.id,
          title: collection.title,
          description: collection.description || '',
          source: collection.source || 'mongodb'
        }
      }));
      
      setCollections(formattedCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();

    const handleCollectionsUpdate = () => {
      fetchCollections();
    };

    window.addEventListener('collectionsUpdated', handleCollectionsUpdate);
    
    // Refresh collections periodically
    const intervalId = setInterval(fetchCollections, 30000);
    
    return () => {
      window.removeEventListener('collectionsUpdated', handleCollectionsUpdate);
      clearInterval(intervalId);
    };
  }, []);

  const handleCategorySelect = (collectionId: string | null) => {
    onCategorySelect(collectionId);
  };

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!collections.length) return <div>No categories found.</div>;

  // Sort collections: Shopify collections first, then user-created collections
  const shopifyCollections = collections.filter(({ node }) => node.source === 'shopify');
  const userCollections = collections.filter(({ node }) => node.source !== 'shopify');

  return (
    <div className="max-w-[924px] mx-auto mb-12">
      <div className="flex items-center justify-between gap-2">
        <div className="w-[95%] overflow-hidden">
          <Swiper
            modules={[Navigation, FreeMode]}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            freeMode={{
              enabled: true,
              momentum: true,
              momentumRatio: 0.25,
              momentumVelocityRatio: 0.5,
            }}
            slidesPerView="auto"
            spaceBetween={12}
            grabCursor={true}
            className="categories-swiper select-none"
          >
            {/* All Products Button */}
            <SwiperSlide key="all-products" className="!w-auto">
              <button 
                onClick={() => onCategorySelect(null)}
                className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                  ${selectedCategory === null 
                    ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                    : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
              >
                All Products
              </button>
            </SwiperSlide>

            {/* Unassigned Products Button */}
            <SwiperSlide key="unassigned-products" className="!w-auto">
              <button 
                onClick={() => onCategorySelect('unassigned')}
                className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                  ${selectedCategory === 'unassigned' 
                    ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                    : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
              >
                Unassigned
              </button>
            </SwiperSlide>

            {/* Shopify Collections */}
            {shopifyCollections.map(({ node: collection }, index) => (
              <SwiperSlide 
                key={collection.id ? `shopify-${collection.id}` : `shopify-index-${index}`} 
                className="!w-auto"
              >
                <button 
                  onClick={() => handleCategorySelect(collection.id === selectedCategory ? null : collection.id)}
                  className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                    ${collection.id === selectedCategory 
                      ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                      : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
                >
                  {collection.title}
                </button>
              </SwiperSlide>
            ))}

            {/* User-created Collections */}
            {userCollections.map(({ node: collection }, index) => (
              <SwiperSlide 
                key={collection.id ? `user-${collection.id}` : `user-index-${index}`} 
                className="!w-auto"
              >
                <button 
                  onClick={() => handleCategorySelect(collection.id === selectedCategory ? null : collection.id)}
                  className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                    ${collection.id === selectedCategory 
                      ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                      : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
                >
                  {collection.title}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-1 flex-shrink-0 w-[40px] "> 
          <button 
            className="h-[24px] w-4 flex items-center justify-center bg-transparent text-[#fe6900] hover:bg-gray-50 swiper-button-prev select-none"
            aria-label="Previous"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#fe6900" className="w-2 h-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            className="h-[24px] w-4 flex items-center justify-center bg-transparent text-[#fe6900] hover:bg-gray-50 swiper-button-next select-none"
            aria-label="Next"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#fe6900" className="w-2 h-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .categories-swiper {
          overflow: hidden;
        }
        .swiper-button-prev,
        .swiper-button-next {
          position: static;
          margin: 0;
          width: auto;
          height: auto;
        }
        .swiper-button-prev:after,
        .swiper-button-next:after {
          display: none;
        }
        .swiper-button-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
