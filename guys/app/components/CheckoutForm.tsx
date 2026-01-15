'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CartItem } from '../types';

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
  productId?: string; // Product ID for stock management
  isOpen: boolean;
  onClose: () => void;
  onComplete: (orderId: string) => void;
  cartItems?: CartItem[]; // Optional cart items for multiple item checkout
  returnUrl?: string; // URL to redirect back to after account creation
}

export default function CheckoutForm({
  productName,
  productSize,
  productPrice,
  productImage,
  productId,
  isOpen,
  onClose,
  onComplete,
  cartItems,
  returnUrl,
}: CheckoutFormProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  
  // Inline account creation state
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountPhone, setAccountPhone] = useState('');
  const [accountFullName, setAccountFullName] = useState('');
  const [accountError, setAccountError] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  
  // Inline address creation state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState<Address>({
    id: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    notes: '',
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [creatingAddress, setCreatingAddress] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const savedPhone = localStorage.getItem('userPhone');
      if (!savedPhone) {
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);
      try {
        const response = await fetch(`/api/users?phone=${encodeURIComponent(savedPhone)}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // Auto-select first address if only one exists
          if (userData.addresses && userData.addresses.length === 1) {
            const addr = userData.addresses[0];
            // Ensure address has fullName and phone from user if not in address
            setSelectedAddress({
              ...addr,
              fullName: addr.fullName || userData.fullName,
              phone: addr.phone || userData.phone,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    if (isOpen) {
      loadUser();
      // Reset forms when modal opens
      setShowAccountForm(false);
      setShowAddressForm(false);
      setAccountPhone('');
      setAccountFullName('');
      setAccountError('');
      setIsSignupMode(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!selectedAddress) {
      setSubmitError('Хаяг сонгоно уу');
      return;
    }
    
    setSubmitting(true);

    try {
      // If cartItems provided, create orders for each item
      if (cartItems && cartItems.length > 0) {
        // Process orders sequentially to avoid partial failures
        const createdOrders: any[] = [];
        const errors: string[] = [];
        
        for (let i = 0; i < cartItems.length; i++) {
          const item = cartItems[i];
          try {
            const response = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                productId: item.productId,
                productName: item.productName,
                productSize: item.size,
                productPrice: item.price,
                productImage: item.productImage,
                quantity: item.quantity || 1,
                fullName: selectedAddress.fullName || user.fullName,
                phone: selectedAddress.phone || user.phone,
                address: selectedAddress.address,
                city: selectedAddress.city,
                district: selectedAddress.district,
                notes: selectedAddress.notes || '',
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              const errorMessage = errorData.error || `"${item.productName}" захиалга өгөхөд алдаа гарлаа.`;
              errors.push(errorMessage);
              
              // If we have created orders, we can't easily rollback stock
              // But we'll report the error and stop processing
              if (createdOrders.length > 0) {
                throw new Error(
                  `${createdOrders.length} захиалга амжилттай болсон боловч "${item.productName}" захиалга өгөхөд алдаа гарлаа: ${errorMessage}. Системийн админд хандана уу.`
                );
              } else {
                throw new Error(errorMessage);
              }
            }

            const order = await response.json();
            createdOrders.push(order);
          } catch (error) {
            // If this is the first order and it fails, throw immediately
            if (createdOrders.length === 0) {
              const errorMessage = error instanceof Error ? error.message : 'Захиалга өгөхөд алдаа гарлаа.';
              throw new Error(errorMessage);
            }
            // If we've created some orders, throw with context
            throw error;
          }
        }

        // All orders created successfully
        // Save to localStorage
        const existingOrders = localStorage.getItem('orders');
        const savedOrders = existingOrders ? JSON.parse(existingOrders) : [];
        savedOrders.push(...createdOrders);
        localStorage.setItem('orders', JSON.stringify(savedOrders));

        setSubmitting(false);
        onClose();
        onComplete(createdOrders[0].id); // Return first order ID
      } else {
        // Single product order (backward compatibility)
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            productId: productId,
            productName,
            productSize,
            productPrice,
            productImage,
            quantity: 1, // Default to 1 for single product orders
            fullName: selectedAddress.fullName || user.fullName,
            phone: selectedAddress.phone || user.phone,
            address: selectedAddress.address,
            city: selectedAddress.city,
            district: selectedAddress.district,
            notes: selectedAddress.notes || '',
          }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Захиалга өгөхөд алдаа гарлаа.';
          throw new Error(errorMessage);
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

        setSubmitting(false);
        onClose();
        onComplete(order.id);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Захиалга өгөхөд алдаа гарлаа. Дахин оролдоно уу.';
      setSubmitError(errorMessage);
      setSubmitting(false);
    }
  };

  // Handle inline account creation/login
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    setCreatingAccount(true);

    try {
      if (!accountPhone.trim()) {
        setAccountError('Утасны дугаар оруулна уу');
        setCreatingAccount(false);
        return;
      }

      if (!/^[0-9]{8,10}$/.test(accountPhone.replace(/\s/g, ''))) {
        setAccountError('Зөв утасны дугаар оруулна уу (8-10 орон)');
        setCreatingAccount(false);
        return;
      }

      // Check if user exists
      const checkResponse = await fetch(`/api/users?phone=${encodeURIComponent(accountPhone)}`);
      
      if (checkResponse.ok) {
        // User exists, log them in
        const userData = await checkResponse.json();
        localStorage.setItem('userPhone', accountPhone);
        setUser(userData);
        setShowAccountForm(false);
        setAccountPhone('');
        setAccountFullName('');
        
        // If no addresses, show address form
        if (!userData.addresses || userData.addresses.length === 0) {
          setShowAddressForm(true);
          setAddressFormData({
            id: '',
            fullName: userData.fullName || '',
            phone: userData.phone || '',
            address: '',
            city: '',
            district: '',
            notes: '',
          });
        }
      } else if (checkResponse.status === 404) {
        // User doesn't exist, create account
        if (isSignupMode) {
          if (!accountFullName.trim()) {
            setAccountError('Бүтэн нэр оруулна уу');
            setCreatingAccount(false);
            return;
          }

          const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: accountPhone,
              fullName: accountFullName,
            }),
          });

          if (createResponse.ok) {
            const newUser = await createResponse.json();
            localStorage.setItem('userPhone', accountPhone);
            setUser(newUser);
            setShowAccountForm(false);
            setAccountPhone('');
            setAccountFullName('');
            
            // Automatically show address form for new users
            setShowAddressForm(true);
            setAddressFormData({
              id: '',
              fullName: newUser.fullName || '',
              phone: newUser.phone || '',
              address: '',
              city: '',
              district: '',
              notes: '',
            });
          } else {
            const errorData = await createResponse.json();
            setAccountError(errorData.error || 'Бүртгэл үүсгэхэд алдаа гарлаа.');
          }
        } else {
          setAccountError('Хэрэглэгч олдсонгүй. Шинэ бүртгэл үүсгэх үү?');
          setIsSignupMode(true);
        }
      } else {
        setAccountError('Алдаа гарлаа. Дахин оролдоно уу.');
      }
    } catch (error) {
      console.error('Account error:', error);
      setAccountError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setCreatingAccount(false);
    }
  };

  // Handle inline address creation
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddressFormData({
      ...addressFormData,
      [name]: value,
    });
    if (addressErrors[name]) {
      setAddressErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateAddressForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!addressFormData.fullName.trim()) {
      newErrors.fullName = 'Бүтэн нэр оруулна уу';
    }
    
    if (!addressFormData.phone.trim()) {
      newErrors.phone = 'Утасны дугаар оруулна уу';
    } else if (!/^[0-9]{8,10}$/.test(addressFormData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Зөв утасны дугаар оруулна уу';
    }
    
    if (!addressFormData.address.trim()) {
      newErrors.address = 'Дэлгэрэнгүй хаяг оруулна уу';
    }
    
    if (!addressFormData.city.trim()) {
      newErrors.city = 'Хот оруулна уу';
    }
    
    if (!addressFormData.district.trim()) {
      newErrors.district = 'Дүүрэг/Аймаг оруулна уу';
    }
    
    setAddressErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddressForm()) {
      return;
    }
    
    setCreatingAddress(true);

    try {
      const addressData = {
        ...addressFormData,
        id: Date.now().toString(),
      };

      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: user.phone,
          address: addressData,
        }),
      });

      if (response.ok) {
        // Reload user to get updated addresses
        const userResponse = await fetch(`/api/users?phone=${encodeURIComponent(user.phone)}`);
        if (userResponse.ok) {
          const updatedUser = await userResponse.json();
          setUser(updatedUser);
          
          // Auto-select the newly created address
          const newAddress = updatedUser.addresses.find((addr: Address) => addr.id === addressData.id);
          if (newAddress) {
            setSelectedAddress({
              ...newAddress,
              fullName: newAddress.fullName || updatedUser.fullName,
              phone: newAddress.phone || updatedUser.phone,
            });
          }
        }
        
        setShowAddressForm(false);
        setAddressFormData({
          id: '',
          fullName: '',
          phone: '',
          address: '',
          city: '',
          district: '',
          notes: '',
        });
      } else {
        throw new Error('Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      setSubmitError('Хаяг хадгалахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setCreatingAddress(false);
    }
  };

  const handleLoginRedirect = () => {
    onClose();
    // Pass returnUrl if provided, otherwise default to cart if cartItems exist, or product page
    const url = returnUrl || (cartItems && cartItems.length > 0 ? '/cart' : (productId ? `/products/${productId}` : '/account'));
    router.push(`/account?returnUrl=${encodeURIComponent(url)}`);
  };

  const handleAddAddressRedirect = () => {
    onClose();
    // Pass returnUrl to addresses page so it can redirect back
    const url = returnUrl || (cartItems && cartItems.length > 0 ? '/cart' : (productId ? `/products/${productId}` : '/account/addresses'));
    router.push(`/account/addresses?returnUrl=${encodeURIComponent(url)}`);
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
            {cartItems && cartItems.length > 0 ? (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div>
                      <p className="text-gray-900 font-light">{item.productName}</p>
                      <p className="text-gray-600 font-light text-sm">Хэмжээ: {item.size}</p>
                      <p className="text-gray-600 font-light text-sm">Тоо ширхэг: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-light">₮{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-gray-900 font-light text-lg">
                    <span className="font-medium">Нийт дүн:</span> ₮{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-900 font-light"><span className="font-medium">Бүтээгдэхүүн:</span> {productName}</p>
                <p className="text-gray-900 font-light"><span className="font-medium">Хэмжээ:</span> {productSize}</p>
                <p className="text-gray-900 font-light"><span className="font-medium">Үнэ:</span> ₮{productPrice.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
              <p className="text-sm font-light">{submitError}</p>
            </div>
          )}

          {/* Check login and address status */}
          {loadingUser ? (
            <div className="text-center py-8">
              <p className="text-gray-600 font-light">Мэдээлэл ачааллаж байна...</p>
            </div>
          ) : !user ? (
            // Show inline account creation form
            showAccountForm ? (
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                    Утасны дугаар *
                  </label>
                  <input
                    type="tel"
                    value={accountPhone}
                    onChange={(e) => setAccountPhone(e.target.value)}
                    placeholder="99112233"
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                
                {isSignupMode && (
                  <div>
                    <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                      Бүтэн нэр *
                    </label>
                    <input
                      type="text"
                      value={accountFullName}
                      onChange={(e) => setAccountFullName(e.target.value)}
                      placeholder="Ж. Бат"
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                )}
                
                {accountError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm font-light">
                    {accountError}
                  </div>
                )}
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccountForm(false);
                      setAccountPhone('');
                      setAccountFullName('');
                      setAccountError('');
                      setIsSignupMode(false);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAccount}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingAccount ? 'Хүлээгээд байна...' : isSignupMode ? 'Бүртгэл үүсгэх' : 'Нэвтрэх'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-600 font-light">Захиалга өгөхийн тулд эхлээд бүртгэлд нэвтрэх шаардлагатай.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowAccountForm(true)}
                    className="px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
                  >
                    Бүртгэлд нэвтрэх
                  </button>
                  <button
                    onClick={handleLoginRedirect}
                    className="px-6 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
                  >
                    Бүртгэлийн хуудас руу
                  </button>
                </div>
              </div>
            )
          ) : !user.addresses || user.addresses.length === 0 ? (
            // Show inline address creation form
            showAddressForm ? (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                    Бүтэн нэр *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={addressFormData.fullName}
                    onChange={handleAddressChange}
                    required
                    className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                      addressErrors.fullName ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                    }`}
                  />
                  {addressErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600 font-light">{addressErrors.fullName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                    Утасны дугаар *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={addressFormData.phone}
                    onChange={handleAddressChange}
                    placeholder="99112233"
                    required
                    className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                      addressErrors.phone ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                    }`}
                  />
                  {addressErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 font-light">{addressErrors.phone}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                    Дэлгэрэнгүй хаяг *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={addressFormData.address}
                    onChange={handleAddressChange}
                    placeholder="Орд, байр, давхар, тоот"
                    required
                    className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                      addressErrors.address ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                    }`}
                  />
                  {addressErrors.address && (
                    <p className="mt-1 text-xs text-red-600 font-light">{addressErrors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                      Дүүрэг / Аймаг *
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={addressFormData.district}
                      onChange={handleAddressChange}
                      placeholder="Сүхбаатар дүүрэг"
                      required
                      className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                        addressErrors.district ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                      }`}
                    />
                    {addressErrors.district && (
                      <p className="mt-1 text-xs text-red-600 font-light">{addressErrors.district}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                      Хот *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={addressFormData.city}
                      onChange={handleAddressChange}
                      placeholder="Улаанбаатар"
                      required
                      className={`w-full px-4 py-3 bg-white border text-gray-900 placeholder-gray-500 focus:outline-none transition-colors ${
                        addressErrors.city ? 'border-red-300 focus:border-red-400' : 'border-gray-300 focus:border-gray-400'
                      }`}
                    />
                    {addressErrors.city && (
                      <p className="mt-1 text-xs text-red-600 font-light">{addressErrors.city}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">
                    Нэмэлт мэдээлэл
                  </label>
                  <textarea
                    name="notes"
                    value={addressFormData.notes}
                    onChange={handleAddressChange}
                    rows={2}
                    placeholder="Хүргэлтийн талаар нэмэлт зааварчилгаа..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setAddressFormData({
                        id: '',
                        fullName: user.fullName || '',
                        phone: user.phone || '',
                        address: '',
                        city: '',
                        district: '',
                        notes: '',
                      });
                      setAddressErrors({});
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    disabled={creatingAddress}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingAddress ? 'Хадгалж байна...' : 'Хадгалах'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-600 font-light">Захиалга өгөхийн тулд эхлээд хаяг нэмэх шаардлагатай.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setShowAddressForm(true);
                      setAddressFormData({
                        id: '',
                        fullName: user.fullName || '',
                        phone: user.phone || '',
                        address: '',
                        city: '',
                        district: '',
                        notes: '',
                      });
                    }}
                    className="px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
                  >
                    Хаяг нэмэх
                  </button>
                  <button
                    onClick={handleAddAddressRedirect}
                    className="px-6 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
                  >
                    Хаягийн хуудас руу
                  </button>
                </div>
              </div>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                  Хүргэх хаяг сонгох *
                </label>
                <div className="space-y-3">
                  {user.addresses.map((address: Address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border cursor-pointer transition-colors ${
                        selectedAddress?.id === address.id
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={address.id}
                        checked={selectedAddress?.id === address.id}
                        onChange={() => {
                      setSelectedAddress({
                        ...address,
                        fullName: address.fullName || user.fullName,
                        phone: address.phone || user.phone,
                      });
                    }}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                          selectedAddress?.id === address.id
                            ? 'border-gray-900'
                            : 'border-gray-400'
                        }`}>
                          {selectedAddress?.id === address.id && (
                            <div className="w-2 h-2 bg-gray-900 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-light mb-1">{address.fullName || user.fullName}</p>
                          <p className="text-gray-600 font-light text-sm">{address.phone || user.phone}</p>
                          <p className="text-gray-600 font-light text-sm">{address.address}</p>
                          <p className="text-gray-600 font-light text-sm">{address.district}, {address.city}</p>
                          {address.notes && (
                            <p className="text-gray-500 font-light text-sm mt-1">{address.notes}</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleAddAddressRedirect}
                    className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors underline"
                  >
                    Шинэ хаяг нэмэх
                  </button>
                </div>
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
                  disabled={submitting || !selectedAddress}
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
