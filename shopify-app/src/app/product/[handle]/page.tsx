import { getProduct } from '@/app/lib/shopify';
import ProductDisplay from '@/app/components/ProductDisplay';
import clientPromise from '@/app/lib/mongodb';
import { notFound } from 'next/navigation';
import { Product } from '@/app/types/shopify';

export default async function ProductPage({ params }: { params: { handle: string } }) {
  try {
    const { handle } = await params;
    const client = await clientPromise;
    const db = client.db("shopify-app");

    let customProduct = await db.collection('products').findOne({ 
      $or: [
        { handle: handle },
        { 'handle': handle },
        { handle: decodeURIComponent(handle) }
      ]
    });

    if (!customProduct) {
      const shopifyData = await getProduct(handle);
      
      if (shopifyData?.product) {
        const variants = {
          edges: shopifyData.product.variants.edges.map((edge: { node: any }) => ({
            node: {
              id: edge.node.id,
              title: edge.node.title,
              price: {
                amount: edge.node.price.amount,
                currencyCode: edge.node.price.currencyCode
              },
              compareAtPrice: edge.node.compareAtPrice ? {
                amount: edge.node.compareAtPrice.amount,
                currencyCode: edge.node.compareAtPrice.currencyCode
              } : null,
              sku: edge.node.sku || '',
              availableForSale: edge.node.availableForSale,
              stockQuantity: edge.node.availableForSale ? 1 : 0,
              isShopifyVariant: true
            }
          }))
        };

        const shopifyProduct = {
          id: shopifyData.product.id,
          title: shopifyData.product.title,
          handle: handle,
          description: shopifyData.product.description || '',
          productType: shopifyData.product.productType || '',
          vendor: shopifyData.product.vendor || '',
          isCustom: false,
          source: 'shopify',
          createdAt: shopifyData.product.createdAt,
          updatedAt: shopifyData.product.updatedAt,
          tags: shopifyData.product.tags || [],
          collections: shopifyData.product.collections || { edges: [] },
          images: shopifyData.product.images || { edges: [] },
          variants: variants // Include all variants
        };
        
        await db.collection('products').updateOne(
          { id: shopifyProduct.id },
          { $set: shopifyProduct },
          { upsert: true }
        );
        
        customProduct = await db.collection('products').findOne({ id: shopifyProduct.id });
      }
    }

    if (!customProduct) {
      console.log('Product not found:', handle);
      return notFound();
    }

    const serializedProduct = {
      ...customProduct,
      _id: customProduct._id.toString(),
      id: customProduct.id || customProduct._id.toString(),
      isCustom: customProduct.isCustom ?? false,
      images: customProduct.images || { edges: [] },
      variants: customProduct.variants || {
        edges: [{
          node: {
            id: `variant-${customProduct.id}`,
            title: 'Default Variant',
            price: { amount: '0', currencyCode: 'CZK' },
            compareAtPrice: { amount: '', currencyCode: 'CZK' },
            sku: '',
            availableForSale: true,
            stockQuantity: 0
          }
        }]
      },
      tags: customProduct.tags || [],
      collections: customProduct.collections || { edges: [] }
    };

    return <ProductDisplay product={serializedProduct} />;
  } catch (error) {
    console.error('Error loading product:', error);
    return notFound();
  }
}
