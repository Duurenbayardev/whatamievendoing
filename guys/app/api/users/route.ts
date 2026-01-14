import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// GET user by phone number
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    const db = await getDb();
    const collection = db.collection('users');
    
    const user = await collection.findOne({ phone });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const formattedUser = {
      ...user,
      id: user._id.toString(),
      _id: undefined,
    };
    
    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// POST create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, fullName, address } = body;
    
    if (!phone || !fullName) {
      return NextResponse.json({ error: 'Phone and fullName are required' }, { status: 400 });
    }
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Check if user exists
    const existingUser = await usersCollection.findOne({ phone });
    
    if (existingUser) {
      // Update existing user
      const updateData: any = {
        fullName,
        updatedAt: new Date().toISOString(),
      };
      
      // Add address if provided and not already exists
      if (address) {
        const addressExists = existingUser.addresses?.some(
          (addr: any) => addr.address === address.address && 
                        addr.city === address.city && 
                        addr.district === address.district
        );
        
        if (!addressExists) {
          const newAddress = {
            ...address,
            id: Date.now().toString(),
          };
          updateData.$push = { addresses: newAddress };
        }
      }
      
      const result = await usersCollection.updateOne(
        { phone },
        { $set: updateData }
      );
      
      const updatedUser = await usersCollection.findOne({ phone });
      return NextResponse.json({
        ...updatedUser,
        id: updatedUser!._id.toString(),
        _id: undefined,
      });
    } else {
      // Create new user
      const newUser = {
        fullName,
        phone,
        addresses: address ? [{
          ...address,
          id: Date.now().toString(),
        }] : [],
        orders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const result = await usersCollection.insertOne(newUser);
      
      return NextResponse.json({
        ...newUser,
        id: result.insertedId.toString(),
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 });
  }
}
