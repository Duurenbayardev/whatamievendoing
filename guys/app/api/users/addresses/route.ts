import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/mongodb';
import { ObjectId, UpdateFilter } from 'mongodb';

// POST - Add new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, address } = body;
    
    if (!phone || !address) {
      return NextResponse.json({ error: 'Phone and address are required' }, { status: 400 });
    }
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Find user
    const user = await usersCollection.findOne({ phone });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Add address if it doesn't already exist
    const addressExists = user.addresses?.some(
      (addr: any) => addr.address === address.address && 
                    addr.city === address.city && 
                    addr.district === address.district
    );
    
    if (!addressExists) {
      const newAddress = {
        ...address,
        id: address.id || Date.now().toString(),
      };
      
      await usersCollection.updateOne(
        { phone },
        { 
          $push: { addresses: newAddress },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }
    
    const updatedUser = await usersCollection.findOne({ phone });
    return NextResponse.json({
      ...updatedUser,
      id: updatedUser!._id.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error('Error adding address:', error);
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}

// PUT - Update existing address
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, address } = body;
    
    if (!phone || !address || !address.id) {
      return NextResponse.json({ error: 'Phone, address, and address.id are required' }, { status: 400 });
    }
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Find user
    const user = await usersCollection.findOne({ phone });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update the specific address
    await usersCollection.updateOne(
      { 
        phone,
        'addresses.id': address.id 
      },
      { 
        $set: { 
          'addresses.$': address,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    const updatedUser = await usersCollection.findOne({ phone });
    return NextResponse.json({
      ...updatedUser,
      id: updatedUser!._id.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// DELETE - Remove address
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, addressId } = body;
    
    if (!phone || !addressId) {
      return NextResponse.json({ error: 'Phone and addressId are required' }, { status: 400 });
    }
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Find user
    const user = await usersCollection.findOne({ phone });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Remove the address
    await usersCollection.updateOne(
      { phone },
      { 
        $pull: { addresses: { id: addressId } } as any,
        $set: { updatedAt: new Date().toISOString() }
      } as UpdateFilter<any>
    );
    
    const updatedUser = await usersCollection.findOne({ phone });
    return NextResponse.json({
      ...updatedUser,
      id: updatedUser!._id.toString(),
      _id: undefined,
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
