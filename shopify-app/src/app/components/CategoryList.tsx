'use client';

import { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import { Collection } from '../types/shopify';

interface Category {
  id: string;
  title: string;
  handle?: string;
  isShopifyCollection: boolean;
}

interface CategoryListProps {
  initialCollections: Collection[];
  onCategorySelect: (categoryId: string | null) => void;
}

export default function CategoryList({ initialCollections, onCategorySelect }: CategoryListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [collections] = useState<Collection[]>(initialCollections);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCategorySelect = (categoryId: string | null) => {
    if (!isDragging) {
      setSelectedCategory(categoryId);
      onCategorySelect(categoryId);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-[1024px] mx-auto mb-12">
        <div className="flex items-center justify-between gap-2">
          <div className="w-[95%] overflow-hidden">
            <div className="flex gap-3">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="h-[36px] w-[120px] rounded-full bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="w-[40px] flex gap-1">
            <div className="h-[24px] w-4 bg-gray-100 rounded" />
            <div className="h-[24px] w-4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1024px] mx-auto mb-12">
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
              sticky: false,
              momentum: false
            }}
            onSliderFirstMove={() => setIsDragging(true)}
            onTouchEnd={() => {
              setTimeout(() => setIsDragging(false), 10);
            }}
            slidesPerView="auto"
            spaceBetween={12}
            grabCursor={true}
            resistance={true}
            resistanceRatio={0.85}
            className="categories-swiper select-none"
          >
            <SwiperSlide className="!w-auto">
              <div 
                className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                  ${!selectedCategory 
                    ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                    : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
                onClick={() => !isDragging && handleCategorySelect(null)}
              >
                All Products
              </div>
            </SwiperSlide>

            <SwiperSlide className="!w-auto">
              <div
                className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                  ${selectedCategory === 'unassigned'
                    ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                    : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                onClick={() => !isDragging && handleCategorySelect('unassigned')}
              >
                Unassigned
              </div>
            </SwiperSlide>

            {collections.map((collection) => (
              <SwiperSlide 
                key={collection.id} 
                className="!w-auto"
              >
                <div 
                  className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                    ${selectedCategory === collection.id 
                      ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                      : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
                  onClick={() => !isDragging && handleCategorySelect(collection.id)}
                >
                  {collection.title}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="flex gap-1 flex-shrink-0 w-[40px]">
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
        .swiper-slide {
          margin-right: 12px !important;
          touch-action: none !important;
        }
        .swiper-slide button {
          pointer-events: auto;
          touch-action: none !important;
        }
      `}</style>
    </div>
  );
}
