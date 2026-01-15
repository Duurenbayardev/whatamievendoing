'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import CheckoutForm from '../components/CheckoutForm';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const totalPrice = getTotalPrice();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const handleOrderComplete = (id: string) => {
    setOrderId(id);
    setShowThankYou(true);
    clearCart();
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-serif text-gray-900 tracking-tight uppercase">Сагс</h1>
              <Link
                href="/shop"
                className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
              >
                Дэлгүүр рүү буцах
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
          <div className="text-center">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-2xl font-serif text-gray-900 mb-4 uppercase">Сагс хоосон байна</h2>
            <p className="text-gray-600 font-light mb-8">Сагсанд бүтээгдэхүүн нэмээд үзнэ үү</p>
            <Link
              href="/shop"
              className="inline-block px-8 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              Дэлгүүр рүү очих
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif text-gray-900 tracking-tight uppercase">Сагс</h1>
            <Link
              href="/shop"
              className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
            >
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item, index) => (
              <div key={`${item.productId}-${item.size}-${item.color || 'no-color'}-${index}`} className="bg-white border border-gray-200 p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-32 relative bg-gray-50 border border-gray-200 flex-shrink-0 overflow-hidden">
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-light text-gray-900 mb-1 uppercase">{item.productName}</h3>
                        {item.productCode && (
                          <p className="text-xs text-gray-500 font-light mb-2">Код: {item.productCode}</p>
                        )}
                        <p className="text-sm text-gray-600 font-light">Хэмжээ: {item.size}</p>
                        {item.color && (
                          <p className="text-sm text-gray-600 font-light">Өнгө: {item.color}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.size, item.color)}
                        className="text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-light text-gray-500 tracking-widest uppercase">Тоо ширхэг:</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 hover:border-gray-900 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="text-gray-900 font-light w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center border border-gray-300 hover:border-gray-900 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xl font-light text-gray-900 tracking-wider">
                        ₮{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-6 sticky top-24">
              <h2 className="text-xl font-serif text-gray-900 mb-6 tracking-tight uppercase">Захиалгын дэлгэрэнгүй</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-900 font-light">
                  <span>Нийт бүтээгдэхүүн:</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-light text-xl">
                  <span>Нийт дүн:</span>
                  <span>₮{totalPrice.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                Захиалга өгөх
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Form for Multiple Items */}
      {showCheckout && (
        <CheckoutForm
          productName={`${cart.length} бүтээгдэхүүн`}
          productSize=""
          productPrice={totalPrice}
          productImage={cart[0]?.productImage || ''}
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onComplete={handleOrderComplete}
          cartItems={cart}
        />
      )}
    </div>
  );
}
