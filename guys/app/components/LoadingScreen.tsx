'use client';

import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Delay hiding to allow fade out animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="text-center">
        <div className="mb-8">
          <h2 className="text-4xl font-serif text-gray-900 tracking-tight mb-4">GUYS SHOP</h2>
          <div className="flex justify-center gap-1">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        <p className="text-sm font-light text-gray-600 tracking-wider uppercase">Ачааллаж байна...</p>
      </div>
    </div>
  );
}
