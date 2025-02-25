'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '../types/shopify';
import { getAllProducts } from '../lib/shopify';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product & {
    collections?: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle?: string;
        };
      }>;
    };
  };
}

interface Collection {
  id: string;
  title: string;
  isShopifyCollection?: boolean;
}

export default function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const router = useRouter();
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollection, setNewCollection] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [productData, setProductData] = useState({
    title: product.title,
    description: product.description,
    price: product.variants.edges[0]?.node.price.amount || '',
    compareAtPrice: product.variants.edges[0]?.node.compareAtPrice?.amount || '',
    sku: product.variants.edges[0]?.node.sku || '',
    vendor: product.vendor,
    collections: product.collections?.edges.map(edge => 
      edge.node.id.includes('gid://') ? edge.node.id.split('/').pop() : edge.node.id
    ) || [],
    tags: product.tags || [],
    productType: product.productType,
    images: [] as File[],
    existingImages: product.images.edges.map(edge => edge.node),
    stockQuantity: product.variants.edges[0]?.node.stockQuantity?.toString() || '0',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      fetchAllTags();
      fetchVendors();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      formData.append('title', productData.title);
      formData.append('description', productData.description);
      formData.append('vendor', productData.vendor);
      formData.append('productType', productData.productType);
      formData.append('tags', JSON.stringify(productData.tags));
      
      // Format collections properly for database storage
      const selectedCollections = collections
        .filter(collection => productData.collections.includes(collection.id))
        .map(collection => ({
          id: collection.id,
          title: collection.title
        }));
      
      formData.append('collections', JSON.stringify(selectedCollections));

      const defaultVariant = product.variants.edges[0]?.node;
      const otherVariants = product.variants.edges.slice(1);

      const updatedVariants = {
        edges: [
          {
            node: {
              id: defaultVariant?.id || `variant-${product.id}`,
              title: 'Default Variant',
              price: {
                amount: productData.price,
                currencyCode: 'CZK'
              },
              compareAtPrice: {
                amount: productData.compareAtPrice,
                currencyCode: 'CZK'
              },
              sku: productData.sku,
              availableForSale: true
            }
          },
          ...otherVariants 
        ]
      };

      formData.append('variants', JSON.stringify(updatedVariants));

      if (productData.images.length > 0) {
        productData.images.forEach(image => {
          formData.append('images', image);
        });
      }

      formData.append('stockQuantity', productData.stockQuantity);
      formData.append('availableForSale', (parseInt(productData.stockQuantity) > 0).toString());

      const response = await fetch(`/api/products?id=${product.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      setShowSuccess(true);
      
      // Dispatch event immediately
      window.dispatchEvent(new CustomEvent('productUpdated'));
      
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        
        // Force a complete refresh of the page
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections([]);
    }
  };

  const fetchAllTags = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const mongoTags = data.tags || [];
      
      const shopifyData = await getAllProducts(undefined);
      let shopifyTags: string[] = [];
      
      if (shopifyData && shopifyData.products && shopifyData.products.edges) {
        shopifyTags = shopifyData.products.edges
          .flatMap((edge: any) => edge.node.tags || [])
          .filter(Boolean);
      }
      
      const allTags = [...new Set([...mongoTags, ...shopifyTags])];
      setAvailableTags(Array.from(allTags));
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAvailableTags([]);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const mongoVendors = data.vendors || [];
      
      const shopifyData = await getAllProducts(undefined);
      let shopifyVendors: string[] = [];
      
      if (shopifyData && shopifyData.products && shopifyData.products.edges) {
        shopifyVendors = shopifyData.products.edges
          .map((edge: any) => edge.node.vendor)
          .filter(Boolean);
      }
      
      const allVendors = [...new Set([...mongoVendors, ...shopifyVendors])];
      
      setVendors(Array.from(allVendors));
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const handleCreateCollection = async () => {
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newCollection }),
      });

      if (!response.ok) throw new Error('Failed to create collection');

      const data = await response.json();
      
      setCollections(prev => [...prev, {
        id: data.collectionId,
        title: data.title,
        isShopifyCollection: data.isShopifyCollection
      }]);

      setProductData(prev => ({
        ...prev,
        collections: [...prev.collections, data.collectionId]
      }));

      setNewCollection('');
      setIsCreatingCollection(false);
    } catch (error) {
      console.error('Error creating collection:', error);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Edit Product</h2>
              <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 group">
                <svg className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    Product Updated Successfully!
                  </p>
                </div>
              ) : (
                <>
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-800 mb-1">
                        Product Title
                      </label>
                      <input
                        type="text"
                        value={productData.title}
                        onChange={(e) => setProductData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg text-neutral-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-800 mb-1">
                        Description
                      </label>
                      <textarea
                        value={productData.description}
                        onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg h-32 text-neutral-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-800 mb-1">
                          Price (CZK)
                        </label>
                        <input
                          type="number"
                          value={productData.price}
                          onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                          className="w-full px-4 py-2 border rounded-lg text-neutral-800"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-800 mb-1">
                          Compare at Price (CZK)
                        </label>
                        <input
                          type="number"
                          value={productData.compareAtPrice}
                          onChange={(e) => setProductData(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                          className="w-full px-4 py-2 border rounded-lg text-neutral-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-800 mb-1">SKU</label>
                        <input
                          type="text"
                          value={productData.sku}
                          onChange={e => setProductData(prev => ({ ...prev, sku: e.target.value }))}
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
                          value={productData.stockQuantity}
                          onChange={e => setProductData(prev => ({ 
                            ...prev, 
                            stockQuantity: e.target.value 
                          }))}
                          className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-800 mb-1">
                        Vendor
                      </label>
                      <select
                        value={productData.vendor}
                        onChange={(e) => setProductData(prev => ({ ...prev, vendor: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg text-neutral-800"
                      >
                        <option value="">Select Vendor</option>
                        {vendors.map(vendor => (
                          <option key={vendor} value={vendor}>{vendor}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-800 mb-1">
                        Product Type
                      </label>
                      <input
                        type="text"
                        value={productData.productType}
                        onChange={(e) => setProductData(prev => ({ ...prev, productType: e.target.value }))}
                        className="w-full px-4 py-2 border rounded-lg text-neutral-800"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-800 mb-1">
                        Tags
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="flex-1 px-4 py-2 border rounded-lg text-neutral-800"
                          placeholder="Add a tag"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newTag.trim()) {
                              setProductData(prev => ({
                                ...prev,
                                tags: [...prev.tags, newTag.trim()]
                              }));
                              setNewTag('');
                            }
                          }}
                          className="px-4 py-2 bg-[#fe6900] text-white rounded-lg hover:bg-[#e55f00]"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {productData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2 text-neutral-800"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => {
                                setProductData(prev => ({
                                  ...prev,
                                  tags: prev.tags.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Collections Section */}
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-neutral-800 mb-1">Collections</label>
                    
                    {/* Collection Selection */}
                    <div className="space-y-2">
                      <select
                        multiple
                        value={productData.collections as string[]}
                        onChange={e => setProductData(prev => ({
                          ...prev,
                          collections: Array.from(e.target.selectedOptions, option => option.value)
                        }))}
                        className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                        size={5}
                      >
                        {collections.map(collection => (
                          <option 
                            key={collection.id} 
                            value={collection.id}
                            className="text-neutral-800"
                          >
                            {collection.title} {collection.isShopifyCollection ? '(Shopify)' : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-1">
                        Hold Ctrl/Cmd to select multiple collections
                      </p>

                      {/* Add New Collection Button */}
                      <button
                        type="button"
                        onClick={() => setIsCreatingCollection(true)}
                        className="w-full px-4 py-2 text-[#fe6900] border border-[#fe6900] rounded-md hover:bg-[#ffe4d3]"
                      >
                        Add New Collection
                      </button>

                      {/* New Collection Input */}
                      {isCreatingCollection && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={newCollection}
                            onChange={(e) => setNewCollection(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg text-neutral-800"
                            placeholder="Collection name"
                          />
                          <button
                            type="button"
                            onClick={handleCreateCollection}
                            className="px-4 py-2 bg-[#fe6900] text-white rounded-lg hover:bg-[#e55f00]"
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingCollection(false);
                              setNewCollection('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
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
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
          
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
    </div>
  );
}