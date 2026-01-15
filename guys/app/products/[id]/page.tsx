'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sizeError, setSizeError] = useState<string>('');
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    // Check if product is in wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsWishlisted(wishlist.includes(product?.id));
  }, [product]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isWishlisted) {
      const updated = wishlist.filter((id: string) => id !== product.id);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      setIsWishlisted(false);
    } else {
      wishlist.push(product.id);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      setIsWishlisted(true);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize) {
      setSizeError('Хэмжээ сонгоно уу');
      setTimeout(() => setSizeError(''), 3000);
      return;
    }

    // Check stock for selected size
    if (product.stock) {
      if (typeof product.stock === 'object') {
        // Size-specific stock
        const stockForSize = product.stock[selectedSize] || 0;
        if (stockForSize <= 0) {
          setSizeError(`${selectedSize} хэмжээ дууссан байна`);
          setTimeout(() => setSizeError(''), 3000);
          return;
        }
        if (quantity > stockForSize) {
          setSizeError(`${selectedSize} хэмжээнд зөвхөн ${stockForSize} ширхэг үлдсэн байна`);
          setTimeout(() => setSizeError(''), 3000);
          return;
        }
      } else if (typeof product.stock === 'number') {
        // Legacy format - single stock number
        if (product.stock <= 0) {
          setSizeError('Бүтээгдэхүүн дууссан байна');
          setTimeout(() => setSizeError(''), 3000);
          return;
        }
        if (quantity > product.stock) {
          setSizeError(`Зөвхөн ${product.stock} ширхэг үлдсэн байна`);
          setTimeout(() => setSizeError(''), 3000);
          return;
        }
      }
    }

    setSizeError('');

    addToCart({
      productId: product.id,
      productName: product.name,
      productImage: product.images && product.images.length > 0 ? product.images[0] : product.image,
      price: product.price,
      size: selectedSize,
      quantity: quantity,
    });

    setAddToCartSuccess(true);
    setTimeout(() => setAddToCartSuccess(false), 3000);
  };

  const getImages = () => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images;
    }
    return [product.image];
  };

  const images = getImages();
  
  // Calculate stock status for selected size
  const getStockForSize = (size: string) => {
    if (!product?.stock) return null;
    if (typeof product.stock === 'object') {
      return product.stock[size] || 0;
    } else if (typeof product.stock === 'number') {
      return product.stock;
    }
    return null;
  };
  
  const stockForSelectedSize = selectedSize ? getStockForSize(selectedSize) : null;
  const isInStock = stockForSelectedSize === null || stockForSelectedSize > 0;

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

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 mb-6 font-light">Бүтээгдэхүүн олдсонгүй</p>
          <button
            onClick={() => router.push('/shop')}
            className="px-8 py-3 bg-gray-900 text-white text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
          >
            Дэлгүүр рүү буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-4 md:py-6">
          <button
            onClick={() => router.push('/shop')}
            className="text-gray-600 hover:text-gray-900 font-light text-sm tracking-wider uppercase transition-colors"
          >
            ← Бүтээгдэхүүн рүү буцах
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white border border-gray-200 overflow-hidden aspect-square relative">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
              <Image
                src={images[selectedImageIndex]}
                alt={product.name}
                fill
                className={`object-cover transition-opacity duration-500 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                sizes="(max-width: 1024px) 100vw, 50vw"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setImageLoaded(false);
                    }}
                    className={`aspect-square relative border-2 overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? 'border-gray-900'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 25vw, 12.5vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-serif text-gray-900 tracking-tight uppercase flex-1">{product.name}</h1>
                <button
                  onClick={toggleWishlist}
                  className={`ml-4 p-2 transition-colors ${
                    isWishlisted
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label={isWishlisted ? 'Хүслийн жагсаалтаас хасах' : 'Хүслийн жагсаалтад нэмэх'}
                >
                  <svg
                    className="w-6 h-6"
                    fill={isWishlisted ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
                {product.originalPrice && product.originalPrice > product.price ? (
                  <>
                    <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 tracking-wider">₮{product.price.toLocaleString()}</p>
                    <p className="text-base md:text-lg lg:text-xl font-light text-gray-400 line-through tracking-wider">₮{product.originalPrice.toLocaleString()}</p>
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-red-100 text-red-700 text-[10px] md:text-xs font-light tracking-widest uppercase">
                      Хямдрал
                    </span>
                  </>
                ) : (
                  <p className="text-xl md:text-2xl lg:text-3xl font-light text-gray-900 tracking-wider">₮{product.price.toLocaleString()}</p>
                )}
              </div>

              {/* Stock Status */}
              {stockForSelectedSize !== null && selectedSize && (
                <div className="mb-4">
                  {isInStock ? (
                    <p className="text-sm font-light text-green-600">
                      {selectedSize} хэмжээ: Боломжтой ({stockForSelectedSize} ширхэг үлдсэн)
                    </p>
                  ) : (
                    <p className="text-sm font-light text-red-600">{selectedSize} хэмжээ: Дууссан</p>
                  )}
                </div>
              )}
            </div>

            {product.description && (
              <div>
                <h2 className="text-sm font-light text-gray-600 mb-3 tracking-widest uppercase">Тайлбар</h2>
                <p className="text-gray-700 font-light leading-relaxed">{product.description}</p>
              </div>
            )}

            <div>
              <h2 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Хэмжээ</h2>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError('');
                    }}
                    className={`px-4 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 text-xs md:text-sm font-light tracking-widest uppercase transition-all duration-300 ${
                      selectedSize === size
                        ? 'bg-gray-900 text-white'
                        : 'bg-transparent text-gray-900 border border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {sizeError && (
                <p className="mt-2 text-xs text-red-600 font-light">{sizeError}</p>
              )}
            </div>

            {product.tags.length > 0 && (
              <div>
                <h2 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Шошго</h2>
                <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                  <div className="flex gap-3 min-w-max md:flex-wrap md:min-w-0">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-4 py-2 bg-transparent text-gray-600 border border-gray-300 text-xs font-light tracking-widest uppercase whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h2 className="text-sm font-light text-gray-600 mb-4 tracking-widest uppercase">Тоо ширхэг</h2>
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex items-center gap-2 md:gap-3 border border-gray-300">
                  <button
                    onClick={() => {
                      if (quantity > 1) {
                        setQuantity(quantity - 1);
                      }
                    }}
                    disabled={quantity <= 1}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={stockForSelectedSize !== null ? stockForSelectedSize : undefined}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxQty = stockForSelectedSize !== null ? stockForSelectedSize : 999;
                      setQuantity(Math.max(1, Math.min(val, maxQty)));
                    }}
                    className="w-12 md:w-16 text-center text-gray-900 font-light text-base md:text-lg border-0 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={() => {
                      const maxQty = stockForSelectedSize !== null ? stockForSelectedSize : 999;
                      if (quantity < maxQty) {
                        setQuantity(quantity + 1);
                      }
                    }}
                    disabled={stockForSelectedSize !== null && quantity >= stockForSelectedSize}
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                {stockForSelectedSize !== null && (
                  <p className="text-xs md:text-sm text-gray-600 font-light">
                    (Хамгийн ихдээ {stockForSelectedSize} ширхэг)
                  </p>
                )}
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-4">
              {addToCartSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded">
                  <p className="text-sm font-light">Сагсанд нэмэгдлээ!</p>
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className="w-full py-3 md:py-4 bg-gray-900 text-white text-xs md:text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInStock ? 'Сагсанд нэмэх' : 'Дууссан'}
              </button>
              <button
                onClick={() => router.push('/cart')}
                className="w-full py-3 md:py-4 bg-transparent text-gray-900 border-2 border-gray-900 text-xs md:text-sm font-light tracking-widest uppercase hover:bg-gray-50 transition-all duration-300"
              >
                Сагс руу очих
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
