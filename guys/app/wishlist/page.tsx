'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(savedWishlist);

      if (savedWishlist.length > 0) {
        // Fetch all products and filter by wishlist IDs
        const response = await fetch('/api/products');
        const data = await response.json();
        const allProducts = Array.isArray(data) ? data : (data.products || []);
        const wishlistProducts = allProducts.filter((p: Product) =>
          savedWishlist.includes(p.id)
        );
        setProducts(wishlistProducts);
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = (productId: string) => {
    const updated = wishlist.filter((id) => id !== productId);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setProducts(products.filter((p) => p.id !== productId));
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
            <h1 className="text-3xl font-serif text-gray-900 tracking-tight uppercase">Хүслийн жагсаалт</h1>
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
        {products.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-serif text-gray-900 mb-4 uppercase">Хүслийн жагсаалт хоосон байна</h2>
            <p className="text-gray-600 font-light mb-8">Дуртай бүтээгдэхүүнээ хадгалж, дараа нь үзэх боломжтой</p>
            <Link
              href="/shop"
              className="inline-block px-8 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
            >
              Дэлгүүр рүү очих
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-gray-600 font-light">
                Нийт {products.length} бүтээгдэхүүн
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <div key={product.id} className="relative group">
                  <ProductCard product={product} />
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Хүслийн жагсаалтаас хасах"
                  >
                    <svg
                      className="w-5 h-5 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
