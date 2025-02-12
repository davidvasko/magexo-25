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
    
    // Fix existing products that might have incorrect image structure
    const productsToFix = await db.collection('products').find({
      $or: [
        { images: { $exists: false } },
        { images: null },
        { 'images.edges': { $exists: false } }
      ]
    }).toArray();

    if (productsToFix.length > 0) {
      const updatePromises = productsToFix.map(product => {
        return db.collection('products').updateOne(
          { _id: product._id },
          {
            $set: {
              images: { edges: [] }
            }
          }
        );
      });

      await Promise.all(updatePromises);
    }

    // Get all products after fixes
    const products = await db.collection('products').find({}).toArray();
    
    // Get all unique tags from products
    const allTags = [...new Set(products.flatMap(product => product.tags || []))];
    
    // Get vendors from Shopify
    const shopifyVendors = await getAllVendors();
    
    // Ensure all products have the required structure
    const formattedProducts = products.map(product => {
      // Ensure images have the correct structure
      let formattedImages = { edges: [] };
      if (product.images) {
        if (Array.isArray(product.images)) {
          // Handle case where images might be an array
          formattedImages = {
            edges: product.images.map(img => ({
              node: {
                url: img.url || img,
                altText: img.altText || null
              }
            }))
          };
        } else if (product.images.edges) {
          // Already in correct format
          formattedImages = product.images;
        } else if (product.images.url) {
          // Single image object
          formattedImages = {
            edges: [{
              node: {
                url: product.images.url,
                altText: product.images.altText || null
              }
            }]
          };
        }
      }

      return {
        ...product,
        images: formattedImages,
        variants: product.variants || { 
          edges: [{
            node: {
              id: `variant-${product.id}`,
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
      vendors: shopifyVendors // Return Shopify vendors
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

    // Create a handle from the title
    const title = formData.get('title') as string;
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      // Process images
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

        // Filter out any failed image uploads
        imageEdges = imageEdges.filter(Boolean);
      }

      const collections = JSON.parse(formData.get('collections') as string || '[]');
      const collectionEdges = collections.map(collectionId => ({
        node: {
          id: collectionId
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
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    
    // Get the product ID from the URL
    const url = new URL(request.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Only allow deletion of custom products
    const product = await db.collection('products').findOne({
      id: productId,
      isCustom: true
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or cannot be deleted' },
        { status: 404 }
      );
    }

    // Delete the product
    const result = await db.collection('products').deleteOne({
      id: productId,
      isCustom: true
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete product' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}