'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import TagFilter from '../components/TagFilter';

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const query = searchParams.toString();
    fetchProducts(query);
  }, [searchParams]);

  const fetchProducts = async (query: string = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products?${query}`);
      const data = await response.json();
      
      // Data is already sorted by newest first from API, but ensure it's sorted
      let filteredData = data.sort((a: Product, b: Product) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Newest first
      });

      // Filter by category
      const category = searchParams.get('category');
      if (category) {
        if (category === 'mens') {
          filteredData = filteredData.filter((p: Product) =>
            p.tags.some(tag => tag.includes('Эрэгтэй') || tag.includes('эрэгтэй'))
          );
        } else if (category === 'womens') {
          filteredData = filteredData.filter((p: Product) =>
            p.tags.some(tag => tag.includes('Эмэгтэй') || tag.includes('эмэгтэй'))
          );
        } else if (category === 'newest') {
          // Already sorted by newest, just ensure it's correct
          filteredData = filteredData.sort((a: Product, b: Product) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        } else if (category === 'onsale') {
          // Include products with discounted price (originalPrice) or хямдрал tag
          filteredData = filteredData.filter((p: Product) => {
            const hasDiscountedPrice = p.originalPrice && p.originalPrice > p.price;
            const hasSaleTag = p.tags.some(tag => tag.includes('Хямдрал') || tag.includes('хямдрал'));
            return hasDiscountedPrice || hasSaleTag;
          }).sort((a: Product, b: Product) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA; // Keep newest first
          });
        }
      }

      setProducts(filteredData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/products/tags');
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const category = searchParams.get('category');
  const categoryTitle = category
    ? category === 'mens'
      ? "Эрэгтэй"
      : category === 'womens'
      ? "Эмэгтэй"
      : category === 'newest'
      ? 'Шинэ'
      : category === 'onsale'
      ? 'Хямдрал'
      : 'Дэлгүүр'
    : 'Дэлгүүр';

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-serif text-gray-900 mb-8 tracking-tight uppercase">{categoryTitle}</h1>
          <TagFilter tags={tags} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 overflow-hidden">
                <div className="aspect-square relative bg-gray-50">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded mb-4 animate-pulse w-3/4" />
                  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-light mb-2">
              Бүтээгдэхүүн олдсонгүй
            </p>
            <p className="text-sm text-gray-500 font-light">
              Өөр хайлт хийх эсвэл админ панелаас бүтээгдэхүүн нэмнэ үү
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
