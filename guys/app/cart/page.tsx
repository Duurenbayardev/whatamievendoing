'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../contexts/CartContext';
import CheckoutForm from '../components/CheckoutForm';
import ThankYouScreen from '../components/ThankYouScreen';
import { Product } from '../types';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [orderProductName, setOrderProductName] = useState<string>('');
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});

  const totalPrice = getTotalPrice();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };

  const handleOrderComplete = (id: string) => {
    // Save product name before clearing cart
    const productName = cart.length === 1 
      ? cart[0].productName 
      : `${cart.length} бүтээгдэхүүн`;
    setOrderProductName(productName);
    setOrderId(id);
    clearCart();
    setShowThankYou(true);
  };

  const handleQuantityUpdate = async (item: any, newQuantity: number) => {
    if (newQuantity <= 0) {
      updateQuantity(item.productId, item.size, 0);
      return;
    }

    // Fetch product to check stock
    try {
      const response = await fetch(`/api/products/${item.productId}`);
      if (response.ok) {
        const product: Product = await response.json();
        
        // Check stock for the specific size
        let availableStock = null;
        if (product.stock) {
          if (typeof product.stock === 'object') {
            availableStock = product.stock[item.size] || 0;
          } else if (typeof product.stock === 'number') {
            availableStock = product.stock;
          }
        }

        if (availableStock !== null && newQuantity > availableStock) {
          const errorKey = `${item.productId}-${item.size}`;
          setStockErrors({
            ...stockErrors,
            [errorKey]: `${item.size} хэмжээнд зөвхөн ${availableStock} ширхэг үлдсэн байна`,
          });
          setTimeout(() => {
            setStockErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors[errorKey];
              return newErrors;
            });
          }, 3000);
          return;
        }

        // Clear any existing error for this item
        const errorKey = `${item.productId}-${item.size}`;
        setStockErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Failed to check stock:', error);
    }

    updateQuantity(item.productId, item.size, newQuantity);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-serif text-gray-900 tracking-tight uppercase">Сагс</h1>
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
            <h2 className="text-lg md:text-xl lg:text-2xl font-serif text-gray-900 mb-3 md:mb-4 uppercase">Сагс хоосон байна</h2>
            <p className="text-sm md:text-base text-gray-600 font-light mb-6 md:mb-8">Сагсанд бүтээгдэхүүн нэмээд үзнэ үү</p>
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-serif text-gray-900 tracking-tight uppercase">Сагс</h1>
            <Link
              href="/shop"
              className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
            >
              Дэлгүүр рүү буцах
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-6 md:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {cart.map((item, index) => {
              const errorKey = `${item.productId}-${item.size}`;
              const stockError = stockErrors[errorKey];
              
              return (
                <div key={`${item.productId}-${item.size}-${index}`} className="bg-white border border-gray-200 p-4 md:p-6">
                  <div className="flex gap-3 md:gap-6">
                    <div className="w-20 h-20 md:w-32 md:h-32 relative bg-gray-50 border border-gray-200 flex-shrink-0 overflow-hidden">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2 md:mb-4">
                        <div>
                          <h3 className="text-sm md:text-base lg:text-lg font-light text-gray-900 mb-1 uppercase">{item.productName}</h3>
                          <p className="text-xs md:text-sm text-gray-600 font-light">Хэмжээ: {item.size}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId, item.size)}
                          className="text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {stockError && (
                        <div className="mb-2 bg-red-50 border border-red-200 text-red-800 p-2 rounded text-xs">
                          {stockError}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-light text-gray-500 tracking-widest uppercase">Тоо ширхэг:</span>
                          <div className="flex items-center gap-2 md:gap-3">
                            <button
                              onClick={() => handleQuantityUpdate(item, item.quantity - 1)}
                              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-gray-300 hover:border-gray-900 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="text-sm md:text-base text-gray-900 font-light w-7 md:w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityUpdate(item, item.quantity + 1)}
                              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border border-gray-300 hover:border-gray-900 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-base md:text-lg lg:text-xl font-light text-gray-900 tracking-wider">
                          ₮{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 p-4 md:p-6 sticky top-24">
              <h2 className="text-base md:text-lg lg:text-xl font-serif text-gray-900 mb-4 md:mb-6 tracking-tight uppercase">Захиалгын дэлгэрэнгүй</h2>
              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="flex justify-between text-sm md:text-base text-gray-900 font-light">
                  <span>Нийт бүтээгдэхүүн:</span>
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between text-base md:text-lg lg:text-xl text-gray-900 font-light">
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
          returnUrl="/cart"
        />
      )}

      {/* Thank You Screen */}
      {showThankYou && (
        <ThankYouScreen
          orderId={orderId}
          productName={orderProductName || 'Бүтээгдэхүүн'}
          onClose={() => {
            setShowThankYou(false);
            setOrderId('');
            setOrderProductName('');
          }}
        />
      )}
    </div>
  );
}
