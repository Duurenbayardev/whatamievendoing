'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Address } from '../../types';

function AddressesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  const returnUrl = searchParams.get('returnUrl') || null;
  const [formData, setFormData] = useState<Address>({
    id: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    if (!savedPhone) {
      router.push('/account');
      return;
    }
    loadUser(savedPhone);
  }, [router]);

  const loadUser = async (phone: string) => {
    try {
      const response = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setAddresses(userData.addresses || []);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Бүтэн нэр оруулна уу';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Утасны дугаар оруулна уу';
    } else if (!/^[0-9]{8,10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Зөв утасны дугаар оруулна уу';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Дэлгэрэнгүй хаяг оруулна уу';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Хот оруулна уу';
    }
    
    if (!formData.district.trim()) {
      newErrors.district = 'Дүүрэг/Аймаг оруулна уу';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      const addressData = {
        ...formData,
        id: editingAddress?.id || Date.now().toString(),
      };

      const response = await fetch('/api/users/addresses', {
        method: editingAddress ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          address: addressData,
        }),
      });

      if (response.ok) {
        await loadUser(user.phone);
        setShowForm(false);
        setEditingAddress(null);
        setFormData({
          id: '',
          fullName: '',
          phone: '',
          address: '',
          city: '',
          district: '',
          notes: '',
        });
        
        // Redirect back to returnUrl if provided (e.g., back to cart/checkout)
        if (returnUrl && !editingAddress) {
          router.push(returnUrl);
          return;
        }
      } else {
        throw new Error('Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Хаяг хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Та энэ хаягийг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const response = await fetch('/api/users/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          addressId: addressId,
        }),
      });

      if (response.ok) {
        await loadUser(user.phone);
      } else {
        throw new Error('Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      alert('Хаяг устгахад алдаа гарлаа. Дахин оролдоно уу.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
    setFormData({
      id: '',
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      address: '',
      city: '',
      district: '',
      notes: '',
    });
    setErrors({});
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
            <h1 className="text-3xl font-serif text-gray-900 tracking-tight uppercase">Хаяг засах</h1>
            <Link
              href="/account"
              className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
            >
              Буцах
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
        {!showForm ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setFormData({
                    id: '',
                    fullName: user?.fullName || '',
                    phone: user?.phone || '',
                    address: '',
                    city: '',
                    district: '',
                    notes: '',
                  });
                  setShowForm(true);
                }}
                className="px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                Хаяг нэмэх
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-600 mb-6 font-light text-lg">Одоогоор хаяг байхгүй байна.</p>
                <button
                  onClick={() => {
                    setFormData({
                      id: '',
                      fullName: user?.fullName || '',
                      phone: user?.phone || '',
                      address: '',
                      city: '',
                      district: '',
                      notes: '',
                    });
                    setShowForm(true);
                  }}
                  className="inline-block px-8 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
                >
                  Хаяг нэмэх
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="bg-white border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-900 font-light mb-1">{address.fullName || user.fullName}</p>
                        <p className="text-gray-600 font-light text-sm">{address.phone || user.phone}</p>
                        <p className="text-gray-600 font-light text-sm">{address.address}</p>
                        <p className="text-gray-600 font-light text-sm">{address.district}, {address.city}</p>
                        {address.notes && (
                          <p className="text-gray-500 font-light text-sm mt-1">{address.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(address)}
                          className="px-4 py-2 text-sm font-light tracking-widest uppercase text-gray-900 hover:text-gray-600 transition-colors border border-gray-300 hover:border-gray-400"
                        >
                          Засах
                        </button>
                        <button
                          onClick={() => handleDelete(address.id)}
                          className="px-4 py-2 text-sm font-light tracking-widest uppercase text-red-600 hover:text-red-700 transition-colors border border-red-300 hover:border-red-400"
                        >
                          Устгах
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-serif text-gray-900 tracking-tight uppercase mb-6">
              {editingAddress ? 'Хаяг засах' : 'Шинэ хаяг нэмэх'}
            </h2>

            <div>
              <label htmlFor="fullName" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Бүтэн нэр *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.fullName ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600 font-light">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Утасны дугаар *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="99112233"
                className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.phone ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600 font-light">{errors.phone}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Дэлгэрэнгүй хаяг *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Орд, байр, давхар, тоот"
                className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                  errors.address ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                }`}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600 font-light">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="district" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                  Дүүрэг / Аймаг *
                </label>
                <input
                  type="text"
                  id="district"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  placeholder="Сүхбаатар дүүрэг"
                  className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                    errors.district ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                  }`}
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-red-600 font-light">{errors.district}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                  Хот *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="Улаанбаатар"
                  className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                    errors.city ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-xs text-red-600 font-light">{errors.city}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Нэмэлт мэдээлэл
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Хүргэлтийн талаар нэмэлт зааварчилгаа..."
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-4 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
              >
                Цуцлах
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <Suspense fallback={
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
    }>
      <AddressesContent />
    </Suspense>
  );
}
