import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = resolvedParams.id;
    
    const db = await getDb();
    const collection = db.collection('products');
    
    let product;
    
    // Try to find by ObjectId first (new format)
    if (ObjectId.isValid(productId)) {
      product = await collection.findOne({ _id: new ObjectId(productId) });
    }
    
    // If not found and productId looks like a timestamp string (old format), try finding by old id field
    if (!product) {
      product = await collection.findOne({ id: productId });
    }
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Convert ObjectId to string for JSON response
    const formattedProduct = {
      ...product,
      id: product._id ? product._id.toString() : product.id,
      _id: undefined,
    };
    
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT/PATCH update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = resolvedParams.id;
    const body = await request.json();
    
    const db = await getDb();
    const collection = db.collection('products');
    
    // Find product by ObjectId or old id field
    let existingProduct;
    let query: any;
    
    if (ObjectId.isValid(productId)) {
      query = { _id: new ObjectId(productId) };
      existingProduct = await collection.findOne(query);
    }
    
    if (!existingProduct) {
      query = { id: productId };
      existingProduct = await collection.findOne(query);
    }
    
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const updateData: any = {
      productCode: body.productCode || '',
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price),
      image: body.image,
      tags: body.tags || [],
      sizes: body.sizes || ['S', 'M', 'L', 'XL'],
      updatedAt: new Date().toISOString(),
    };

    // Handle originalPrice - include it if provided and greater than price, otherwise remove it
    const updateOperation: any = { $set: updateData };
    
    if (body.originalPrice && parseFloat(body.originalPrice) > parseFloat(body.price)) {
      updateData.originalPrice = parseFloat(body.originalPrice);
    } else {
      // Remove originalPrice field if it exists
      updateOperation.$unset = { originalPrice: '' };
    }
    
    const result = await collection.updateOne(
      query,
      updateOperation
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Fetch updated product
    const updatedProduct = await collection.findOne(query);
    
    const formattedProduct = {
      ...updatedProduct,
      id: updatedProduct!._id.toString(),
      _id: undefined,
    };
    
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const productId = resolvedParams.id;
    
    const db = await getDb();
    const collection = db.collection('products');
    
    // Try to delete by ObjectId first, then by old id field
    let result;
    
    if (ObjectId.isValid(productId)) {
      result = await collection.deleteOne({ _id: new ObjectId(productId) });
    }
    
    if (!result || result.deletedCount === 0) {
      result = await collection.deleteOne({ id: productId });
    }
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
