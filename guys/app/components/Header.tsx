'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in (has phone in localStorage)
    const userPhone = localStorage.getItem('userPhone');
    setIsLoggedIn(!!userPhone);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userPhone');
    localStorage.removeItem('savedAddresses');
    localStorage.removeItem('orders');
    setIsLoggedIn(false);
    if (pathname === '/orders') {
      router.push('/');
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-900 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/" className="text-2xl font-serif text-gray-900 tracking-wider">
              GUYS SHOP
            </Link>

            <div className="flex items-center gap-6">
            
            </div>
          </div>
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
