'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  index?: number;
  onImageLoad?: () => void;
}

export default function ProductCard({ product, index = 0, onImageLoad }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    if (onImageLoad) {
      onImageLoad();
    }
  };

  return (
    <Link 
      href={`/products/${product.id}`} 
      className="block group"
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
      }}
    >
      <div className="bg-white border border-gray-200 overflow-hidden transition-all duration-500 hover:border-gray-400">
        <div className="aspect-square relative bg-gray-50 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          )}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover group-hover:scale-110 transition-all duration-700 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={handleImageLoad}
            onError={() => setImageLoaded(true)}
          />
        </div>
        <div className="p-6">
          <h3 className="text-lg font-light text-gray-900 mb-2 tracking-wide uppercase">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 font-light">{product.description}</p>
          <div className="flex items-center gap-3">
            {product.originalPrice && product.originalPrice > product.price ? (
              <>
                <p className="text-xl font-light text-gray-900 tracking-wider">₮{product.price.toLocaleString()}</p>
                <p className="text-sm font-light text-gray-400 line-through tracking-wider">₮{product.originalPrice.toLocaleString()}</p>
              </>
            ) : (
              <p className="text-xl font-light text-gray-900 tracking-wider">₮{product.price.toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
