import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    
    // Fetch all collections directly without aggregation
    const collections = await db.collection('collections').find({}).sort({ title: 1 }).toArray();
    
    // Format collections for consistent response
    const formattedCollections = collections.map(collection => ({
      id: collection.id || collection._id.toString(),
      title: collection.title,
      description: collection.description || '',
      isShopifyCollection: collection.isShopifyCollection || false,
      source: collection.source || 'mongodb',
      handle: collection.handle || ''
    }));
    
    return NextResponse.json({ collections: formattedCollections });
  } catch (error) {
    console.error('Error in GET collections:', error);
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required and must be a string' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("shopify-app");
    
    const collection = {
      title: title.trim(),
      description: '',
      handle: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      products: { edges: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('collections').insertOne(collection);
    
    return NextResponse.json({
      collectionId: result.insertedId.toString(),
      title: collection.title
    });

  } catch (error) {
    console.error('Error in POST collections:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create collection' },
      { status: 500 }
    );
  }
} 