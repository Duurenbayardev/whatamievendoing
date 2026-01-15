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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    // Get total count for pagination
    const total = await collection.countDocuments(query);
    
    // Fetch products with pagination and sort by newest first
    const products = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Convert ObjectId to string for JSON response
    const formattedProducts = products.map((product) => {
      // Calculate inStock based on size-specific stock
      let inStock = true;
      if (product.stock && typeof product.stock === 'object') {
        // Check if any size has stock > 0
        inStock = Object.values(product.stock).some((qty: any) => qty > 0);
      } else if (product.stock !== undefined && typeof product.stock === 'number') {
        // Legacy format - single stock number
        inStock = product.stock > 0;
      }
      
      return {
        ...product,
        id: product._id.toString(),
        _id: undefined,
        inStock,
      };
    });
    
    // Return paginated response if page/limit specified, otherwise return all (backward compatibility)
    if (searchParams.has('page') || searchParams.has('limit')) {
      return NextResponse.json({
        products: formattedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // Backward compatibility - return array directly
      return NextResponse.json(formattedProducts);
    }
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
    
    // Process stock - convert to size-specific format if needed
    let stock: Record<string, number> | undefined = undefined;
    if (body.stock) {
      if (typeof body.stock === 'object') {
        // Already in size-specific format
        stock = body.stock;
      } else if (typeof body.stock === 'string' || typeof body.stock === 'number') {
        // Legacy format - distribute evenly or create default structure
        const sizes = body.sizes || ['S', 'M', 'L', 'XL'];
        const totalStock = parseInt(body.stock.toString());
        stock = {};
        sizes.forEach((size: string) => {
          stock![size] = Math.floor(totalStock / sizes.length);
        });
      }
    }
    
    // Calculate inStock based on size-specific stock
    const inStock = stock ? Object.values(stock).some(qty => qty > 0) : true;
    
    const newProduct = {
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price),
      ...(body.originalPrice && parseFloat(body.originalPrice) > parseFloat(body.price) && {
        originalPrice: parseFloat(body.originalPrice),
      }),
      image: body.image,
      images: body.images || (body.image ? [body.image] : []),
      tags: body.tags || [],
      sizes: body.sizes || ['S', 'M', 'L', 'XL'],
      stock,
      inStock,
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
