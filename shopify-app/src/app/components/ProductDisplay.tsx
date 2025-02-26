'use client';

import { Product } from '../types/shopify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CreateProductModal from './CreateProductModal';
import Image from 'next/image';
import EditProductModal from './EditProductModal';
import EditVariantModal from './EditVariantModal';

import 'swiper/css';

interface ProductDisplayProps {
  product: Product;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function ProductDisplay({ product }: ProductDisplayProps) {
  const router = useRouter();
  const hasMultipleImages = product.images.edges.length > 1;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  
  const firstVariant = product.variants?.edges?.[0]?.node;


  const handleDelete = async () => {
    if (!product.isCustom) return;
    
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products?id=${product.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          router.push('/');
          router.refresh();
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete product');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (window.confirm('Are you sure you want to delete this variant?')) {
      try {
        const response = await fetch(`/api/products?id=${product.id}&variantId=${variantId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete variant');
        }

        router.refresh();
      } catch (error) {
        console.error('Error deleting variant:', error);
        alert('Failed to delete variant');
      }
    }
  };

  return (
    <>
      <div className="px-6 lg:px-8 py-8">
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="relative">
            {product.images.edges.length > 0 ? (
              <Swiper
                modules={[Navigation, Pagination]}
                navigation={hasMultipleImages}
                pagination={hasMultipleImages ? { clickable: true } : false}
                loop={hasMultipleImages}
                className="aspect-square rounded-lg overflow-hidden"
              >
                {product.images.edges.map(({ node: image }) => (
                  <SwiperSlide key={image.url}>
                    <Image
                      src={image.url}
                      alt={image.altText || product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-contain"
                      priority
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
              <div className="flex gap-2">
                {/* Edit button */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300"
                  title="Edit Product"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fe6900"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="hover:stroke-[#e55f00]"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {/* Existing delete button - only show for custom products */}
                {product.isCustom && (
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300"
                    title="Delete Product"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fe6900"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="hover:stroke-[#e55f00]"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Vendor & Type */}
            <div className="flex flex-wrap gap-4">
              {product.vendor && (
                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4 text-[#fe6900]"
                  >
                    <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 007.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 004.902-5.652l-1.3-1.299a1.875 1.875 0 00-1.325-.549H5.223z" />
                    <path fillRule="evenodd" d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 009.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 002.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3zm3-6a.75.75 0 01.75-.75h3a.75.75 0 01.75.75v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-3zm8.25-.75a.75.75 0 00-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-5.25a.75.75 0 00-.75-.75h-3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#fe6900]">{product.vendor}</span>
                </div>
              )}
              {product.productType && (
                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm">
                  <span className="text-gray-600">Type:</span>{' '}
                  <span className="text-gray-900 font-medium">{product.productType}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            )}

            {/* Variants */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Variants</h2>
                <button
                  onClick={() => setIsVariantModalOpen(true)}
                  className="px-4 py-2 bg-[#fe6900] text-white rounded-md hover:bg-[#e55f00] transition-colors flex items-center gap-2"
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Variant
                </button>
              </div>
              <div className="space-y-4">
                {product.variants.edges.map(({ node: variant }, index) => (
                  <div 
                    key={variant.id} 
                    className="bg-white border border-gray-200 p-4 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{variant.title}</h3>
                        <p className="text-sm text-gray-500">SKU: {variant.sku}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-baseline gap-2 justify-end">
                            {variant.compareAtPrice?.amount && parseFloat(variant.compareAtPrice.amount) > 0 && (
                              <p className="text-lg line-through text-gray-500">
                                {parseFloat(variant.compareAtPrice.amount).toLocaleString('cs-CZ')} Kč
                              </p>
                            )}
                            <p className="text-lg font-bold text-gray-900">
                              {parseFloat(variant.price.amount).toLocaleString('cs-CZ')} Kč
                            </p>
                          </div>
                          <p className={`text-sm ${variant.availableForSale ? 'text-green-600' : 'text-red-600'}`}>
                            {variant.availableForSale ? 'In Stock' : 'Out of Stock'}
                          </p>
                        </div>
                        {/* Only show delete button for non-Shopify variants */}
                        {!variant.isShopifyVariant && (
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300"
                            title="Delete Variant"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#fe6900"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="hover:stroke-[#e55f00]"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <span 
                    key={`tag-${index}-${tag}`}
                    className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

           {/* Timestamps */}
            <div className="text-sm text-gray-500 border-t border-gray-200 pt-4 mt-6">
              <p>Created: {formatDate(product.createdAt)}</p>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <p>Updated: {formatDate(product.updatedAt)}</p>
                <button
                  onClick={handleBack}
                  className="mt-8 md:mt-0 text-[#fe6900] hover:text-[#e55f00] flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Back to Products
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode="variant"
        productId={product.id}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        product={product}
      />

      <EditVariantModal
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        productId={product.id}
      />

      <style jsx global>{`
        .swiper-button-next,
        .swiper-button-prev {
          color: #6B7280 !important; /* Change to gray color */
        }
        
        .swiper-button-next:hover,
        .swiper-button-prev:hover {
          color: #4B5563 !important; /* Darker gray on hover */
        }
        
        .swiper-pagination-bullet-active {
          background: #6B7280 !important; /* Gray pagination dots */
        }
      `}</style>
    </>
  );
}