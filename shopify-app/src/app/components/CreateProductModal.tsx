'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getAllCollections, getAllProducts } from '../lib/shopify';

interface Collection {
  id: string;
  title: string;
}

// Vendor icons - you can replace these with your actual vendor icons
const vendorIcons = {
  'Nike': (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.07 6.93c-.77 1.01-1.77 1.92-2.96 2.71-2.63 1.75-5.06 2.63-7.28 2.63-1.51 0-2.77-.37-3.77-1.09-1.36-.99-2.04-2.44-2.04-4.35 0-1.8.62-3.39 1.87-4.76C8.15.71 9.71 0 11.58 0c1.14 0 2.31.27 3.51.82 1.2.54 2.82 1.51 4.86 2.9L21.07 6.93z"/>
    </svg>
  ),
  'Adidas': (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.5 2.5l19 19m-19 0l19-19m-9.5 0v19"/>
    </svg>
  ),
  'Puma': (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  ),
  // Add more vendor icons as needed
};

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProductModal({ isOpen, onClose }: CreateProductModalProps) {
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
    barcode: '',
    vendor: '',
    collections: [] as string[],
    tags: [] as string[],
    weight: '',
    weightUnit: 'kg',
    inventory: '',
    images: [] as File[],
    status: 'active',
    productType: ''
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Fetch collections and tags when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCollections();
      fetchAllTags();
      fetchVendors();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    try {
      // Fetch Shopify collections
      const shopifyResponse = await getAllCollections(null);
      const shopifyCollections = shopifyResponse?.collections?.edges.map(edge => ({
        id: edge.node.id,
        title: edge.node.title
      })) || [];

      // Fetch MongoDB collections
      const mongoResponse = await fetch('/api/collections');
      const mongoData = await mongoResponse.json();
      const mongoCollections = mongoData.collections || [];

      // Combine both sets of collections
      setCollections([...shopifyCollections, ...mongoCollections]);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchAllTags = async () => {
    try {
      // Fetch tags from MongoDB
      const mongoResponse = await fetch('/api/products');
      const mongoData = await mongoResponse.json();
      const mongoTags = mongoData.tags || [];

      // Fetch tags from Shopify
      const shopifyData = await getAllProducts(null);
      const shopifyTags = shopifyData?.products?.edges
        .flatMap(edge => edge.node.tags || [])
        .filter(Boolean);

      // Combine and deduplicate tags
      const allTags = [...new Set([...mongoTags, ...shopifyTags])];
      setAvailableTags(allTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      // Fetch vendors from MongoDB
      const mongoResponse = await fetch('/api/products');
      const mongoData = await mongoResponse.json();
      
      // Fetch vendors from Shopify
      const shopifyData = await getAllProducts(null);
      const shopifyVendors = shopifyData?.products?.edges
        .map(edge => edge.node.vendor)
        .filter(Boolean);

      // Combine and deduplicate vendors
      const allVendors = [...new Set([
        ...(mongoData.vendors || []),
        ...(shopifyVendors || [])
      ])];
      
      console.log('Combined vendors:', allVendors);
      setVendors(allVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !productData.tags.includes(newTag.trim())) {
      setProductData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      // Add to available tags if it's new
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

  // Add collection creation handler
  const handleAddCollection = async () => {
    try {
      if (!newCollection.trim()) {
        throw new Error('Collection name cannot be empty');
      }

      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newCollection }),
      });

      const data = await response.json();
      console.log('Collection creation response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create collection');
      }

      if (!data.collectionId || !data.title) {
        throw new Error('Invalid response format from server');
      }

      setCollections(prev => [...prev, { id: data.collectionId, title: data.title }]);
      setProductData(prev => ({
        ...prev,
        collections: [...prev.collections, data.collectionId]
      }));
      setIsCreatingCollection(false);
      setNewCollection('');
    } catch (error) {
      console.error('Detailed error creating collection:', error);
      alert(`Failed to create collection: ${error.message}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...newPreviewUrls]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(productData).forEach(([key, value]) => {
      if (key === 'images') {
        value.forEach((image: File) => {
          formData.append('images', image);
        });
      } else if (key === 'collections' || key === 'tags') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      onClose();
      // Force a hard refresh of the page
      router.refresh();
      // Redirect to the same page to ensure fresh data
      window.location.href = window.location.href;
    } catch (error) {
      console.error('Error creating product:', error);
      alert(error.message || 'Failed to create product. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-[1200px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">Create New Product</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-800 mb-1">Barcode</label>
                    <input
                      type="text"
                      value={productData.barcode}
                      onChange={e => setProductData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-neutral-800"
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
                      <option key={collection.id} value={collection.id}>
                        {collection.title}
                      </option>
                    ))}
                  </select>

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
                          onClick={handleAddCollection}
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
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2"
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
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#fe6900] text-white rounded-md hover:bg-[#e55f00]"
            >
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
