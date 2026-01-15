export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[]; // Multiple images for gallery
  tags: string[];
  sizes: string[];
  stock?: Record<string, number>; // Stock quantity per size: { "S": 10, "M": 5, "L": 8 }
  inStock?: boolean; // Stock status (computed)
  createdAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  size: string;
  quantity: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  notes?: string;
}

export interface Order {
  id: string;
  userId: string;
  productName: string;
  productSize: string;
  productPrice: number;
  productImage: string;
  quantity?: number; // Quantity ordered
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  notes?: string;
  orderDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  addresses: Address[];
  primaryAddress?: Address; // Primary address for checkout
  orders: string[]; // Order IDs
  createdAt: string;
  updatedAt: string;
}
