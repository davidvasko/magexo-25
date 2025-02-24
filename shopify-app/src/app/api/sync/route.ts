import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { getAllProducts, getAllCollections } from '../../lib/shopify';

async function cleanupDuplicates(db: any) {
  const duplicateProducts = await db.collection('products').aggregate([
    {
      $group: {
        _id: "$id",
        count: { $sum: 1 },
        docs: { $push: { _id: "$_id", updatedAt: "$updatedAt" } }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    }
  ]).toArray();

  for (const dup of duplicateProducts) {
    const sorted = dup.docs.sort((a: any, b: any) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const [keep, ...remove] = sorted;
    
    if (remove.length > 0) {
      await db.collection('products').deleteMany({
        _id: { $in: remove.map((doc: any) => doc._id) }
      });
    }
  }
}

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");

    await cleanupDuplicates(db);

    const existingProducts = await db.collection('products').find({}).toArray();
    const existingCollections = await db.collection('collections').find({}).toArray();
    
    const existingProductIds = new Set(existingProducts.map(p => p.id));
    const existingCollectionIds = new Set(existingCollections.map(c => c.id));

    const shopifyCollections = await getAllCollections(null);
    
    const collectionsToUpsert = shopifyCollections?.collections?.edges.map(edge => ({
      id: edge.node.id,
      title: edge.node.title,
      handle: edge.node.handle,
      description: edge.node.description || '',
      isShopifyCollection: true,
      source: 'shopify',
      updatedAt: new Date().toISOString()
    })) || [];

    for (const collection of collectionsToUpsert) {
      await db.collection('collections').updateOne(
        { id: collection.id },
        { 
          $set: collection,
          $setOnInsert: { createdAt: new Date().toISOString() }
        },
        { upsert: true }
      );
    }

    const shopifyProducts = await getAllProducts(null);
    
    console.log('Sync - Processing products:', {
      totalProducts: shopifyProducts?.products?.edges?.length
    });

    const productsToUpsert = shopifyProducts?.products?.edges.map(edge => {
      const product = edge.node;
      
      console.log(`Processing product ${product.title}:`, {
        variantsCount: product.variants?.edges?.length,
        variants: product.variants?.edges
      });

      const formattedCollections = {
        edges: (product.collections?.edges || []).map(colEdge => ({
          node: {
            id: colEdge.node.id,
            title: colEdge.node.title,
            handle: colEdge.node.handle
          }
        }))
      };

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        description: product.description || '',
        productType: product.productType || '',
        vendor: product.vendor || '',
        tags: product.tags || [],
        isShopifyProduct: true,
        source: 'shopify',
        collections: formattedCollections,
        updatedAt: new Date().toISOString(),
        variants: {
          edges: product.variants.edges.map(variant => ({
            node: {
              id: variant.node.id,
              title: variant.node.title,
              price: variant.node.price || { amount: '0', currencyCode: 'CZK' },
              compareAtPrice: variant.node.compareAtPrice || { amount: '', currencyCode: 'CZK' },
              sku: variant.node.sku || '',
              availableForSale: variant.node.availableForSale || false,
              stockQuantity: variant.node.availableForSale ? 1 : 0,
              isShopifyVariant: true
            }
          }))
        },
        images: product.images || { edges: [] }
      };
    }) || [];

    for (const product of productsToUpsert) {
      await db.collection('products').updateOne(
        { id: product.id },
        { 
          $set: product,
          $setOnInsert: { createdAt: new Date().toISOString() }
        },
        { upsert: true }
      );
    }

    await cleanupDuplicates(db);

    return NextResponse.json({ 
      success: true,
      collectionsProcessed: collectionsToUpsert.length,
      productsProcessed: productsToUpsert.length
    });
  } catch (error) {
    console.error('Error syncing data:', error);
    return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
  }
} 