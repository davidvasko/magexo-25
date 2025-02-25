'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export default function VariantModal({ isOpen, onClose, productId }: VariantModalProps) {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [variantData, setVariantData] = useState({
    title: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    stockQuantity: '0',
    availableForSale: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('isVariant', 'true');
    formData.append('parentProductId', productId);
    formData.append('title', variantData.title);
    formData.append('price', variantData.price);
    formData.append('compareAtPrice', variantData.compareAtPrice);
    formData.append('sku', variantData.sku);
    formData.append('stockQuantity', variantData.stockQuantity);
    formData.append('availableForSale', (parseInt(variantData.stockQuantity) > 0).toString());

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create variant');
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        router.refresh();
      }, 2000);

    } catch (error) {
      console.error('Error creating variant:', error);
      alert('Failed to create variant');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">Add New Variant</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 group">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-300 group-hover:rotate-90">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="relative">
              <svg
                className="w-24 h-24 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  className="animate-check"
                />
              </svg>
            </div>
            <p className="mt-4 text-xl font-medium text-neutral-800">
              Variant Added Successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">Title</label>
              <input
                type="text"
                required
                value={variantData.title}
                onChange={e => setVariantData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                placeholder="e.g., Small, Red, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                required
                value={variantData.price}
                onChange={e => setVariantData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">Compare at Price</label>
              <input
                type="number"
                step="0.01"
                value={variantData.compareAtPrice}
                onChange={e => setVariantData(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">SKU</label>
              <input
                type="text"
                value={variantData.sku}
                onChange={e => setVariantData(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                placeholder="Stock Keeping Unit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-800 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                required
                value={variantData.stockQuantity}
                onChange={e => setVariantData(prev => ({ 
                  ...prev, 
                  stockQuantity: e.target.value 
                }))}
                className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                placeholder="0"
              />
             
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#fe6900] text-white rounded-lg hover:bg-[#e55f00]"
              >
                Add Variant
              </button>
            </div>
          </form>
        )}

        <style jsx global>{`
          @keyframes check {
            0% {
              stroke-dasharray: 100;
              stroke-dashoffset: 100;
            }
            100% {
              stroke-dasharray: 100;
              stroke-dashoffset: 0;
            }
          }
          
          .animate-check {
            animation: check 0.8s ease-in-out forwards;
          }
          
          .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
