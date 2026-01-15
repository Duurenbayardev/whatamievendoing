'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '../types';

const ADMIN_PASSWORD = 'evt';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showOrderDeleteConfirm, setShowOrderDeleteConfirm] = useState<string | null>(null);
  // Preset Mongolian tags
  const presetMongolianTags = [
    'Эрэгтэй',
    'Эмэгтэй',
    'Зуны',
    'Өвлийн',
    'Намар',
    'Хаврын',
    'Хувцас',
    'Гутал',
    'Цүнх',
    'Даашинз',
    'Шуудан',
    'Хипстер',
    'Жинс',
    'Цамц',
    'Хувцаслагч',
    'Хувцасны загвар',
    'Шинэ',
    'Хямдрал',
    'Онцлох',
    'Супер хямд',
  ];

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'tags' | 'orders'>('products');
  const [tagManagementInput, setTagManagementInput] = useState('');
  const [tagUsage, setTagUsage] = useState<Record<string, number>>({});
  const [deletingTag, setDeletingTag] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    sizes: 'S,M,L,XL',
    stock: '', // Will be converted to size-specific format: "S:10,M:5,L:8"
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch data only when authenticated
    if (isAuthenticated) {
      fetchProducts();
      fetchTags();
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMessage('Захиалгын статус амжилттай шинэчлэгдлээ.');
        setTimeout(() => setMessage(''), 3000);
        fetchOrders();
      } else {
        setMessage('Статус шинэчлэхэд алдаа гарлаа.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage('Статус шинэчлэхэд алдаа гарлаа.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Захиалга амжилттай устгагдлаа.');
        setShowOrderDeleteConfirm(null);
        fetchOrders();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Захиалга устгахад алдаа гарлаа. Дахин оролдоно уу.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      setMessage('Алдаа гарлаа. Дахин оролдоно уу.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  useEffect(() => {
    // Update tag usage when products change
    if (products.length >= 0) {
      const usage: Record<string, number> = {};
      products.forEach((product) => {
        product.tags.forEach((tag) => {
          usage[tag] = (usage[tag] || 0) + 1;
        });
      });
      setTagUsage(usage);
    }
  }, [products]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (password.toLowerCase() === ADMIN_PASSWORD.toLowerCase()) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setPassword('');
    } else {
      setPasswordError('Буруу нууц үг. Дахин оролдоно уу.');
      setPassword('');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      // Sort by newest first (already sorted from API, but ensure it)
      const sortedData = data.sort((a: Product, b: Product) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Newest first
      });
      setProducts(sortedData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/products/tags');
      const data = await response.json();
      setAvailableTags(data);
      // Calculate tag usage
      const usage: Record<string, number> = {};
      products.forEach((product) => {
        product.tags.forEach((tag) => {
          usage[tag] = (usage[tag] || 0) + 1;
        });
      });
      setTagUsage(usage);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage('');

    // Validate required fields
    if (!formData.name.trim()) {
      setMessage('Бүтээгдэхүүний нэрийг оруулна уу.');
      setSubmitLoading(false);
      return;
    }

    // Check if at least one image exists (either in images array or single image field)
    if (images.length === 0 && !formData.image.trim()) {
      setMessage('Дор хаяж нэг зураг оруулна уу.');
      setSubmitLoading(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setMessage('Зөв үнэ оруулна уу.');
      setSubmitLoading(false);
      return;
    }

    try {
      // Combine images: use images array if available, otherwise use single image, or combine both
      const allImages = images.length > 0 
        ? images 
        : (formData.image ? [formData.image] : []);
      
      // Process stock - convert to size-specific format
      const sizesArray = formData.sizes.split(',').map((size) => size.trim()).filter(Boolean);
      let stock: Record<string, number> | undefined = undefined;
      
      if (formData.stock.trim()) {
        // Check if stock is in format "S:10,M:5,L:8"
        if (formData.stock.includes(':')) {
          stock = {};
          const stockEntries = formData.stock.split(',').map((entry) => entry.trim());
          stockEntries.forEach((entry) => {
            const [size, qty] = entry.split(':').map((s) => s.trim());
            if (size && qty && !isNaN(parseInt(qty))) {
              stock![size] = parseInt(qty);
            }
          });
        } else {
          // Single number - distribute evenly across sizes
          const totalStock = parseInt(formData.stock);
          if (!isNaN(totalStock) && sizesArray.length > 0) {
            stock = {};
            sizesArray.forEach((size) => {
              stock![size] = Math.floor(totalStock / sizesArray.length);
            });
          }
        }
      }
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        ...(hasDiscount && formData.originalPrice && parseFloat(formData.originalPrice) > parseFloat(formData.price) && {
          originalPrice: parseFloat(formData.originalPrice),
        }),
        image: allImages[0] || formData.image, // First image as main image for backward compatibility
        images: allImages, // Multiple images array
        tags: selectedTags,
        sizes: sizesArray,
        stock, // Size-specific stock
      };

      if (editingProduct) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          setMessage('Бүтээгдэхүүн амжилттай шинэчлэгдлээ!');
          setEditingProduct(null);
          resetForm();
          fetchProducts();
        } else {
          setMessage('Бүтээгдэхүүн шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.');
        }
      } else {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          setMessage('Бүтээгдэхүүн амжилттай нэмэгдлээ!');
          resetForm();
          fetchProducts();
          fetchTags(); // Refresh available tags
        } else {
          setMessage('Бүтээгдэхүүн нэмэхэд алдаа гарлаа. Дахин оролдоно уу.');
        }
      }
    } catch (error) {
      setMessage('Алдаа гарлаа. Дахин оролдоно уу.');
      console.error(error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setSelectedTags(product.tags || []);
    const hasOriginalPrice = product.originalPrice && product.originalPrice > product.price;
    setHasDiscount(hasOriginalPrice || false);
    
    // Set images array if available, otherwise use single image
    const productImages = product.images && product.images.length > 0 
      ? product.images 
      : (product.image ? [product.image] : []);
    
    setImages(productImages);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
      image: product.image,
      sizes: product.sizes.join(', '),
      stock: (() => {
        if (product.stock === undefined) return '';
        const stock = product.stock as Record<string, number> | number;
        if (typeof stock === 'object' && stock !== null && !Array.isArray(stock)) {
          return Object.entries(stock).map(([size, qty]) => `${size}:${qty}`).join(',');
        }
        if (typeof stock === 'number') {
          return stock.toString();
        }
        return '';
      })(),
    });
    setImagePreview(product.image);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Бүтээгдэхүүн амжилттай устгагдлаа!');
        setShowDeleteConfirm(null);
        fetchProducts();
      } else {
        setMessage('Бүтээгдэхүүн устгахад алдаа гарлаа. Дахин оролдоно уу.');
      }
    } catch (error) {
      setMessage('Алдаа гарлаа. Дахин оролдоно уу.');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      image: '',
      sizes: 'S,M,L,XL',
      stock: '',
    });
    setImages([]);
    setSelectedTags([]);
    setNewTagInput('');
    setHasDiscount(false);
    setEditingProduct(null);
    setImagePreview('');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };


  const addNewTag = () => {
    const trimmedTag = newTagInput.trim();
    if (trimmedTag && !availableTags.includes(trimmedTag) && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
      setAvailableTags(prev => [...prev, trimmedTag]);
      setNewTagInput('');
    } else if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags(prev => [...prev, trimmedTag]);
      setNewTagInput('');
    }
  };

  const addGlobalTag = async () => {
    const trimmedTag = tagManagementInput.trim();
    if (!trimmedTag) return;
    
    if (availableTags.includes(trimmedTag)) {
      setMessage('Энэ шошго аль хэдийн байна.');
      return;
    }

    // Add tag to available tags list (it will be available for selection)
    setAvailableTags(prev => [...prev, trimmedTag]);
    setTagManagementInput('');
    setMessage('Шошго амжилттай нэмэгдлээ.');
    setTimeout(() => setMessage(''), 3000);
  };

  const removeTag = async (tagToRemove: string) => {
    setDeletingTag(tagToRemove);
    
    try {
      // Remove tag from all products that have it
      const productsWithTag = products.filter(p => p.tags.includes(tagToRemove));
      
      for (const product of productsWithTag) {
        const updatedTags = product.tags.filter(t => t !== tagToRemove);
        await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...product,
            tags: updatedTags,
          }),
        });
      }

      // Remove from available tags
      setAvailableTags(prev => prev.filter(t => t !== tagToRemove));
      setMessage(`Шошго "${tagToRemove}" бүх бүтээгдэхүүнээс амжилттай устгагдлаа.`);
      setTimeout(() => setMessage(''), 3000);
      
      // Refresh products
      fetchProducts();
    } catch (error) {
      console.error('Error removing tag:', error);
      setMessage('Шошго устгахад алдаа гарлаа.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setDeletingTag(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Update preview when image URL changes
    if (e.target.name === 'image') {
      setImagePreview(e.target.value);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate all files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        setMessage(`Файл "${file.name}": Буруу файлын төрөл. Зөвхөн JPEG, PNG, WebP, GIF зургуудыг зөвшөөрнө.`);
        e.target.value = '';
        return;
      }
      if (file.size > maxSize) {
        setMessage(`Файл "${file.name}": Файлын хэмжээ хэт том. Хамгийн ихдээ 5MB байх ёстой.`);
        e.target.value = '';
        return;
      }
    }

    setUploadingImage(true);
    setMessage('');

    // Upload files sequentially
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.url) {
          // Add to images array
          setImages(prev => {
            const newImages = [...prev, data.url];
            // Also set as main image if it's the first one
            if (newImages.length === 1) {
              setFormData(prevForm => ({
                ...prevForm,
                image: data.url,
              }));
              setImagePreview(data.url);
            }
            return newImages;
          });
        } else {
          let errorMessage = `Файл "${file.name}": Зураг байршуулахад алдаа гарлаа.`;
          if (data.error?.includes('Invalid file type')) {
            errorMessage = `Файл "${file.name}": Буруу файлын төрөл.`;
          } else if (data.error?.includes('File size too large')) {
            errorMessage = `Файл "${file.name}": Файлын хэмжээ хэт том.`;
          }
          setMessage(errorMessage);
          setTimeout(() => setMessage(''), 5000);
        }
      }

      if (files.length > 0) {
        setMessage(`${files.length} зураг амжилттай байршууллаа!`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Зураг байршуулахад алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white border border-gray-200 p-8">
            <h1 className="text-3xl font-serif text-gray-900 mb-6 tracking-tight uppercase text-center">Админ</h1>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                  Нууц үг
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Нууц үгээ оруулна уу"
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                  required
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-xs text-red-600 font-light">{passwordError}</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-all duration-300"
              >
                Нэвтрэх
              </button>
            </form>
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/shop')}
                className="text-sm font-light text-gray-600 hover:text-gray-900 transition-colors tracking-wider uppercase"
              >
                Дэлгүүр рүү буцах
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show admin panel if authenticated
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif text-gray-900 tracking-tight uppercase">Админ</h1>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_authenticated');
                setIsAuthenticated(false);
                router.push('/shop');
              }}
              className="px-6 py-2 text-sm font-light text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 transition-colors tracking-widest uppercase"
            >
              Гарах
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-4 px-2 text-sm font-light tracking-widest uppercase transition-colors ${
                activeTab === 'products'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
              }`}
            >
              Бүтээгдэхүүн
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`pb-4 px-2 text-sm font-light tracking-widest uppercase transition-colors ${
                activeTab === 'tags'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
              }`}
            >
              Шошго удирдах
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-2 text-sm font-light tracking-widest uppercase transition-colors ${
                activeTab === 'orders'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-600 hover:text-gray-900 border-b-2 border-transparent'
              }`}
            >
              Захиалгууд
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 ${
            message.includes('амжилттай') || message.includes('Амжилттай')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <p className="text-sm font-light">{message}</p>
          </div>
        )}

        {/* Tag Management Section */}
        {activeTab === 'tags' && (
          <div className="mb-12">
            <h2 className="text-2xl font-serif text-gray-900 mb-6 tracking-tight uppercase">
              Шошго удирдах
            </h2>
            
            {/* Add New Tag */}
            <div className="bg-white border border-gray-200 p-8 mb-8">
              <h3 className="text-lg font-light text-gray-900 mb-4 tracking-widest uppercase">
                Шинэ шошго нэмэх
              </h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tagManagementInput}
                  onChange={(e) => setTagManagementInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addGlobalTag();
                    }
                  }}
                  placeholder="Шинэ шошго нэмэх..."
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={addGlobalTag}
                  className="px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
                >
                  Нэмэх
                </button>
              </div>
            </div>

            {/* All Tags List */}
            <div className="bg-white border border-gray-200 p-8">
              <h3 className="text-lg font-light text-gray-900 mb-6 tracking-widest uppercase">
                Бүх шошго
              </h3>
              
              {/* Preset Tags */}
              <div className="mb-8">
                <p className="text-xs font-medium text-gray-600 mb-4 tracking-widest uppercase">
                  Урьдчилсан шошго ({presetMongolianTags.filter(tag => availableTags.includes(tag)).length})
                </p>
                {presetMongolianTags.filter(tag => availableTags.includes(tag)).length === 0 ? (
                  <p className="text-sm text-gray-500 font-light">Одоогоор урьдчилсан шошго байхгүй байна.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {presetMongolianTags
                      .filter(tag => availableTags.includes(tag))
                      .map((tag) => (
                        <div
                          key={tag}
                          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 flex items-center gap-2 hover:border-gray-400 transition-colors"
                        >
                          <span className="text-sm font-light">{tag}</span>
                          <span className="text-xs text-gray-500">
                            ({tagUsage[tag] || 0} бүтээгдэхүүн)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            disabled={deletingTag === tag}
                            className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            title="Шошго устгах"
                          >
                            {deletingTag === tag ? 'Устгаж байна...' : '×'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Custom Tags */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-4 tracking-widest uppercase">
                  Нэмэлт шошго ({availableTags.filter(t => !presetMongolianTags.includes(t)).length})
                </p>
                {availableTags.filter(t => !presetMongolianTags.includes(t)).length === 0 ? (
                  <p className="text-sm text-gray-500 font-light">Одоогоор нэмэлт шошго байхгүй байна.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {availableTags
                      .filter(tag => !presetMongolianTags.includes(tag))
                      .map((tag) => (
                        <div
                          key={tag}
                          className="px-4 py-2 bg-white text-gray-700 border border-gray-300 flex items-center gap-2 hover:border-gray-400 transition-colors"
                        >
                          <span className="text-sm font-light">{tag}</span>
                          <span className="text-xs text-gray-500">
                            ({tagUsage[tag] || 0} бүтээгдэхүүн)
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            disabled={deletingTag === tag}
                            className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            title="Шошго устгах"
                          >
                            {deletingTag === tag ? 'Устгаж байна...' : '×'}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Product Form */}
        {activeTab === 'products' && (
          <div className="mb-12">
          <h2 className="text-2xl font-serif text-gray-900 mb-6 tracking-tight uppercase">
            {editingProduct ? 'Бүтээгдэхүүн засах' : 'Шинэ бүтээгдэхүүн нэмэх'}
          </h2>
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8 space-y-8">

            <div>
              <label htmlFor="name" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Бүтээгдэхүүний нэр *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Тайлбар
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                {hasDiscount ? 'Хямдралтай үнэ *' : 'Үнэ *'}
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price || ''}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                placeholder={hasDiscount ? 'Жишээ: 299.99 (хямдралтай үнэ)' : 'Жишээ: 299.99'}
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="hasDiscount"
                  checked={hasDiscount}
                  onChange={(e) => {
                    setHasDiscount(e.target.checked);
                    if (!e.target.checked) {
                      setFormData({ ...formData, originalPrice: '' });
                    }
                  }}
                  className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-gray-500"
                />
                <label htmlFor="hasDiscount" className="text-xs font-light text-gray-600 tracking-widest uppercase cursor-pointer">
                  Хямдралтай үнэ нэмэх
                </label>
              </div>
              {hasDiscount && (
                <div>
                  <label htmlFor="originalPrice" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                    Анхны үнэ *
                  </label>
                  <input
                    type="number"
                    id="originalPrice"
                    name="originalPrice"
                    value={formData.originalPrice || ''}
                    onChange={handleChange}
                    required={hasDiscount}
                    step="0.01"
                    min="0"
                    placeholder="Жишээ: 399.99"
                    className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <p className="mt-2 text-xs text-gray-500 font-light">Анхны үнэ нь үнээс их байх ёстой. Доорх үнэ нь хямдралтай үнэ болно.</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Зураг * (Олон зураг нэмэх боломжтой)
              </label>
              
              {/* File Upload */}
              <div className="mb-4">
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadingImage
                      ? 'border-gray-400 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImage ? (
                      <>
                        <svg className="w-8 h-8 mb-2 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-xs text-gray-500 font-light">Зураг байршуулж байна...</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 font-light">
                          <span className="font-medium">Товшиж зураг сонгоно уу</span> эсвэл чирж тавина уу
                        </p>
                        <p className="text-xs text-gray-500 font-light">PNG, JPG, GIF эсвэл WEBP (Хамгийн ихдээ 5MB)</p>
                        <p className="text-xs text-gray-400 font-light mt-1">Олон зураг нэмэх боломжтой</p>
                      </>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    multiple
                  />
                </label>
              </div>

              {/* URL Input (Alternative) */}
              <div className="mb-4">
                <label htmlFor="image-url" className="block text-xs font-light text-gray-500 mb-2 tracking-widest uppercase">
                  Эсвэл зургийн URL нэмэх
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="image-url"
                    name="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = (e.target as HTMLInputElement).value.trim();
                        if (url) {
                          setImages(prev => [...prev, url]);
                          if (images.length === 0) {
                            setFormData(prev => ({ ...prev, image: url }));
                            setImagePreview(url);
                          }
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const input = document.getElementById('image-url') as HTMLInputElement;
                      const url = input.value.trim();
                      if (url) {
                        setImages(prev => [...prev, url]);
                        if (images.length === 0) {
                          setFormData(prev => ({ ...prev, image: url }));
                          setImagePreview(url);
                        }
                        input.value = '';
                      }
                    }}
                    className="px-4 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
                  >
                    Нэмэх
                  </button>
                </div>
              </div>

              {/* Multiple Images Preview */}
              {images.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                    Зургууд ({images.length}):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Зураг ${index + 1}`}
                          className="w-full h-32 object-cover border border-gray-300 rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-gray-900 text-white text-xs px-2 py-1 font-light">
                            Үндсэн
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = images.filter((_, i) => i !== index);
                            setImages(newImages);
                            if (index === 0 && newImages.length > 0) {
                              setFormData(prev => ({ ...prev, image: newImages[0] }));
                              setImagePreview(newImages[0]);
                            } else if (newImages.length === 0) {
                              setFormData(prev => ({ ...prev, image: '' }));
                              setImagePreview('');
                            }
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                          title="Зураг устгах"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy single image preview (for backward compatibility) */}
              {images.length === 0 && formData.image && (
                <div className="mt-4">
                  <p className="text-xs font-light text-gray-600 mb-2 tracking-widest uppercase">Урьдчилан харах:</p>
                  <div className="relative inline-block">
                    <img
                      src={formData.image}
                      alt="Урьдчилан харах"
                      className="max-w-full max-h-64 object-cover border border-gray-300 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {formData.image.startsWith('/uploads/') && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: '' });
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                        title="Зураг устгах"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Шошго
              </label>
              
              {/* Preset Mongolian Tags */}
              <div className="border border-gray-300 p-4 mb-3">
                <p className="text-xs font-medium text-gray-700 mb-3 tracking-widest uppercase">Сонгох шошго:</p>
                <div className="flex flex-wrap gap-2">
                  {presetMongolianTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleTag(tag);
                      }}
                      className={`px-4 py-2 text-xs font-light tracking-widest uppercase transition-all cursor-pointer ${
                        selectedTags.includes(tag)
                          ? 'bg-gray-900 text-white border border-gray-900'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Existing Tags from Database */}
              {availableTags.length > 0 && (
                <div className="border border-gray-300 p-4 mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-3 tracking-widest uppercase">Одоо байгаа шошго:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.filter(tag => !presetMongolianTags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleTag(tag);
                        }}
                        className={`px-4 py-2 text-xs font-light tracking-widest uppercase transition-all cursor-pointer ${
                          selectedTags.includes(tag)
                            ? 'bg-gray-900 text-white border border-gray-900'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add new tag input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addNewTag();
                    }
                  }}
                  placeholder="Шинэ шошго нэмэх..."
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    addNewTag();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
                >
                  Нэмэх
                </button>
              </div>

              {selectedTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-600 font-light mb-2">
                    <span className="font-medium">Сонгогдсон шошго ({selectedTags.length}):</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-light border border-gray-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleTag(tag);
                          }}
                          className="ml-2 text-gray-500 hover:text-gray-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="sizes" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Боломжтой хэмжээнүүд (таслалаар тусгаарлагдсан) *
              </label>
              <input
                type="text"
                id="sizes"
                name="sizes"
                value={formData.sizes || ''}
                onChange={handleChange}
                required
                placeholder="S, M, L, XL"
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500 font-light">Хэмжээнүүдийг таслалаар тусгаарлана (жишээ: S, M, L, XL)</p>
            </div>

            <div>
              <label className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Өнгө сонгох
              </label>
              
              {/* Preset Colors */}
            </div>

            <div>
              <label htmlFor="stock" className="block text-xs font-light text-gray-600 mb-3 tracking-widest uppercase">
                Барааны тоо ширхэг (Нөөц)
              </label>
              <input
                type="text"
                id="stock"
                name="stock"
                value={formData.stock || ''}
                onChange={handleChange}
                placeholder="Жишээ: S:10,M:5,L:8 эсвэл зөвхөн 10 (бүх хэмжээнд тэгш хуваагдана)"
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors"
              />
              <p className="mt-2 text-xs text-gray-500 font-light">
                Хэмжээ тус бүрд нөөц зааж өгөх: S:10,M:5,L:8 эсвэл зөвхөн тоо оруулаад бүх хэмжээнд тэгш хуваагдана
              </p>
              <p className="mt-2 text-xs text-gray-500 font-light">
                Барааны тоо ширхэгийг оруулна уу. Хоосон үлдээвэл нөөц хязгааргүй гэж тооцно.
              </p>
            </div>

            {message && (
              <div
                className={`p-4 border ${
                  message.includes('амжилттай') || message.includes('successfully')
                    ? 'bg-green-50 text-green-700 border-green-300'
                    : 'bg-red-50 text-red-700 border-red-300'
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="flex-1 py-4 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitLoading ? 'Хадгалж байна...' : editingProduct ? 'Бүтээгдэхүүн шинэчлэх' : 'Бүтээгдэхүүн нэмэх'}
              </button>
              {editingProduct && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-4 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-all duration-300"
                >
                  Цуцлах
                </button>
              )}
            </div>
          </form>
        </div>
        )}

        {/* Orders Management */}
        {activeTab === 'orders' && (
          <div className="mb-12">
            <h2 className="text-2xl font-serif text-gray-900 mb-6 tracking-tight uppercase">Захиалгууд</h2>
            
            {loadingOrders ? (
              <p className="text-gray-600 font-light">Захиалга ачааллаж байна...</p>
            ) : orders.length === 0 ? (
              <p className="text-gray-600 font-light">Одоогоор захиалга байхгүй байна.</p>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Product Info */}
                      <div>
                        <h3 className="text-lg font-light text-gray-900 mb-1 uppercase">{order.productName}</h3>
                        <p className="text-sm text-gray-600 font-light">Хэмжээ: {order.productSize}</p>
                        <p className="text-sm text-gray-600 font-light">Тоо ширхэг: {order.quantity || 1}</p>
                        <p className="text-lg font-light text-gray-900 mt-2">
                          ₮{((order.quantity || 1) * order.productPrice).toLocaleString()}
                          {order.quantity && order.quantity > 1 && (
                            <span className="text-sm text-gray-500 font-light ml-2">
                              ({order.quantity} × ₮{order.productPrice.toLocaleString()})
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-light text-gray-500 mb-1 tracking-widest uppercase">Харилцагч</p>
                          <p className="text-sm text-gray-900 font-light">{order.fullName}</p>
                          <p className="text-sm text-gray-600 font-light">{order.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-light text-gray-500 mb-1 tracking-widest uppercase">Хүргэх хаяг</p>
                          <p className="text-sm text-gray-600 font-light">
                            {order.address}, {order.district}, {order.city}
                          </p>
                          {order.notes && (
                            <p className="text-xs text-gray-500 font-light mt-1">Тэмдэглэл: {order.notes}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-light text-gray-500 mb-1 tracking-widest uppercase">Захиалгын огноо</p>
                          <p className="text-sm text-gray-900 font-light">
                            {new Date(order.orderDate).toLocaleDateString('mn-MN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Status Management */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-light text-gray-500 mb-2 tracking-widest uppercase">Статус</p>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-900 text-sm font-light focus:outline-none focus:border-gray-400 transition-colors"
                          >
                            <option value="pending">Хүлээгдэж байна</option>
                            <option value="processing">Бэлтгэж байна</option>
                            <option value="shipped">Хүргэлтэнд гарсан</option>
                            <option value="delivered">Хүргэгдсэн</option>
                          </select>
                        </div>
                        <div className={`inline-block px-3 py-1 text-xs font-light tracking-widest uppercase border ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          order.status === 'shipped' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                          'bg-green-100 text-green-700 border-green-300'
                        }`}>
                          {order.status === 'pending' ? 'Хүлээгдэж байна' :
                           order.status === 'processing' ? 'Бэлтгэж байна' :
                           order.status === 'shipped' ? 'Хүргэлтэнд гарсан' :
                           'Хүргэгдсэн'}
                        </div>
                        <button
                          onClick={() => setShowOrderDeleteConfirm(order.id)}
                          className="w-full px-4 py-2 bg-gray-200 text-gray-900 text-xs font-light tracking-widest uppercase hover:bg-gray-300 transition-colors mt-3"
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
        )}

        {/* Products List */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-2xl font-serif text-gray-900 mb-6 tracking-tight uppercase">Бүх бүтээгдэхүүн</h2>
            {loading ? (
              <p className="text-gray-600 font-light">Бүтээгдэхүүн ачааллаж байна...</p>
            ) : products.length === 0 ? (
              <p className="text-gray-600 font-light">Одоогоор бүтээгдэхүүн байхгүй. Дээр дурдсан хэсгээс анхны бүтээгдэхүүнээ нэмнэ үү.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 p-4">
                    <div className="aspect-square relative bg-gray-50 mb-4 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <h3 className="text-lg font-light text-gray-900 mb-2 uppercase">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">₮{product.price.toLocaleString()}</p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-4 py-2 bg-gray-900 text-white text-xs font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
                      >
                        Засах
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(product.id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white text-xs font-light tracking-widest uppercase hover:bg-red-700 transition-colors"
                      >
                        Устгах
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal for Products */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-serif text-gray-900 mb-4 uppercase">Устгахыг баталгаажуулах</h3>
            <p className="text-gray-600 mb-6 font-light">
              Та энэ бүтээгдэхүүнийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-6 py-3 bg-red-600 text-white text-sm font-light tracking-widest uppercase hover:bg-red-700 transition-colors"
              >
                Устгах
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
              >
                Цуцлах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Orders */}
      {showOrderDeleteConfirm && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <div className="bg-white p-8 max-w-md w-full mx-4 border border-gray-200">
            <h3 className="text-xl font-serif text-gray-900 mb-4 uppercase">Захиалга устгах</h3>
            <p className="text-gray-600 mb-6 font-light">
              Та энэ захиалгыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteOrder(showOrderDeleteConfirm)}
                className="flex-1 px-6 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
              >
                Устгах
              </button>
              <button
                onClick={() => setShowOrderDeleteConfirm(null)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
              >
                Цуцлах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
