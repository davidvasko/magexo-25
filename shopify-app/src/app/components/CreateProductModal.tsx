'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAllCollections, getAllProducts } from '../lib/shopify';

interface Collection {
  id: string;
  title: string;
  isShopifyCollection?: boolean;
}



export interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'product' | 'variant';
  productId?: string;
}

export default function CreateProductModal({ isOpen, onClose, mode = 'product', productId }: CreateProductModalProps) {
  const router = useRouter();
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newCollection, setNewCollection] = useState('');
  const [newTag, setNewTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    compareAtPrice: '',
    sku: '',
    vendor: '',
    collections: [] as string[],
    tags: [] as string[],
    weight: '',
    weightUnit: 'kg',
    inventory: '',
    images: [] as File[],
    status: 'active',
    productType: '',
    stockQuantity: '0'
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      fetchAllTags();
      fetchVendors();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      const mongoCollections = data.collections || [];

      setCollections(mongoCollections.map((collection: { id: string; title: string; isShopifyCollection?: boolean }) => ({
        id: collection.id,
        title: collection.title,
        isShopifyCollection: collection.isShopifyCollection
      })));
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchAllTags = async () => {
    try {
      const mongoResponse = await fetch('/api/products');
      const mongoData = await mongoResponse.json();
      const mongoTags = mongoData.tags || [];

      const shopifyData = await getAllProducts(undefined);
      let shopifyTags: string[] = [];
      
      if (shopifyData && shopifyData.products && shopifyData.products.edges) {
        shopifyTags = shopifyData.products.edges
          .flatMap((edge: any) => edge.node.tags || [])
          .filter(Boolean);
      }

      const allTags = [...new Set([...mongoTags, ...shopifyTags])];
      setAvailableTags(allTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setAvailableTags([]);
    }
  };

  const fetchVendors = async () => {
    try {
      const mongoResponse = await fetch('/api/products');
      const mongoData = await mongoResponse.json();
      const mongoVendors = mongoData.vendors || [];
      
      const shopifyData = await getAllProducts(undefined);
      let shopifyVendors: string[] = [];
      
      if (shopifyData && shopifyData.products && shopifyData.products.edges) {
        shopifyVendors = shopifyData.products.edges
          .map((edge: any) => edge.node.vendor)
          .filter(Boolean);
      }

      const allVendors = [...new Set([...mongoVendors, ...shopifyVendors])];
      
      console.log('Combined vendors:', allVendors);
      setVendors(allVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !productData.tags.includes(newTag.trim())) {
      setProductData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      if (!availableTags.includes(newTag.trim())) {
        setAvailableTags(prev => [...prev, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const handleTagClick = (tag: string) => {
    setProductData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleCreateCollection = async () => {
    if (!newCollection.trim()) return;
    
    setIsCreatingCollection(true);
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newCollection.trim() }),
      });

      const data = await response.json();
      console.log('Collection creation response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create collection');
      }

      // Add the new collection to the list with the correct ID from the response
      const newCollectionId = data.collectionId; // Changed from data.collection.id
      const newCollectionTitle = newCollection.trim();

      setCollections(prev => [...prev, { 
        id: newCollectionId, 
        title: newCollectionTitle,
        isShopifyCollection: false
      }]);
      
      // Select the newly created collection
      setProductData(prev => ({
        ...prev,
        collections: [...prev.collections, newCollectionId]
      }));
      
      // Clear the input and hide the collection creation form
      setNewCollection('');
      setIsCreatingCollection(false);

    } catch (error) {
      console.error('Error creating collection:', error);
      alert(error instanceof Error ? error.message : 'Failed to create collection');
      setIsCreatingCollection(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviewUrls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a regular object instead of FormData
      const productPayload = {
        title: productData.title,
        description: productData.description,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice,
        sku: productData.sku,
        vendor: productData.vendor,
        productType: productData.productType,
        stockQuantity: productData.stockQuantity,
        tags: productData.tags,
        collections: productData.collections,
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productPayload),
      });

      const responseText = await response.text();
      console.log('Raw server response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error(`Server returned invalid JSON: ${responseText}`);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        router.refresh();
      }, 2000);

    } catch (error) {
      console.error('Error creating product:', error);
      alert(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center overflow-y-auto p-4
      transition-all duration-300 backdrop-blur-sm
      ${isOpen ? 'opacity-100 bg-black/25' : 'opacity-0 pointer-events-none bg-black/0'}`}
    >
      <div className={`bg-white rounded-lg shadow-xl p-6 w-full max-w-[900px] my-auto lg:my-0
        transform transition-all duration-300 ease-out
        ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">
            Create New Product
          </h2>
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
              Product Created Successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={productData.title}
                      onChange={e => setProductData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-800 mb-1">Description</label>
                    <textarea
                      rows={4}
                      value={productData.description}
                      onChange={e => setProductData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                    />
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-800 mb-1">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={productData.price}
                        onChange={e => setProductData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-800 mb-1">Compare at Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productData.compareAtPrice}
                        onChange={e => setProductData(prev => ({ ...prev, compareAtPrice: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                      />
                    </div>
                  </div>

                  {/* Inventory */}
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

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 mb-1">Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                    />
                    {previewImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {previewImages.map((url, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Collections */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-800 mb-1">Collections</label>
                  
                  {/* Collection Selection */}
                  <div className="space-y-2">
                    <select
                      multiple
                      value={productData.collections}
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

                    
                    <button
                      type="button"
                      onClick={() => setIsCreatingCollection(true)}
                      className="w-full px-4 py-2 text-[#fe6900] border border-[#fe6900] rounded-md hover:bg-[#ffe4d3]"
                    >
                      Add New Collection
                    </button>

                    {isCreatingCollection && (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={newCollection}
                          onChange={e => setNewCollection(e.target.value)}
                          placeholder="Collection name"
                          className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateCollection}
                            className="flex-1 px-4 py-2 bg-[#fe6900] text-white rounded-md hover:bg-[#e55f00]"
                          >
                            Create Collection
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingCollection(false);
                              setNewCollection('');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Selection */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-800 mb-1">Vendor</label>
                  <select
                    value={productData.vendor}
                    onChange={(e) => setProductData(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                    required
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor} value={vendor}>
                        {vendor}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Tags</label>
                  
                  {/* Add new tag input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-neutral-800"
                      placeholder="Add a new tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-[#fe6900] text-white rounded-md hover:bg-[#e55f00]"
                    >
                      Add Tag
                    </button>
                  </div>

                  {/* Available Tags */}
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Available Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagClick(tag)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            productData.tags.includes(tag)
                              ? 'bg-[#fe6900] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-[#ffe4d3]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Tags */}
                  {productData.tags.length > 0 && (
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {productData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-[#ffe4d3] text-[#fe6900] px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleTagClick(tag)}
                              className="text-[#fe6900] hover:text-[#e55f00]"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons - Full Width */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#fe6900] text-white rounded-md hover:bg-[#e55f00] transition-colors"
              >
                Create New Product
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
