'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '../types/shopify';
import { useSearchParams } from 'next/navigation';

interface ProductFilterProps {
  products: Product[];
  onFilterChange: (filteredProducts: Product[], filterState: FilterState, isInitialLoad?: boolean) => void;
}

interface FilterState {
  title: string;
  minPrice: string;
  maxPrice: string;
  vendor: string;
  productType: string;
  tags: string[];
  availability: string;
  sortBy: string;
  createdAfter: string;
  createdBefore: string;
  updatedAfter: string;
  updatedBefore: string;
}

const formatDateForInput = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export default function ProductFilter({ products, onFilterChange }: ProductFilterProps) {
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const previousFiltersRef = useRef<FilterState | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    title: searchParams.get('title') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    vendor: searchParams.get('vendor') || '',
    productType: searchParams.get('productType') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    availability: searchParams.get('availability') || '',
    sortBy: searchParams.get('sortBy') || '',
    createdAfter: searchParams.get('createdAfter') || '',
    createdBefore: searchParams.get('createdBefore') || '',
    updatedAfter: searchParams.get('updatedAfter') || '',
    updatedBefore: searchParams.get('updatedBefore') || '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const previousResultsRef = useRef<Product[]>([]);

  useEffect(() => {
    if (isFirstRender.current) {
      previousFiltersRef.current = filters;
      isFirstRender.current = false;
    }
  }, []);

  useEffect(() => {
    if (JSON.stringify(previousFiltersRef.current) === JSON.stringify(filters)) {
      return;
    }

    const applyFilters = () => {
      let filteredProducts = products.filter(product => {
        if (filters.title && !product.title.toLowerCase().includes(filters.title.toLowerCase())) {
          return false;
        }

        const minPrice = parseFloat(filters.minPrice);
        const maxPrice = parseFloat(filters.maxPrice);
        const productPrice = parseFloat(product.variants.edges[0]?.node.price.amount || '0');
        
        if (!isNaN(minPrice) && productPrice < minPrice) return false;
        if (!isNaN(maxPrice) && productPrice > maxPrice) return false;

        if (filters.vendor && product.vendor !== filters.vendor) return false;

        if (filters.productType && product.productType !== filters.productType) return false;

        if (filters.tags.length > 0 && !filters.tags.every(tag => product.tags?.includes(tag))) {
          return false;
        }

        if (filters.availability) {
          const isAvailable = product.variants.edges.some(({ node }) => node.availableForSale);
          if (filters.availability === 'in_stock' && !isAvailable) return false;
          if (filters.availability === 'out_of_stock' && isAvailable) return false;
        }

        if (filters.createdAfter && new Date(product.createdAt) < new Date(filters.createdAfter)) return false;
        if (filters.createdBefore && new Date(product.createdAt) > new Date(filters.createdBefore)) return false;
        if (filters.updatedAfter && new Date(product.updatedAt) < new Date(filters.updatedAfter)) return false;
        if (filters.updatedBefore && new Date(product.updatedAt) > new Date(filters.updatedBefore)) return false;

        return true;
      });
      
      if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
          switch (filters.sortBy) {
            case 'price_asc':
              return parseFloat(a.variants.edges[0]?.node.price.amount || '0') - 
                     parseFloat(b.variants.edges[0]?.node.price.amount || '0');
            case 'price_desc':
              return parseFloat(b.variants.edges[0]?.node.price.amount || '0') - 
                     parseFloat(a.variants.edges[0]?.node.price.amount || '0');
            case 'title_asc':
              return a.title.localeCompare(b.title);
            case 'title_desc':
              return b.title.localeCompare(a.title);
            case 'created_newest':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'created_oldest':
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            default:
              return 0;
          }
        });
      }

      return filteredProducts;
    };

    const timeoutId = setTimeout(() => {
      const newResults = applyFilters();
      previousFiltersRef.current = filters;
      
      onFilterChange(newResults, filters, isFirstRender.current);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, products, onFilterChange]);

  const vendors = [...new Set(products.map(p => p.vendor).filter(Boolean))];
  const productTypes = [...new Set(products.map(p => p.productType).filter(Boolean))];
  const allTags = [...new Set(products.flatMap(p => p.tags || []))];

  return (
    <div className="bg-white shadow-md rounded-xl p-4 max-w-[1024px] mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <h2 className="text-xl font-bold text-neutral-800">Filter Products</h2>
          <button
            onClick={() => setFilters(prev => ({ ...prev, 
              title: '', minPrice: '', maxPrice: '', vendor: '', 
              productType: '', tags: [], availability: '', sortBy: '',
              createdAfter: '', createdBefore: '', updatedAfter: '', updatedBefore: '' 
            }))}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-neutral-600"
          >
            Clear Filters
          </button>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#fe6900] hover:text-[#e55f00]"
        >
          {isExpanded ? 'Collapse' : 'Expand'} Filters
        </button>
      </div>

      <div className={`grid gap-6 ${isExpanded ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-4'}`}>
        <div className="space-y-2">
          <label htmlFor="search-title" className="block text-sm font-medium text-neutral-800">
            Search by Title
          </label>
          <input
            id="search-title"
            type="text"
            placeholder="Search products..."
            value={filters.title}
            onChange={(e) => setFilters(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-2 border rounded-lg text-neutral-800 placeholder-neutral-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="vendor-select" className="block text-sm font-medium text-neutral-800">
            Vendor
          </label>
          <select
            id="vendor-select"
            value={filters.vendor}
            onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg text-neutral-800"
          >
            <option value="">All Vendors</option>
            {vendors.map(vendor => (
              <option key={vendor} value={vendor} className="text-neutral-800">{vendor}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="availability-select" className="block text-sm font-medium text-neutral-800">
            Availability
          </label>
          <select
            id="availability-select"
            value={filters.availability}
            onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg text-neutral-800"
          >
            <option value="">All Availability</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <div className={`space-y-2 ${isExpanded ? 'hidden' : ''}`}>
          <label className="block text-sm font-medium text-neutral-800">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg text-neutral-800"
          >
            <option value="">Sort By</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="title_asc">Title: A to Z</option>
            <option value="title_desc">Title: Z to A</option>
            <option value="created_newest">Newest First</option>
            <option value="created_oldest">Oldest First</option>
          </select>
        </div>

        <div className={`
          col-span-full overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out
          ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}>
          <div className="space-y-6">
            {/* First row: Price Range, Product Type, Sort By */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-800">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-neutral-800 placeholder-neutral-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-neutral-800 placeholder-neutral-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-800">Product Type</label>
                <select
                  value={filters.productType}
                  onChange={(e) => setFilters(prev => ({ ...prev, productType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                >
                  <option value="" className="text-neutral-800">All Product Types</option>
                  {productTypes.map(type => (
                    <option key={type} value={type} className="text-neutral-800">{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-800">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                >
                  <option value="">Sort By</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="title_asc">Title: A to Z</option>
                  <option value="title_desc">Title: Z to A</option>
                  <option value="created_newest">Newest First</option>
                  <option value="created_oldest">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Second row: Tags and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-800">Tags</label>
                <select
                  multiple
                  value={filters.tags}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    tags: Array.from(e.target.selectedOptions, option => option.value)
                  }))}
                  className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                >
                  {allTags.map(tag => (
                    <option key={tag} value={tag} className="text-neutral-800">{tag}</option>
                  ))}
                </select>
                <p className="text-xs text-neutral-600">Hold Ctrl/Cmd to select multiple tags</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-800">Created Date</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    placeholder="Created After"
                    value={filters.createdAfter}
                    onChange={(e) => setFilters(prev => ({ ...prev, createdAfter: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                  />
                  <input
                    type="date"
                    placeholder="Created Before"
                    value={filters.createdBefore}
                    onChange={(e) => setFilters(prev => ({ ...prev, createdBefore: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-800">Updated Date</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    placeholder="Updated After"
                    value={filters.updatedAfter}
                    onChange={(e) => setFilters(prev => ({ ...prev, updatedAfter: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                  />
                  <input
                    type="date"
                    placeholder="Updated Before"
                    value={filters.updatedBefore}
                    onChange={(e) => setFilters(prev => ({ ...prev, updatedBefore: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-neutral-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
