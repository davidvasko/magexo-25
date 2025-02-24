import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { MongoProduct } from '../../lib/productSchema';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getAllVendors } from '../../lib/shopify';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    
    const collections = await db.collection('collections').find({}).toArray();
    const collectionsMap = new Map(collections.map(c => [c.id, c]));
    
    const products = await db.collection('products').find({}).toArray();
    const allTags = [...new Set(products.flatMap(product => product.tags || []))];

    const formattedProducts = products.map(product => {
      let formattedCollections = {
        edges: []
      };

      if (product.collections) {
        if (product.collections.edges) {
          formattedCollections = {
            edges: product.collections.edges.map(edge => ({
              node: {
                id: edge.node.id,
                title: collectionsMap.get(edge.node.id)?.title || edge.node.title || '',
                handle: collectionsMap.get(edge.node.id)?.handle || ''
              }
            }))
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
        tags: product.tags || []
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
    const formData = await request.formData();
    const client = await clientPromise;
    const db = client.db("shopify-app");

    const isVariant = formData.get('isVariant') === 'true';
    const parentProductId = formData.get('parentProductId');

    if (isVariant && parentProductId) {
      const variant = {
        id: `variant-${new Date().getTime()}`,
        title: formData.get('title') as string,
        price: {
          amount: formData.get('price') as string || '0',
          currencyCode: 'CZK'
        },
        compareAtPrice: {
          amount: formData.get('compareAtPrice') as string || '',
          currencyCode: 'CZK'
        },
        sku: formData.get('sku') as string || '',
        stockQuantity: parseInt(formData.get('stockQuantity') as string || '0'),
        availableForSale: parseInt(formData.get('stockQuantity') as string || '0') > 0
      };

      const result = await db.collection('products').updateOne(
        { id: parentProductId },
        { 
          $push: { 
            'variants.edges': { 
              node: variant 
            } 
          },
          $set: {
            updatedAt: new Date().toISOString()
          }
        }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        variant 
      });
    }

    const title = formData.get('title') as string;
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      const uploadedFiles = formData.getAll('images');
      let imageEdges = [];

      if (uploadedFiles.length > 0) {
        imageEdges = await Promise.all(uploadedFiles.map(async (file: File) => {
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            const originalExt = file.name.split('.').pop();
            const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${originalExt}`;
            
            const uploadDir = path.join(process.cwd(), 'public', 'uploads');
            await mkdir(uploadDir, { recursive: true });
            
            const filepath = path.join(uploadDir, filename);
            await writeFile(filepath, buffer);
            
            return {
              node: {
                url: `/uploads/${filename}`,
                altText: title
              }
            };
          } catch (imageError) {
            console.error('Error processing image:', imageError);
            return null;
          }
        }));

        imageEdges = imageEdges.filter(Boolean);
      }

      const collections = JSON.parse(formData.get('collections') as string || '[]');
      const collectionEdges = collections.map((collectionId: string) => ({
        node: {
          id: collectionId,
          title: ''
        }
      }));
      
      const product = {
        id: `custom-${new Date().getTime()}`,
        title,
        description: formData.get('description') as string || '',
        handle,
        productType: formData.get('productType') as string || '',
        vendor: formData.get('vendor') as string || '',
        tags: JSON.parse(formData.get('tags') as string || '[]'),
        variants: {
          edges: [{
            node: {
              id: `variant-${new Date().getTime()}`,
              title: 'Default Variant',
              price: {
                amount: formData.get('price') as string || '0',
                currencyCode: 'CZK'
              },
              compareAtPrice: {
                amount: formData.get('compareAtPrice') as string || '',
                currencyCode: 'CZK'
              },
              sku: formData.get('sku') as string || '',
              availableForSale: true
            }
          }]
        },
        images: { edges: imageEdges },
        collections: { edges: collectionEdges },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCustom: true
      };

      await db.collection('products').insertOne(product);

      return NextResponse.json({ 
        success: true, 
        product 
      });

    } catch (processError) {
      console.error('Error processing request:', processError);
      return NextResponse.json(
        { success: false, error: 'Error processing request: ' + processError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in POST products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const variantId = searchParams.get('variantId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("shopify-app");

    if (variantId) {
      const product = await db.collection('products').findOne({ id: productId });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const updatedVariants = {
        edges: product.variants.edges.filter(
          ({ node }: { node: any }) => node.id !== variantId
        )
      };

      const result = await db.collection('products').updateOne(
        { id: productId },
        { $set: { variants: updatedVariants } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Failed to update product' }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    }

    const result = await db.collection('products').deleteOne({ id: productId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product/variant' },
      { status: 500 }
    );
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
    
    const updateData = {
      title: formData.get('title'),
      description: formData.get('description'),
      vendor: formData.get('vendor'),
      productType: formData.get('productType'),
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      collections: {
        edges: collections.map((collection: any) => ({
          node: {
            id: collection.id || collection.node?.id || '',
            title: collection.title || collection.node?.title || ''
          }
        }))
      },
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
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}