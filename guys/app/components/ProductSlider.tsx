'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductSliderProps {
  limit?: number;
  onImagesLoaded?: () => void;
}

export default function ProductSlider({ limit = 6, onImagesLoaded }: ProductSliderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProducts();
  }, []);

  // Call onImagesLoaded when at least 4 images are loaded (or all if less than 4)
  // This makes loading faster - we don't need to wait for all images
  useEffect(() => {
    const minImagesToLoad = Math.min(4, products.length);
    if (products.length > 0 && loadedImages.size >= minImagesToLoad && onImagesLoaded) {
      onImagesLoaded();
    }
  }, [loadedImages, products.length, onImagesLoaded]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      // Data is already sorted by newest first from API
      const productsData = data.slice(0, limit);
      setProducts(productsData);
      
      // If no products, immediately notify that images are "loaded"
      if (productsData.length === 0 && onImagesLoaded) {
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          onImagesLoaded();
        }, 0);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      // On error, notify that loading is complete
      if (onImagesLoaded) {
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          onImagesLoaded();
        }, 0);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-serif text-gray-900 tracking-tight">Онцлох бүтээгдэхүүн</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
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
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-4xl font-serif text-gray-900 tracking-tight">Онцлох бүтээгдэхүүн</h2>
        <Link
          href="/shop"
          className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-widest uppercase transition-colors"
        >
          Бүгдийг харах →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product, index) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            index={index}
            onImageLoad={() => {
              setLoadedImages(prev => {
                const newSet = new Set(prev);
                newSet.add(product.id);
                return newSet;
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}
