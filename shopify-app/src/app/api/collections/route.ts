import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("shopify-app");
    const collections = await db.collection('collections').find({}).toArray();
    
    // Transform MongoDB _id to string id for consistency
    const formattedCollections = collections.map(collection => ({
      id: collection._id.toString(),
      title: collection.title,
      description: collection.description || ''
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
      { error: error.message || 'Failed to create collection' },
      { status: 500 }
    );
  }
} 