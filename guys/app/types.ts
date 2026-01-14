export interface Product {
  id: string;
  productCode: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  tags: string[];
  sizes: string[];
  colors: string[];
  createdAt: string;
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
  productColor?: string;
  productPrice: number;
  productImage: string;
  productCode?: string;
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
  orders: string[]; // Order IDs
  createdAt: string;
  updatedAt: string;
}
