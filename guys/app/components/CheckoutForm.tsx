'use client';

import { useState, useEffect } from 'react';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  notes?: string;
}

interface CheckoutFormProps {
  productName: string;
  productSize: string;
  productPrice: number;
  productImage: string;
  productCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (orderId: string) => void;
}

export default function CheckoutForm({
  productName,
  productSize,
  productPrice,
  productImage,
  productCode,
  isOpen,
  onClose,
  onComplete,
}: CheckoutFormProps) {
  const [formData, setFormData] = useState<Address>({
    id: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    // Try to auto-populate from user's saved address if they have exactly one
    const loadUserAddress = async () => {
      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone) {
        setLoadingUser(true);
        try {
          const response = await fetch(`/api/users?phone=${encodeURIComponent(savedPhone)}`);
          if (response.ok) {
            const user = await response.json();
            // If user has exactly one address, auto-populate
            if (user.addresses && user.addresses.length === 1) {
              const address = user.addresses[0];
              setFormData({
                id: address.id || '',
                fullName: user.fullName || '',
                phone: user.phone || '',
                address: address.address || '',
                city: address.city || '',
                district: address.district || '',
                notes: address.notes || '',
              });
            } else if (user.fullName && user.phone) {
              // At least populate name and phone
              setFormData(prev => ({
                ...prev,
                fullName: user.fullName,
                phone: user.phone,
              }));
            }
          }
        } catch (error) {
          console.error('Failed to load user address:', error);
        } finally {
          setLoadingUser(false);
        }
      }
    };

    if (isOpen) {
      loadUserAddress();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (submitError) {
      setSubmitError('');
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
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);

    try {
      // Prepare address object
      const addressData = {
        id: Date.now().toString(),
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        notes: formData.notes || '',
      };

      // Create or update user (always save address)
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          fullName: formData.fullName,
          address: addressData,
        }),
      });

      if (!userResponse.ok) {
        throw new Error('Failed to create/update user');
      }

      const user = await userResponse.json();

      // Save phone number for order retrieval
      localStorage.setItem('userPhone', formData.phone);

      // Create order in database
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productName,
          productSize,
          productPrice,
          productImage,
          productCode: productCode || '',
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          district: formData.district,
          notes: formData.notes || '',
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();

      // Also save to localStorage for backward compatibility
      const existingOrders = localStorage.getItem('orders');
      const orders = existingOrders ? JSON.parse(existingOrders) : [];
      orders.push({
        ...order,
        // Keep old format for compatibility
      });
      localStorage.setItem('orders', JSON.stringify(orders));

      // Close form and show thank you screen
      setSubmitting(false);
      onClose();
      onComplete(order.id);
    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError('Захиалга өгөхөд алдаа гарлаа. Дахин оролдоно уу.');
      setSubmitting(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-serif text-gray-900 tracking-tight uppercase">Захиалга өгөх</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Захиалгын дэлгэрэнгүй</h3>
            <div className="space-y-2">
              <p className="text-gray-900 font-light"><span className="font-medium">Бүтээгдэхүүн:</span> {productName}</p>
              <p className="text-gray-900 font-light"><span className="font-medium">Хэмжээ:</span> {productSize}</p>
              <p className="text-gray-900 font-light"><span className="font-medium">Үнэ:</span> ₮{productPrice.toLocaleString()}</p>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
              <p className="text-sm font-light">{submitError}</p>
            </div>
          )}

          {/* Address Form */}
          {loadingUser ? (
            <div className="text-center py-8">
              <p className="text-gray-600 font-light">Хаяг ачааллаж байна...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  onClick={onClose}
                  className="flex-1 px-6 py-4 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
                >
                  Цуцлах
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Захиалга өгөж байна...' : 'Захиалга өгөх'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
