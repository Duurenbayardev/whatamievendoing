'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Order {
  id: string;
  productName: string;
  productSize: string;
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

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoadedStates, setImageLoadedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Try to get phone from localStorage or prompt user
    const savedPhone = localStorage.getItem('userPhone');
    
    if (savedPhone) {
      fetchUserOrders(savedPhone);
    } else {
      // Try to get from any saved address
      const savedAddresses = localStorage.getItem('savedAddresses');
      if (savedAddresses) {
        try {
          const addresses = JSON.parse(savedAddresses);
          if (addresses.length > 0 && addresses[0].phone) {
            localStorage.setItem('userPhone', addresses[0].phone);
            fetchUserOrders(addresses[0].phone);
            return;
          }
        } catch (error) {
          console.error('Failed to parse saved addresses:', error);
        }
      }
      
      // Fallback to localStorage orders for backward compatibility
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        try {
          const ordersData = JSON.parse(savedOrders);
          const sortedOrders = ordersData.sort((a: Order, b: Order) => {
            const dateA = new Date(a.orderDate).getTime();
            const dateB = new Date(b.orderDate).getTime();
            return dateB - dateA;
          });
          setOrders(sortedOrders);
        } catch (error) {
          console.error('Failed to load orders:', error);
        }
      }
      setLoading(false);
    }
  }, []);

  const fetchUserOrders = async (phone: string) => {
    try {
      // First get user by phone
      const userResponse = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`);
      if (userResponse.ok) {
        const user = await userResponse.json();
        // Then get orders by userId
        const ordersResponse = await fetch(`/api/orders?userId=${user.id}`);
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        } else {
          // Fallback to localStorage
          loadLocalStorageOrders();
        }
      } else {
        // Fallback to localStorage
        loadLocalStorageOrders();
      }
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      loadLocalStorageOrders();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalStorageOrders = () => {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      try {
        const ordersData = JSON.parse(savedOrders);
        const sortedOrders = ordersData.sort((a: Order, b: Order) => {
          const dateA = new Date(a.orderDate).getTime();
          const dateB = new Date(b.orderDate).getTime();
          return dateB - dateA;
        });
        setOrders(sortedOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Хүлээгдэж байна';
      case 'processing':
        return 'Бэлтгэж байна';
      case 'shipped':
        return 'Хүргэлтэнд гарсан';
      case 'delivered':
        return 'Хүргэгдсэн';
      default:
        return 'Хүлээгдэж байна';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'shipped':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-4">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-600 font-light">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif text-gray-900 tracking-tight uppercase">Миний захиалгууд</h1>
            <Link
              href="/shop"
              className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
            >
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {orders.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-gray-600 mb-6 font-light text-lg">Одоогоор захиалга байхгүй байна.</p>
            <Link
              href="/shop"
              className="inline-block px-8 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              Дэлгүүр рүү очих
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Product Image and Info */}
                  <div className="flex gap-4">
                    <div className="w-24 h-24 relative bg-gray-50 border border-gray-200 flex-shrink-0 overflow-hidden">
                      {!imageLoadedStates[order.id] && (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <Image
                        src={order.productImage}
                        alt={order.productName}
                        fill
                        className={`object-cover transition-opacity duration-300 ${
                          imageLoadedStates[order.id] ? 'opacity-100' : 'opacity-0'
                        }`}
                        sizes="96px"
                        onLoad={() => setImageLoadedStates(prev => ({ ...prev, [order.id]: true }))}
                        onError={() => setImageLoadedStates(prev => ({ ...prev, [order.id]: true }))}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-light text-gray-900 mb-1 uppercase">{order.productName}</h3>
                      {order.productCode && (
                        <p className="text-xs text-gray-500 font-light mb-2">Код: {order.productCode}</p>
                      )}
                      <p className="text-sm text-gray-600 font-light">Хэмжээ: {order.productSize}</p>
                      <p className="text-lg font-light text-gray-900 mt-2">₮{order.productPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-light text-gray-500 mb-1 tracking-widest uppercase">Хүргэх хаяг</p>
                      <p className="text-sm text-gray-900 font-light">{order.fullName}</p>
                      <p className="text-sm text-gray-600 font-light">{order.phone}</p>
                      <p className="text-sm text-gray-600 font-light">
                        {order.address}, {order.district}, {order.city}
                      </p>
                    </div>
                  </div>

                  {/* Order Status and Date */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-light text-gray-500 mb-2 tracking-widest uppercase">Захиалгын статус</p>
                      <span className={`inline-block px-3 py-1 text-xs font-light tracking-widest uppercase border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-light text-gray-500 mb-1 tracking-widest uppercase">Захиалгын огноо</p>
                      <p className="text-sm text-gray-900 font-light">
                        {new Date(order.orderDate).toLocaleDateString('mn-MN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {order.notes && (
                      <div>
                        <p className="text-xs font-light text-gray-500 mb-1 tracking-widest uppercase">Нэмэлт мэдээлэл</p>
                        <p className="text-sm text-gray-600 font-light">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
