'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import SearchBar from './SearchBar';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarContent({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get('category');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const userPhone = localStorage.getItem('userPhone');
    setIsLoggedIn(!!userPhone);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userPhone');
    localStorage.removeItem('savedAddresses');
    localStorage.removeItem('orders');
    setIsLoggedIn(false);
    onClose();
    if (pathname === '/orders') {
      router.push('/');
    }
  };

  const navItems = [
    { name: "Нүүр хуудас", href: "/", category: null },
    { name: "Эрэгтэй", href: "/shop?category=mens", category: 'mens' },
    { name: "Эмэгтэй", href: "/shop?category=womens", category: 'womens' },
    { name: "Шинэ", href: "/shop?category=newest", category: 'newest' },
    { name: "Хямдрал", href: "/shop?category=onsale", category: 'onsale' },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.href === '/') {
      return pathname === '/';
    }
    return pathname === '/shop' && currentCategory === item.category;
  };

  return (
    <>
      {/* Overlay with blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-96 bg-white border-r border-gray-200 z-50 transform transition-transform duration-500 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="text-3xl font-serif text-gray-900 tracking-wider" onClick={onClose}>
                GUYS SHOP
              </Link>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <SearchBar onSearch={onClose} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-8">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`block px-6 py-4 text-lg font-light tracking-wider transition-all duration-300 ${
                      isActive(item)
                        ? 'text-gray-900 border-l-2 border-gray-900 pl-4'
                        : 'text-gray-600 hover:text-gray-900 hover:pl-6'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/orders"
                  onClick={onClose}
                  className={`block px-6 py-4 text-lg font-light tracking-wider transition-all duration-300 ${
                    pathname === '/orders'
                      ? 'text-gray-900 border-l-2 border-gray-900 pl-4'
                      : 'text-gray-600 hover:text-gray-900 hover:pl-6'
                  }`}
                >
                  Миний захиалгууд
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  onClick={onClose}
                  className={`block px-6 py-4 text-lg font-light tracking-wider transition-all duration-300 ${
                    pathname?.startsWith('/account')
                      ? 'text-gray-900 border-l-2 border-gray-900 pl-4'
                      : 'text-gray-600 hover:text-gray-900 hover:pl-6'
                  }`}
                >
                  {isLoggedIn ? 'Миний бүртгэл' : 'Нэвтрэх'}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Logout Button */}
          {isLoggedIn && (
            <div className="p-8 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full px-6 py-4 text-lg font-light tracking-wider text-gray-600 hover:text-gray-900 transition-all duration-300 hover:pl-6 text-left"
              >
                Гарах
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarContent isOpen={isOpen} onClose={onClose} />
    </Suspense>
  );
}
