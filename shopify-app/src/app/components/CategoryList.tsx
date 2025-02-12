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
    source?: 'shopify' | 'mongodb'; // Add source to track where the collection comes from
  };
}

export default function CategoryList({ onCategorySelect, selectedCategory }: CategoryListProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    try {
      setLoading(true);
      // Fetch Shopify collections
      const shopifyResponse = await getAllCollections(null);
      const shopifyCollections = (shopifyResponse?.collections?.edges || []).map(edge => ({
        node: {
          ...edge.node,
          source: 'shopify' as const
        }
      }));
      
      // Fetch MongoDB collections
      const mongoResponse = await fetch('/api/collections');
      const mongoData = await mongoResponse.json();
      const mongoCollections = (mongoData.collections || []).map(collection => ({
        node: {
          id: collection.id,
          title: collection.title,
          description: collection.description || '',
          source: 'mongodb' as const
        }
      }));
      
      // Combine both sets of collections
      const allCollections = [...shopifyCollections, ...mongoCollections];
      console.log('All collections:', allCollections); // Debug log
      setCollections(allCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  }

  const handleCategorySelect = async (collectionId: string | null) => {
    if (!collectionId) {
      onCategorySelect(null);
      return;
    }

    // Simply pass the collection ID to parent component
    onCategorySelect(collectionId);
  };

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!collections.length) return <div>No categories found.</div>;

  return (
    <div className="max-w-[1024px] mx-auto mb-12">
      <div className="flex items-center gap-2">
        <div className="w-[90%] overflow-hidden">
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

            {/* Collection Buttons */}
            {collections.map(({ node: collection }, index) => (
              <SwiperSlide 
                key={collection.id ? `collection-${collection.id}` : `collection-index-${index}`} 
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
        <div className="flex gap-1 flex-shrink-0 w-[40px] ml-[50px]"> {/* Added fixed width */}
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
