'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '../../types';
import CheckoutForm from '../../components/CheckoutForm';
import ThankYouScreen from '../../components/ThankYouScreen';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [sizeError, setSizeError] = useState<string>('');
  const [colorError, setColorError] = useState<string>('');

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = () => {
    if (!selectedSize) {
      setSizeError('Хэмжээ сонгоно уу');
      setTimeout(() => setSizeError(''), 3000);
      return;
    }
    if (product?.colors && product.colors.length > 0 && !selectedColor) {
      setColorError('Өнгө сонгоно уу');
      setTimeout(() => setColorError(''), 3000);
      return;
    }
    setSizeError('');
    setColorError('');
    setShowCheckout(true);
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

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-6 font-light">Бүтээгдэхүүн олдсонгүй</p>
          <button
            onClick={() => router.push('/shop')}
            className="px-8 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
          >
            Дэлгүүр рүү буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <button
            onClick={() => router.push('/shop')}
            className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
          >
            ← Бүтээгдэхүүн рүү буцах
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="aspect-square relative bg-gray-50">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
              <Image
                src={product.image}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                sizes="(max-width: 1024px) 100vw, 50vw"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-serif text-gray-900 mb-4 tracking-tight uppercase">{product.name}</h1>
              <div className="flex items-center gap-4">
                {product.originalPrice && product.originalPrice > product.price ? (
                  <>
                    <p className="text-3xl font-light text-gray-900 tracking-wider">₮{product.price.toLocaleString()}</p>
                    <p className="text-xl font-light text-gray-400 line-through tracking-wider">₮{product.originalPrice.toLocaleString()}</p>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-light tracking-widest uppercase">
                      Хямдрал
                    </span>
                  </>
                ) : (
                  <p className="text-3xl font-light text-gray-900 tracking-wider">₮{product.price.toLocaleString()}</p>
                )}
              </div>
            </div>

            {product.description && (
              <div>
                <h2 className="text-sm font-light text-gray-600 mb-3 tracking-widest uppercase">Тайлбар</h2>
                <p className="text-gray-700 font-light leading-relaxed">{product.description}</p>
              </div>
            )}

            <div>
              <h2 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Хэмжээ</h2>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError('');
                    }}
                    className={`px-8 py-3 text-sm font-light tracking-widest uppercase transition-all duration-300 ${
                      selectedSize === size
                        ? 'bg-gray-900 text-white'
                        : 'bg-transparent text-gray-900 border border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="mt-2 text-xs text-red-600 font-light">{sizeError}</p>
              )}
            </div>

            {product.colors && product.colors.length > 0 && (
              <div>
                <h2 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Өнгө</h2>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    // Find color value from preset colors
                    const presetColors = [
                      { name: 'Хар', value: '#000000' },
                      { name: 'Цагаан', value: '#FFFFFF' },
                      { name: 'Саарал', value: '#808080' },
                      { name: 'Улаан', value: '#FF0000' },
                      { name: 'Цэнхэр', value: '#0000FF' },
                      { name: 'Ногоон', value: '#008000' },
                      { name: 'Шар', value: '#FFFF00' },
                      { name: 'Ягаан', value: '#FF00FF' },
                      { name: 'Улбар шар', value: '#FFA500' },
                      { name: 'Хүрэн', value: '#A52A2A' },
                      { name: 'Цайвар цэнхэр', value: '#ADD8E6' },
                      { name: 'Цайвар ягаан', value: '#FFB6C1' },
                      { name: 'Бор', value: '#8B4513' },
                      { name: 'Цайвар ногоон', value: '#90EE90' },
                      { name: 'Мөнгө', value: '#C0C0C0' },
                      { name: 'Алт', value: '#FFD700' },
                    ];
                    const colorData = presetColors.find(c => c.name === color) || { name: color, value: '#CCCCCC' };
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          setColorError('');
                        }}
                        className={`px-6 py-3 text-sm font-light tracking-widest uppercase transition-all duration-300 border-2 flex items-center gap-2 ${
                          selectedColor === color
                            ? 'bg-gray-50 border-gray-900'
                            : 'bg-white border-gray-300 hover:border-gray-900'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded border border-gray-300"
                          style={{ backgroundColor: colorData.value }}
                        />
                        <span>{color}</span>
                      </button>
                    );
                  })}
                </div>
                {colorError && (
                  <p className="mt-2 text-xs text-red-600 font-light">{colorError}</p>
                )}
              </div>
            )}

            {product.tags.length > 0 && (
              <div>
                <h2 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Шошго</h2>
                <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                  <div className="flex gap-3 min-w-max md:flex-wrap md:min-w-0">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-2 bg-transparent text-gray-600 border border-gray-300 text-xs font-light tracking-widest uppercase whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleBuy}
              className="w-full py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-all duration-300"
            >
              Худалдаж авах
            </button>
          </div>
        </div>
      </main>

      {/* Checkout Form Modal */}
      {product && (
        <CheckoutForm
          productName={product.name}
          productSize={selectedSize}
          productColor={selectedColor || undefined}
          productPrice={product.price}
          productImage={product.image}
          productCode={product.productCode}
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onComplete={(id) => {
            setOrderId(id);
            setShowThankYou(true);
          }}
        />
      )}

      {/* Thank You Screen */}
      {product && showThankYou && (
        <ThankYouScreen
          orderId={orderId}
          productName={product.name}
          onClose={() => {
            setShowThankYou(false);
            router.push('/shop');
          }}
        />
      )}
    </div>
  );
}
