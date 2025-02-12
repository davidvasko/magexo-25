import { getProduct } from '@/app/lib/shopify';
import ProductDisplay from '@/app/components/ProductDisplay';
import clientPromise from '@/app/lib/mongodb';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params }: { params: { handle: string } }) {
  try {
    // First try to find a custom product
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const customProduct = await db.collection('products').findOne({ 
      handle: params.handle
    });

    if (customProduct) {
      // Serialize the MongoDB document
      const serializedProduct = {
        ...customProduct,
        _id: customProduct._id.toString(), // Convert ObjectId to string
        id: customProduct.id || customProduct._id.toString(), // Ensure there's an id field
        images: {
          edges: customProduct.images?.edges || []
        },
        variants: {
          edges: customProduct.variants?.edges || [{
            node: {
              id: `variant-${customProduct._id}`,
              title: 'Default Variant',
              price: {
                amount: '0',
                currencyCode: 'CZK'
              },
              sku: '',
              availableForSale: true
            }
          }]
        },
        tags: customProduct.tags || [],
        collections: customProduct.collections || { edges: [] }
      };

      return <ProductDisplay product={serializedProduct} />;
    }

    // If not found, try to get a Shopify product
    const data = await getProduct(params.handle);
    
    if (!data?.product) {
      return notFound();
    }

    return <ProductDisplay product={data.product} />;
  } catch (error) {
    console.error('Error fetching product:', error);
    notFound();
  }
}
