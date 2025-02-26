import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { MongoProduct } from '../../lib/productSchema';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getAllVendors } from '../../lib/shopify';
import { ObjectId, Document, WithId } from 'mongodb';
import { getCollection } from '../../lib/mongodb';

// Define interfaces for type safety
interface CollectionEdge {
  node: {
    id: string;
    title?: string;
    handle?: string;
  }
}

interface ImageEdge {
  node: {
    url: string;
    altText: string;
  }
}

// Define a type that combines MongoDB document with our MongoProduct
type MongoDBProduct = WithId<Document> & Partial<MongoProduct>;

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');
    
    // If a specific product ID is requested
    if (productId) {
      let query;
      if (productId.toString().startsWith('gid://')) {
        query = { id: productId };
      } else {
        try {
          query = { _id: new ObjectId(productId) };
        } catch {
          query = { id: productId };
        }
      }
      
      const product = await db.collection('products').findOne(query);
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      
      const formattedProduct = {
        ...product,
        _id: product._id.toString(),
        collections: product.collections || { edges: [] },
        images: product.images || { edges: [] },
        variants: product.variants || {
          edges: [{
            node: {
              id: `variant-${product._id}`,
              title: 'Default Variant',
              price: { amount: '0', currencyCode: 'CZK' },
              sku: '',
              availableForSale: true
            }
          }]
        },
        tags: product.tags || []
      };
      
      return NextResponse.json({ products: [formattedProduct] });
    }
    
    // Original code for fetching all products
    const collections = await db.collection('collections').find({}).toArray();
    const collectionsMap = new Map();

    collections.forEach((collection: any) => {
      const id = collection.id || collection._id.toString();
      collectionsMap.set(id, {
        title: collection.title,
        handle: collection.handle || ''
      });
    });
    
    const products = await db.collection('products').find({}).toArray();
    const allTags = [...new Set(products.flatMap(product => product.tags || []))];

    const formattedProducts = products.map((product: MongoDBProduct) => {
      let formattedCollections = { edges: [] as CollectionEdge[] };
      
      if (product.collections) {
        if (product.collections.edges) {
          formattedCollections = {
            edges: product.collections.edges.map((edge: any) => {
              if (!edge.node) {
                edge.node = { id: '', title: '' };
              }
              
              const collectionId = edge.node.id;
              const collectionInfo = collectionsMap.get(collectionId);
              
              return {
                node: {
                  id: edge.node.id,
                  title: collectionInfo?.title || edge.node.title || '',
                  handle: collectionInfo?.handle || edge.node.handle || ''
                }
              };
            })
          };
        } else if (Array.isArray(product.collections)) {
          formattedCollections = {
            edges: product.collections.map((collection: any) => {
              const collectionId = typeof collection === 'string' ? collection : collection.id;
              const collectionInfo = collectionsMap.get(collectionId);
              
              return {
                node: {
                  id: collectionId || '',
                  title: collectionInfo?.title || 
                         (typeof collection !== 'string' ? collection.title : '') || '',
                  handle: collectionInfo?.handle || 
                          (typeof collection !== 'string' ? collection.handle : '') || ''
                }
              };
            })
          };
        }
      }
      
      return {
        ...product,
        _id: product._id.toString(),
        collections: formattedCollections,
        images: product.images || { edges: [] },
        variants: product.variants || {
          edges: [{
            node: {
              id: `variant-${product._id}`,
              title: 'Default Variant',
              price: { amount: '0', currencyCode: 'CZK' },
              sku: '',
              availableForSale: true
            }
          }]
        },
        tags: product.tags || [],
        isCustom: product.isCustom || false
      };
    });
    
    return NextResponse.json({ 
      products: formattedProducts,
      tags: allTags,
      vendors: [...new Set(products.map(product => product.vendor).filter(Boolean))]
    });
  } catch (error) {
    console.error('Error in GET products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db("shopify-app");
    
    // Handle variant creation
    if (data.isVariant) {
      const { parentProductId, variant } = data;
      
      // Validate required fields
      if (!parentProductId || !variant.title || !variant.price) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Find the parent product
      const product = await db.collection('products').findOne({
        _id: new ObjectId(parentProductId)
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Parent product not found' },
          { status: 404 }
        );
      }

      // Create the new variant
      const newVariant = {
        id: new ObjectId().toString(), // Generate a new ID for the variant
        ...variant,
        price: {
          amount: variant.price.toString(),
          currencyCode: 'USD'
        },
        compareAtPrice: variant.compareAtPrice ? {
          amount: variant.compareAtPrice.toString(),
          currencyCode: 'USD'
        } : null
      };

      // Initialize variants if it doesn't exist
      if (!product.variants) {
        await db.collection('products').updateOne(
          { _id: new ObjectId(parentProductId) },
          { 
            $set: { 
              variants: { 
                edges: [] 
              } 
            } 
          }
        );
      }

      // Update the product with the new variant using $push with proper typing
      const result = await db.collection('products').updateOne(
        { _id: new ObjectId(parentProductId) },
        { 
          $push: { 
            'variants.edges': { 
              node: newVariant 
            } 
          } as any // Type assertion needed for MongoDB operator
        }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to add variant' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, variant: newVariant });
    }

    const { title } = data;
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const product = {
      id: `custom-${new Date().getTime()}`,
      title,
      description: data.description || '',
      handle,
      productType: data.productType || '',
      vendor: data.vendor || '',
      tags: data.tags || [],
      variants: {
        edges: [{
          node: {
            id: `variant-${new Date().getTime()}`,
            title: 'Default Variant',
            price: {
              amount: data.price || '0',
              currencyCode: 'CZK'
            },
            compareAtPrice: data.compareAtPrice ? {
              amount: data.compareAtPrice,
              currencyCode: 'CZK'
            } : null,
            sku: data.sku || '',
            availableForSale: true,
            stockQuantity: parseInt(data.stockQuantity) || 0
          }
        }]
      },
      images: { edges: [] },
      collections: { 
        edges: (data.collections || []).map((collectionId: string) => ({
          node: {
            id: collectionId,
            title: ''
          }
        }))
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true
    };

    await db.collection('products').insertOne(product);

    return NextResponse.json({ 
      success: true, 
      product 
    });

  } catch (error) {
    console.error('Error in POST products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const variantId = searchParams.get('variantId');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const collection = await getCollection('products');
    
    // If variantId is provided, we're deleting a variant
    if (variantId) {
      const product = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Check if this is the only variant
      if (product.variants.edges.length <= 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the default variant' 
        }, { status: 400 });
      }

      // Check if trying to delete the default variant (first variant)
      const isDefaultVariant = product.variants.edges[0].node.id === variantId;
      if (isDefaultVariant) {
        return NextResponse.json({ 
          error: 'Cannot delete the default variant' 
        }, { status: 400 });
      }

      // Filter out the variant to be deleted
      const updatedVariants = {
        edges: product.variants.edges.filter(
          (edge: any) => edge.node.id !== variantId
        )
      };

      // Update the product with the new variants array
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            variants: updatedVariants,
            updatedAt: new Date().toISOString()
          } 
        }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json({ error: 'Failed to delete variant' }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // If no variantId, we're deleting the entire product
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const productId = new URL(request.url).searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("shopify-app");

    const collections = JSON.parse(formData.get('collections') as string || '[]');
    const variants = JSON.parse(formData.get('variants') as string || '[]');
    const stockQuantity = formData.get('stockQuantity');

    if (variants.edges && variants.edges.length > 0) {
      variants.edges[0].node = {
        ...variants.edges[0].node,
        stockQuantity: parseInt(stockQuantity as string || '0'),
        availableForSale: parseInt(stockQuantity as string || '0') > 0
      };
    }
    
    // Format collections properly for database storage
    const formattedCollections = {
      edges: collections.map((collection: any) => {
        // Handle both string IDs and object formats
        if (typeof collection === 'string') {
          return {
            node: {
              id: collection,
              title: '' // Title will be populated when retrieved
            }
          };
        } else {
          return {
            node: {
              id: collection.id || '',
              title: collection.title || ''
            }
          };
        }
      })
    };
    
    const updateData = {
      title: formData.get('title'),
      description: formData.get('description'),
      vendor: formData.get('vendor'),
      productType: formData.get('productType'),
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      collections: formattedCollections,
      variants: variants,
      updatedAt: new Date().toISOString()
    };

    let query;
    if (productId.toString().startsWith('gid://')) {
      query = { id: productId };
    } else {
      try {
        query = { _id: new ObjectId(productId) };
      } catch {
        query = { id: productId };
      }
    }

    const result = await db.collection('products').updateOne(
      query,
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT products:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
      { status: 500 }
    );
  }
}