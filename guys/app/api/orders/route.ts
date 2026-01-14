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
    
    const newOrder = {
      userId: body.userId,
      productName: body.productName,
      productSize: body.productSize,
      productColor: body.productColor || '',
      productPrice: body.productPrice,
      productImage: body.productImage,
      productCode: body.productCode || '',
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
