import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { ObjectId, UpdateFilter } from 'mongodb';

// GET all orders (for admin) or orders by userId
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const collection = db.collection('orders');
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    
    let query: any = {};
    if (userId) {
      query.userId = userId;
    }
    
    const orders = await collection
      .find(query)
      .sort({ orderDate: -1 })
      .toArray();
    
    const formattedOrders = orders.map((order) => ({
      ...order,
      id: order._id.toString(),
      _id: undefined,
    }));
    
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const db = await getDb();
    const ordersCollection = db.collection('orders');
    const usersCollection = db.collection('users');
    const productsCollection = db.collection('products');
    
    const quantity = body.quantity || 1;
    const productSize = body.productSize;
    
    // Find and update product stock if productId is provided
    let product = null;
    let productQuery: any = null;
    
    if (body.productId && ObjectId.isValid(body.productId)) {
      productQuery = { _id: new ObjectId(body.productId) };
      product = await productsCollection.findOne(productQuery);
    }
    
    if (product && productSize) {
      // Handle size-specific stock
      if (product.stock && typeof product.stock === 'object') {
        // Size-specific stock format
        const currentStockForSize = product.stock[productSize] || 0;
        
        // Check if sufficient stock is available for this size
        if (currentStockForSize < quantity) {
          return NextResponse.json(
            { error: `Хангалттай нөөц байхгүй. ${productSize} хэмжээнд одоогоор ${currentStockForSize} ширхэг үлдсэн байна.` },
            { status: 400 }
          );
        }
        
        // Decrease stock for this specific size
        const updatedStock = { ...product.stock };
        updatedStock[productSize] = currentStockForSize - quantity;
        
        // Calculate overall inStock status
        const inStock = Object.values(updatedStock).some((qty: any) => qty > 0);
        
        await productsCollection.updateOne(
          productQuery,
          {
            $set: {
              stock: updatedStock,
              inStock,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      } else if (product.stock !== undefined && typeof product.stock === 'number') {
        // Legacy format - single stock number (backward compatibility)
        if (product.stock < quantity) {
          return NextResponse.json(
            { error: `Хангалттай нөөц байхгүй. Одоогоор ${product.stock} ширхэг үлдсэн байна.` },
            { status: 400 }
          );
        }
        
        const newStock = product.stock - quantity;
        await productsCollection.updateOne(
          productQuery,
          {
            $set: {
              stock: newStock,
              inStock: newStock > 0,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }
    }
    
    const newOrder = {
      userId: body.userId,
      productName: body.productName,
      productSize: body.productSize,
      productPrice: body.productPrice,
      productImage: body.productImage,
      quantity: quantity,
      fullName: body.fullName,
      phone: body.phone,
      address: body.address,
      city: body.city,
      district: body.district,
      notes: body.notes || '',
      orderDate: new Date().toISOString(),
      status: 'pending' as const,
    };
    
    const result = await ordersCollection.insertOne(newOrder);
    const orderId = result.insertedId.toString();
    
    // Update user's orders array
    if (body.userId && ObjectId.isValid(body.userId)) {
      await usersCollection.updateOne(
        { _id: new ObjectId(body.userId) },
        { $push: { orders: orderId } } as unknown as UpdateFilter<any>
      );
    }
    
    const createdOrder = {
      ...newOrder,
      id: orderId,
    };
    
    return NextResponse.json(createdOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
