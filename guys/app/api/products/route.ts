import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// GET all products
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const collection = db.collection('products');
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase();
    const tag = searchParams.get('tag');
    
    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    // Fetch products and sort by newest first
    const products = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Convert ObjectId to string for JSON response
    const formattedProducts = products.map((product) => ({
      ...product,
      id: product._id.toString(),
      _id: undefined,
    }));
    
    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST new product
export async function POST(request: NextRequest) {
  try {
    const db = await getDb();
    const collection = db.collection('products');
    const body = await request.json();
    
    const newProduct = {
      productCode: body.productCode || '',
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price),
      ...(body.originalPrice && parseFloat(body.originalPrice) > parseFloat(body.price) && {
        originalPrice: parseFloat(body.originalPrice),
      }),
      image: body.image,
      tags: body.tags || [],
      sizes: body.sizes || ['S', 'M', 'L', 'XL'],
      createdAt: new Date().toISOString(),
    };
    
    const result = await collection.insertOne(newProduct);
    
    const createdProduct = {
      ...newProduct,
      id: result.insertedId.toString(),
    };
    
    return NextResponse.json(createdProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
