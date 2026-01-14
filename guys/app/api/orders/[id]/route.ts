import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { ObjectId, UpdateFilter } from 'mongodb';

// GET single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    
    const db = await getDb();
    const collection = db.collection('orders');
    
    const order = await collection.findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const formattedOrder = {
      ...order,
      id: order._id.toString(),
      _id: undefined,
    };
    
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PUT update order (mainly for status updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    const body = await request.json();
    
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    
    const db = await getDb();
    const collection = db.collection('orders');
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (body.status) {
      updateData.status = body.status;
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const updatedOrder = await collection.findOne({ _id: new ObjectId(orderId) });
    
    const formattedOrder = {
      ...updatedOrder,
      id: updatedOrder!._id.toString(),
      _id: undefined,
    };
    
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    
    if (!ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }
    
    const db = await getDb();
    const ordersCollection = db.collection('orders');
    const usersCollection = db.collection('users');
    
    // Find the order first to get userId
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Delete the order
    const result = await ordersCollection.deleteOne({ _id: new ObjectId(orderId) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Remove order ID from user's orders array if userId exists
    if (order.userId && ObjectId.isValid(order.userId)) {
      await usersCollection.updateOne(
        { _id: new ObjectId(order.userId) },
        { $pull: { orders: orderId } } as unknown as UpdateFilter<any>
      );
    }
    
    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
