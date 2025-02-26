import ProductList from './components/ProductList';
import CategoryList from './components/CategoryList';
import { Suspense } from 'react';
import { getCollection } from './lib/mongodb';
import { getAllCollections } from './lib/shopify';
import { Product } from './types/shopify';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#fe6900]"></div>
    </div>
  );
}

export default async function Home() {
  try {
    // Fetch products
    const productsCollection = await getCollection('products');
    const products = await productsCollection.find({}).toArray();

    // Fetch collections
    const collectionsCollection = await getCollection('collections');
    const allCollections = await collectionsCollection.find({}).toArray();

    // Serialize products with their existing collections
    const serializedProducts = products.map(product => ({
      id: product._id.toString(),
      title: product.title,
      handle: product.handle,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags || [],
      collections: {
        edges: product.collections?.edges || []
      },
      variants: {
        edges: product.variants?.edges || []
      },
      images: {
        edges: product.images?.edges || []
      },
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: product.updatedAt || new Date().toISOString()
    }));

    // Separate Shopify collections from custom collections
    const shopifyCollections = allCollections
      .filter(collection => collection.isShopifyCollection || collection.source === 'shopify')
      .map(collection => ({
        id: collection.id || collection._id.toString(),
        title: collection.title || '',
        handle: collection.handle || '',
        description: collection.description || '',
        products: collection.products || { edges: [] },
        isShopifyCollection: true,
      }));

    // Get custom collections
    const customCollections = allCollections
      .filter(collection => !collection.isShopifyCollection && collection.source !== 'shopify')
      .map(collection => ({
        id: collection._id.toString(),
        title: collection.title || '',
        handle: collection.handle || '',
        description: collection.description || '',
        products: collection.products || { edges: [] },
        isShopifyCollection: false,
      }));

    // Combine collections with Shopify collections first
    const collections = [...shopifyCollections, ...customCollections]
      .filter(collection => collection.title && collection.id);

    return (
      <div className="container mx-auto px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ProductList 
            initialProducts={serializedProducts} 
            initialCollections={collections}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in Home page:', error);
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error loading data</h2>
        <p className="mt-2 text-gray-600">Please try again later</p>
      </div>
    );
  }
}
