'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Product } from '../types/shopify';
// Import Swiper React components
import { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import Image from 'next/image';

// Import only main Swiper CSS
import 'swiper/css';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle both Shopify and custom product image structures
  const hasImages = product.images?.edges?.length > 0;
  const firstImage = hasImages ? product.images.edges[0].node : null;
  const secondImage = hasImages && product.images.edges.length > 1 ? product.images.edges[1].node : null;
  const price = product.variants?.edges?.[0]?.node?.price?.amount || '0';

  // Fix the URL to use /product/ instead of /products/
  const productUrl = `/product/${product.handle}`;

  // Handle tag display logic
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
    <Link href={productUrl}>
      <div 
        className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:animate-card-hover transition-all duration-300 max-w-xs mx-auto h-[420px] flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="aspect-square relative overflow-hidden bg-gray-50">
          {(firstImage && firstImage.url) ? (
            <>
              <Image
                src={firstImage.url}
                alt={firstImage.altText || product.title}
                fill
                className={`object-cover object-center transition-opacity duration-300 ${
                  isHovered && secondImage?.url ? 'opacity-0' : 'opacity-100'
                }`}
              />
              {secondImage?.url && (
                <Image
                  src={secondImage.url}
                  alt={secondImage.altText || product.title}
                  fill
                  className={`object-cover object-center transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              No image available
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.title}
          </h3>
          
          <div className="mt-auto space-y-2">
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
