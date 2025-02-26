'use client';

import { useState } from 'react';
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

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    onCategorySelect(categoryId);
  };

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
              momentum: true,
              momentumRatio: 0.25,
              momentumVelocityRatio: 0.5,
            }}
            slidesPerView="auto"
            spaceBetween={12}
            grabCursor={true}
            className="categories-swiper select-none"
          >
            <SwiperSlide className="!w-auto">
              <button
                onClick={() => handleCategorySelect(null)}
                className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                  ${!selectedCategory 
                    ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                    : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
              >
                All Products
              </button>
            </SwiperSlide>

            <SwiperSlide className="!w-auto">
              <button
                onClick={() => handleCategorySelect('unassigned')}
                className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                  ${selectedCategory === 'unassigned'
                    ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                    : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
              >
                Unassigned
              </button>
            </SwiperSlide>

            {collections.map((collection) => (
              <SwiperSlide 
                key={collection.id} 
                className="!w-auto"
              >
                <button 
                  onClick={() => handleCategorySelect(collection.id)}
                  className={`whitespace-nowrap px-6 py-2 rounded-full transition-all duration-300 select-none
                    ${selectedCategory === collection.id 
                      ? 'bg-[#fe6900] text-white hover:bg-[#e55f00]' 
                      : 'bg-gray-100 text-neutral-700 hover:bg-[#ffe4d3]'}`}
                >
                  {collection.title}
                </button>
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
      `}</style>
    </div>
  );
}
