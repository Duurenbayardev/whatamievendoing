'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '../types';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  notes?: string;
}

interface CheckoutFormProps {
  productName: string;
  productSize: string;
  productColor?: string;
  productPrice: number;
  productImage: string;
  productCode?: string;
  productId?: string; // Product ID for stock management
  isOpen: boolean;
  onClose: () => void;
  onComplete: (orderId: string) => void;
  cartItems?: CartItem[]; // Optional cart items for multiple item checkout
}

export default function CheckoutForm({
  productName,
  productSize,
  productColor,
  productPrice,
  productImage,
  productCode,
  productId,
  isOpen,
  onClose,
  onComplete,
  cartItems,
}: CheckoutFormProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    const loadUser = async () => {
      const savedPhone = localStorage.getItem('userPhone');
      if (!savedPhone) {
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);
      try {
        const response = await fetch(`/api/users?phone=${encodeURIComponent(savedPhone)}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Auto-select first address if only one exists
          if (userData.addresses && userData.addresses.length === 1) {
            const addr = userData.addresses[0];
            // Ensure address has fullName and phone from user if not in address
            setSelectedAddress({
              ...addr,
              fullName: addr.fullName || userData.fullName,
              phone: addr.phone || userData.phone,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!selectedAddress) {
      setSubmitError('Хаяг сонгоно уу');
      return;
    }
    
    setSubmitting(true);

    try {
      // If cartItems provided, create orders for each item
      if (cartItems && cartItems.length > 0) {
        const orderPromises = cartItems.map((item) =>
          fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              productId: item.productId,
              productName: item.productName,
              productSize: item.size,
              productColor: item.color || '',
              productPrice: item.price,
              productImage: item.productImage,
              productCode: item.productCode || '',
              quantity: item.quantity || 1,
              fullName: selectedAddress.fullName || user.fullName,
              phone: selectedAddress.phone || user.phone,
              address: selectedAddress.address,
              city: selectedAddress.city,
              district: selectedAddress.district,
              notes: selectedAddress.notes || '',
            }),
          })
        );

        const responses = await Promise.all(orderPromises);
        const failedResponses = responses.filter((r) => !r.ok);
        
        if (failedResponses.length > 0) {
          // Try to get error message from first failed response
          const firstFailed = failedResponses[0];
          const errorData = await firstFailed.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Захиалга өгөхөд алдаа гарлаа.';
          throw new Error(errorMessage);
        }

        const orders = await Promise.all(responses.map((r) => r.json()));
        
        // Save to localStorage
        const existingOrders = localStorage.getItem('orders');
        const savedOrders = existingOrders ? JSON.parse(existingOrders) : [];
        savedOrders.push(...orders);
        localStorage.setItem('orders', JSON.stringify(savedOrders));

        setSubmitting(false);
        onClose();
        onComplete(orders[0].id); // Return first order ID
      } else {
        // Single product order (backward compatibility)
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            productId: productId,
            productName,
            productSize,
            productColor: productColor || '',
            productPrice,
            productImage,
            productCode: productCode || '',
            quantity: 1, // Default to 1 for single product orders
            fullName: selectedAddress.fullName || user.fullName,
            phone: selectedAddress.phone || user.phone,
            address: selectedAddress.address,
            city: selectedAddress.city,
            district: selectedAddress.district,
            notes: selectedAddress.notes || '',
          }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Захиалга өгөхөд алдаа гарлаа.';
          throw new Error(errorMessage);
        }

        const order = await orderResponse.json();

        // Also save to localStorage for backward compatibility
        const existingOrders = localStorage.getItem('orders');
        const orders = existingOrders ? JSON.parse(existingOrders) : [];
        orders.push({
          ...order,
          // Keep old format for compatibility
        });
        localStorage.setItem('orders', JSON.stringify(orders));

        setSubmitting(false);
        onClose();
        onComplete(order.id);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Захиалга өгөхөд алдаа гарлаа. Дахин оролдоно уу.';
      setSubmitError(errorMessage);
      setSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    onClose();
    router.push('/account');
  };

  const handleAddAddressRedirect = () => {
    onClose();
    router.push('/account/addresses');
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-serif text-gray-900 tracking-tight uppercase">Захиалга өгөх</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Захиалгын дэлгэрэнгүй</h3>
            {cartItems && cartItems.length > 0 ? (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div>
                      <p className="text-gray-900 font-light">{item.productName}</p>
                      <p className="text-gray-600 font-light text-sm">Хэмжээ: {item.size} {item.color && `• Өнгө: ${item.color}`}</p>
                      <p className="text-gray-600 font-light text-sm">Тоо ширхэг: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-light">₮{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-gray-900 font-light text-lg">
                    <span className="font-medium">Нийт дүн:</span> ₮{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-900 font-light"><span className="font-medium">Бүтээгдэхүүн:</span> {productName}</p>
                <p className="text-gray-900 font-light"><span className="font-medium">Хэмжээ:</span> {productSize}</p>
                {productColor && (
                  <p className="text-gray-900 font-light"><span className="font-medium">Өнгө:</span> {productColor}</p>
                )}
                <p className="text-gray-900 font-light"><span className="font-medium">Үнэ:</span> ₮{productPrice.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
              <p className="text-sm font-light">{submitError}</p>
            </div>
          )}

          {/* Check login and address status */}
          {loadingUser ? (
            <div className="text-center py-8">
              <p className="text-gray-600 font-light">Мэдээлэл ачааллаж байна...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-600 font-light">Захиалга өгөхийн тулд эхлээд бүртгэлд нэвтрэх шаардлагатай.</p>
              <button
                onClick={handleLoginRedirect}
                className="px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                Бүртгэлд нэвтрэх
              </button>
            </div>
          ) : !user.addresses || user.addresses.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-600 font-light">Захиалга өгөхийн тулд эхлээд хаяг нэмэх шаардлагатай.</p>
              <button
                onClick={handleAddAddressRedirect}
                className="px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                Хаяг нэмэх
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                  Хүргэх хаяг сонгох *
                </label>
                <div className="space-y-3">
                  {user.addresses.map((address: Address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border cursor-pointer transition-colors ${
                        selectedAddress?.id === address.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddress?.id === address.id}
                        onChange={() => {
                      setSelectedAddress({
                        ...address,
                        fullName: address.fullName || user.fullName,
                        phone: address.phone || user.phone,
                      });
                    }}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                          selectedAddress?.id === address.id
                            ? 'border-gray-900'
                            : 'border-gray-400'
                        }`}>
                          {selectedAddress?.id === address.id && (
                            <div className="w-2 h-2 bg-gray-900 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-light mb-1">{address.fullName || user.fullName}</p>
                          <p className="text-gray-600 font-light text-sm">{address.phone || user.phone}</p>
                          <p className="text-gray-600 font-light text-sm">{address.address}</p>
                          <p className="text-gray-600 font-light text-sm">{address.district}, {address.city}</p>
                          {address.notes && (
                            <p className="text-gray-500 font-light text-sm mt-1">{address.notes}</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleAddAddressRedirect}
                    className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors underline"
                  >
                    Шинэ хаяг нэмэх
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedAddress}
                  className="flex-1 px-6 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Захиалга өгөж байна...' : 'Захиалга өгөх'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
