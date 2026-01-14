import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';

// GET all unique tags
export async function GET() {
  try {
    const db = await getDb();
    const collection = db.collection('products');
    
    // Use MongoDB aggregation to get unique tags
    const tags = await collection.distinct('tags');
    
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
