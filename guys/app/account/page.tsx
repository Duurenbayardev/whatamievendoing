'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
      setIsLoggedIn(true);
      loadUser(savedPhone);
    }
  }, []);

  const loadUser = async (phoneNumber: string) => {
    try {
      const response = await fetch(`/api/users?phone=${encodeURIComponent(phoneNumber)}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setPhone(userData.phone);
        setFullName(userData.fullName);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
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
        setError('Зөв утасны дугаар оруулна уу');
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
      } else if (response.status === 404) {
        // User doesn't exist, ask for name to create account
        if (!fullName.trim()) {
          setError('Хэрэглэгч олдсонгүй. Хэрэв танд бүртгэл байхгүй бол бүтэн нэрээ оруулна уу');
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
        } else {
          setError('Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
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

  const handleLogout = () => {
    localStorage.removeItem('userPhone');
    setIsLoggedIn(false);
    setUser(null);
    setPhone('');
    setFullName('');
  };

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-serif text-gray-900 tracking-tight uppercase">Миний бүртгэл</h1>
              <Link
                href="/shop"
                className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
              >
                Дэлгүүр рүү буцах
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
          <div className="space-y-8">
            {/* User Info */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-xl font-serif text-gray-900 tracking-tight uppercase mb-6">Хувийн мэдээлэл</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-light text-gray-500 mb-2 tracking-widest uppercase">Бүтэн нэр</p>
                  <p className="text-gray-900 font-light">{user.fullName}</p>
                </div>
                <div>
                  <p className="text-xs font-light text-gray-500 mb-2 tracking-widest uppercase">Утасны дугаар</p>
                  <p className="text-gray-900 font-light">{user.phone}</p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif text-gray-900 tracking-tight uppercase">Хаягууд</h2>
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
                    <div key={addr.id || index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <p className="text-gray-900 font-light mb-1">{addr.fullName || user.fullName}</p>
                      <p className="text-gray-600 font-light text-sm">{addr.phone || user.phone}</p>
                      <p className="text-gray-600 font-light text-sm">{addr.address}</p>
                      <p className="text-gray-600 font-light text-sm">{addr.district}, {addr.city}</p>
                      {addr.notes && (
                        <p className="text-gray-500 font-light text-sm mt-1">{addr.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
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
                className="px-6 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
              >
                Гарах
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif text-gray-900 tracking-tight uppercase mb-4">Бүртгэлд нэвтрэх</h1>
          <p className="text-gray-600 font-light">Утасны дугаараараа нэвтрэнэ үү</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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

          {!isLoggedIn && (
            <div>
              <label htmlFor="fullName" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Бүтэн нэр {user === null && '(* Хэрэв танд бүртгэл байхгүй бол)'}
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Бүртгэл байхгүй бол бүтэн нэрээ оруулна уу"
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Хүлээгээд байна...' : 'Нэвтрэх'}
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
  );
}
