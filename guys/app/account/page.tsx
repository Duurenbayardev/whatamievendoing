'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const returnUrl = searchParams.get('returnUrl') || null;

  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
      setIsLoggedIn(true);
      loadUser(savedPhone);
    }
  }, []);

  const loadUser = async (phoneNumber: string) => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/users?phone=${encodeURIComponent(phoneNumber)}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setPhone(userData.phone);
        setFullName(userData.fullName);
        
        // Load user orders for stats
        if (userData.id) {
          const ordersResponse = await fetch(`/api/orders?userId=${userData.id}`);
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setOrders(ordersData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate phone number
      if (!phone.trim()) {
        setError('Утасны дугаар оруулна уу');
        setLoading(false);
        return;
      }

      if (!/^[0-9]{8,10}$/.test(phone.replace(/\s/g, ''))) {
        setError('Зөв утасны дугаар оруулна уу (8-10 орон)');
        setLoading(false);
        return;
      }

      // Check if user exists
      const response = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`);
      
      if (response.ok) {
        // User exists, log them in
        const userData = await response.json();
        localStorage.setItem('userPhone', phone);
        setUser(userData);
        setFullName(userData.fullName);
        setIsLoggedIn(true);
        setIsSignupMode(false);
        
        // If user has no addresses and came from checkout, redirect to address creation
        if ((!userData.addresses || userData.addresses.length === 0) && returnUrl) {
          router.push(`/account/addresses?returnUrl=${encodeURIComponent(returnUrl)}`);
          return;
        }
        
        // Redirect back to returnUrl if provided
        if (returnUrl) {
          router.push(returnUrl);
          return;
        }
      } else if (response.status === 404) {
        // User doesn't exist
        if (isSignupMode) {
          // Create new account
          if (!fullName.trim()) {
            setError('Бүтэн нэр оруулна уу');
            setLoading(false);
            return;
          }

          const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: phone,
              fullName: fullName,
            }),
          });

          if (createResponse.ok) {
            const newUser = await createResponse.json();
            localStorage.setItem('userPhone', phone);
            setUser(newUser);
            setIsLoggedIn(true);
            setIsSignupMode(false);
            
            // If new user has no addresses, redirect to address creation
            if (!newUser.addresses || newUser.addresses.length === 0) {
              const addressUrl = returnUrl ? `/account/addresses?returnUrl=${encodeURIComponent(returnUrl)}` : '/account/addresses';
              router.push(addressUrl);
              return;
            }
            
            // Redirect back to returnUrl if provided
            if (returnUrl) {
              router.push(returnUrl);
              return;
            }
          } else {
            const errorData = await createResponse.json();
            setError(errorData.error || 'Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
          }
        } else {
          setError('Хэрэглэгч олдсонгүй. Шинэ бүртгэл үүсгэх үү?');
        }
      } else {
        setError('Алдаа гарлаа. Дахин оролдоно уу.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate inputs
      if (!phone.trim()) {
        setError('Утасны дугаар оруулна уу');
        setLoading(false);
        return;
      }

      if (!/^[0-9]{8,10}$/.test(phone.replace(/\s/g, ''))) {
        setError('Зөв утасны дугаар оруулна уу (8-10 орон)');
        setLoading(false);
        return;
      }

      if (!fullName.trim()) {
        setError('Бүтэн нэр оруулна уу');
        setLoading(false);
        return;
      }

      // Check if user already exists
      const checkResponse = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`);
      if (checkResponse.ok) {
        setError('Энэ утасны дугаартай бүртгэл аль хэдийн байна. Нэвтрэх хэсэг рүү очно уу.');
        setLoading(false);
        return;
      }

      // Create new user
      const createResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          fullName: fullName,
        }),
      });

      if (createResponse.ok) {
        const newUser = await createResponse.json();
        localStorage.setItem('userPhone', phone);
        setUser(newUser);
        setIsLoggedIn(true);
        setIsSignupMode(false);
        
        // If new user has no addresses, redirect to address creation
        if (!newUser.addresses || newUser.addresses.length === 0) {
          const addressUrl = returnUrl ? `/account/addresses?returnUrl=${encodeURIComponent(returnUrl)}` : '/account/addresses';
          router.push(addressUrl);
          return;
        }
        
        // Redirect back to returnUrl if provided
        if (returnUrl) {
          router.push(returnUrl);
          return;
        }
      } else {
        const errorData = await createResponse.json();
        setError(errorData.error || 'Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userPhone');
    setIsLoggedIn(false);
    setUser(null);
    setOrders([]);
    setPhone('');
    setFullName('');
    setIsSignupMode(false);
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-serif text-gray-900 tracking-tight uppercase">Миний бүртгэл</h1>
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
          {/* Welcome Section with Avatar */}
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-lg md:text-xl lg:text-2xl font-serif">
                {getUserInitials(user.fullName)}
              </div>
              <div className="flex-1">
                <h2 className="text-lg md:text-xl lg:text-2xl font-serif text-gray-900 mb-1 md:mb-2">Сайн байна уу, {user.fullName}!</h2>
                <p className="text-sm md:text-base text-gray-600 font-light">Тавтай морилно уу</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-light text-gray-500 tracking-widest uppercase">Нийт захиалга</p>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              {loadingStats ? (
                <div className="h-8 bg-gray-100 animate-pulse" />
              ) : (
                <p className="text-2xl md:text-3xl font-light text-gray-900">{totalOrders}</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-light text-gray-500 tracking-widest uppercase">Хүлээгдэж байна</p>
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {loadingStats ? (
                <div className="h-8 bg-gray-100 animate-pulse" />
              ) : (
                <p className="text-3xl font-light text-gray-900">{pendingOrders}</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-light text-gray-500 tracking-widest uppercase">Хүргэгдсэн</p>
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {loadingStats ? (
                <div className="h-8 bg-gray-100 animate-pulse" />
              ) : (
                <p className="text-3xl font-light text-gray-900">{deliveredOrders}</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link
              href="/orders"
              className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif text-gray-900 mb-2 uppercase">Миний захиалгууд</h3>
                  <p className="text-sm text-gray-600 font-light">Захиалгын түүхээ харах</p>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/account/addresses"
              className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif text-gray-900 mb-2 uppercase">Хаяг удирдах</h3>
                  <p className="text-sm text-gray-600 font-light">Хаяг нэмэх, засах</p>
                </div>
                <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

          {/* User Info Section */}
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <h2 className="text-base md:text-lg lg:text-xl font-serif text-gray-900 tracking-tight uppercase mb-4 md:mb-6">Хувийн мэдээлэл</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-light text-gray-500 mb-2 tracking-widest uppercase">Бүтэн нэр</p>
                <p className="text-gray-900 font-light text-lg">{user.fullName}</p>
              </div>
              <div>
                <p className="text-xs font-light text-gray-500 mb-2 tracking-widest uppercase">Утасны дугаар</p>
                <p className="text-gray-900 font-light text-lg">{user.phone}</p>
              </div>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="bg-white border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base md:text-lg lg:text-xl font-serif text-gray-900 tracking-tight uppercase">Хаягууд</h2>
              <Link
                href="/account/addresses"
                className="text-sm font-light tracking-widest uppercase text-gray-900 hover:text-gray-600 transition-colors border-b border-gray-900 hover:border-gray-600"
              >
                Засах
              </Link>
            </div>
            {user.addresses && user.addresses.length > 0 ? (
              <div className="space-y-4">
                {user.addresses.map((addr: any, index: number) => (
                  <div key={addr.id || index} className="border border-gray-200 p-4 hover:border-gray-400 transition-colors">
                    <p className="text-gray-900 font-light mb-1 text-lg">{addr.fullName || user.fullName}</p>
                    <p className="text-gray-600 font-light text-sm">{addr.phone || user.phone}</p>
                    <p className="text-gray-600 font-light text-sm">{addr.address}</p>
                    <p className="text-gray-600 font-light text-sm">{addr.district}, {addr.city}</p>
                    {addr.notes && (
                      <p className="text-gray-500 font-light text-sm mt-2 italic">{addr.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 font-light mb-4">Хаяг байхгүй байна</p>
                <Link
                  href="/account/addresses"
                  className="inline-block px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
                >
                  Хаяг нэмэх
                </Link>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
            >
              Гарах
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif text-gray-900 tracking-tight uppercase mb-3 md:mb-4">
              {isSignupMode ? 'Шинэ бүртгэл үүсгэх' : 'Бүртгэлд нэвтрэх'}
            </h1>
            <p className="text-gray-600 font-light">
              {isSignupMode 
                ? 'Бүртгэл үүсгэж, захиалга өгөх боломжтой болно' 
                : 'Утасны дугаараараа нэвтрэнэ үү'}
            </p>
          </div>

          {/* Toggle between login and signup */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsSignupMode(false);
                setError('');
                setPhone('');
                setFullName('');
              }}
              className={`flex-1 py-3 text-sm font-light tracking-widest uppercase transition-colors ${
                !isSignupMode
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Нэвтрэх
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignupMode(true);
                setError('');
                setPhone('');
                setFullName('');
              }}
              className={`flex-1 py-3 text-sm font-light tracking-widest uppercase transition-colors ${
                isSignupMode
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Бүртгэл үүсгэх
            </button>
          </div>

          <form onSubmit={isSignupMode ? handleSignup : handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
                <p className="text-sm font-light">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Утасны дугаар *
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="99112233"
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {(isSignupMode || !isLoggedIn) && (
              <div>
                <label htmlFor="fullName" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                  Бүтэн нэр {isSignupMode && '*'}
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignupMode}
                  placeholder="Бүтэн нэрээ оруулна уу"
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? 'Хүлээгээд байна...' 
                : isSignupMode 
                  ? 'Бүртгэл үүсгэх' 
                  : 'Нэвтрэх'}
            </button>

            <div className="text-center">
              <Link
                href="/shop"
                className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors"
              >
                Цуцлах
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-4">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-gray-600 font-light">Ачааллаж байна...</p>
        </div>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
