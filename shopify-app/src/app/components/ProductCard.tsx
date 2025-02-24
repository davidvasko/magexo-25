'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Product } from '../types/shopify';
import { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

import 'swiper/css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const hasImages = product.images?.edges?.length > 0;
  const firstImage = hasImages ? product.images.edges[0].node : null;
  const secondImage = hasImages && product.images.edges.length > 1 ? product.images.edges[1].node : null;
  const price = product.variants?.edges?.[0]?.node?.price?.amount || '0';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const currentURL = `/?${searchParams.toString()}`;
    
    router.push(`/product/${product.handle}?return=${encodeURIComponent(currentURL)}`);
  };

  const renderTags = () => {
    if (!product.tags || product.tags.length === 0) {
      return (
        <span className="inline-block bg-red-50 text-red-400 px-2 py-1 rounded-full text-xs">
          No tags available
        </span>
      );
    }

    const visibleTags = product.tags.slice(0, 3);
    const remainingCount = product.tags.length - 3;

    return (
      <>
        {visibleTags.map(tag => (
          <span 
            key={tag}
            className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs"
          >
            {tag}
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs">
            +{remainingCount}
          </span>
        )}
      </>
    );
  };

  return (
    <Link 
      href={`/product/${product.handle}?return=${encodeURIComponent(
        `/?${searchParams.toString()}`
      )}`}
      className="block cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:animate-card-hover transition-all duration-300 h-full md:h-[420px] flex flex-col cursor-pointer w-full"
      >
        <div className="aspect-square relative overflow-hidden bg-white">
          {(firstImage && firstImage.url) ? (
            <>
              <Image
                src={firstImage.url}
                alt={firstImage.altText || product.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-contain object-center transition-all duration-300 group-hover:scale-110 ${
                  isHovered && secondImage?.url ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {secondImage?.url && (
                <Image
                  src={secondImage.url}
                  alt={secondImage.altText || product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={`object-contain object-center transition-all duration-300 group-hover:scale-110 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              
              {/* Hover Buttons */}
              <div className="absolute inset-0 flex items-end justify-center p-4">
                {/* View Details Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(e);
                  }}
                  className="w-[90%] transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out bg-white hover:bg-gray-900 text-gray-900 hover:text-white py-2 px-4 rounded-lg font-medium"
                >
                  View Details
                </button>
                
                {/* Quick View Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(e);
                  }}
                  className="absolute top-4 right-4 transform translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out w-10 h-10 bg-white hover:bg-gray-900 rounded-full flex items-center justify-center group/btn"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-900 group-hover/btn:text-white transition-colors duration-300" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    style={{ margin: '-2px 0 0 -1px' }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm bg-gray-50">
              No image available
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.title}
          </h3>
          
          <div className="mt-[10px] space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-gray-900">
                {parseFloat(price).toLocaleString('cs-CZ')} Kč
              </p>
              
              <p className={`text-sm ${product.variants?.edges?.[0]?.node?.availableForSale ? 'text-green-600' : 'text-red-600'}`}>
                {product.variants?.edges?.[0]?.node?.availableForSale ? 'In Stock' : 'Out of Stock'}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {renderTags()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
