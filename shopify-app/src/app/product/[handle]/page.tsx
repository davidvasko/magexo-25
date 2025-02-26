import { getProduct } from '@/app/lib/shopify';
import ProductDisplay from '@/app/components/ProductDisplay';
import clientPromise from '@/app/lib/mongodb';
import { notFound } from 'next/navigation';
import { Product } from '@/app/types/shopify';
import { ObjectId } from 'mongodb';

function convertToPlainObject(doc: any): Product {
  if (!doc) return doc;
  
  const plainObject = {
    ...doc,
    id: doc._id ? doc._id.toString() : doc.id,
  };

  // Remove MongoDB's _id
  delete plainObject._id;

  // Convert dates to ISO strings
  if (plainObject.createdAt instanceof Date) {
    plainObject.createdAt = plainObject.createdAt.toISOString();
  }
  if (plainObject.updatedAt instanceof Date) {
    plainObject.updatedAt = plainObject.updatedAt.toISOString();
  }

  // Ensure variants and images have the correct structure
  if (!plainObject.variants?.edges) {
    plainObject.variants = {
      edges: plainObject.variants?.map((variant: any) => ({
        node: variant
      })) || []
    };
  }

  if (!plainObject.images?.edges) {
    plainObject.images = {
      edges: plainObject.images?.map((image: any) => ({
        node: image
      })) || []
    };
  }

  return plainObject;
}

async function getProductData(handle: string) {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");

    // First try to find by handle
    let customProduct = await db.collection('products').findOne({ 
      $or: [
        { handle: handle },
        { handle: handle.toLowerCase() }, // Add lowercase check
        { handle: decodeURIComponent(handle) },
        { id: { $regex: new RegExp(handle, 'i') } }, // Add ID check
        { 'variants.edges.node.id': handle } // Add variant ID check
      ]
    });

    if (!customProduct) {
      // If not found, try Shopify
      const shopifyData = await getProduct(handle);
      if (!shopifyData?.product) {
        console.log('Product not found:', handle); // Debug log
        return null;
      }
      return shopifyData.product;
    }

    console.log('Found product:', customProduct); // Debug log
    return convertToPlainObject(customProduct);
  } catch (error) {
    console.error('Error loading product:', error);
    return null;
  }
}

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const product = await getProductData(params.handle);

  if (!product) {
    notFound();
  }

  return <ProductDisplay product={product} />;
}

export async function generateStaticParams() {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const products = await db.collection('products').find({}).toArray();
    
    return products.map((product) => ({
      handle: product.handle,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
