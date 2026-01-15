'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductSlider from './components/ProductSlider';
import LoadingScreen from './components/LoadingScreen';

export default function Home() {
  const router = useRouter();
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  const [productsImagesLoaded, setProductsImagesLoaded] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminInput, setAdminInput] = useState('');

  useEffect(() => {
    // Handle admin access - when user types "evt" (without focusing on inputs), redirect to admin
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      setAdminInput(prev => {
        const newInput = (prev + e.key.toLowerCase()).slice(-3); // Keep only last 3 characters
        if (newInput === 'evt') {
          router.push('/admin');
          return '';
        }
        return newInput;
      });
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [router]);

  useEffect(() => {
    // Trigger content animation after a short delay
    const timer = setTimeout(() => {
      setContentVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Preload hero image immediately
    const img = new Image();
    img.src = 'https://scontent.fuln8-1.fna.fbcdn.net/v/t39.30808-6/603888760_122101189869182833_2824381264987330544_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=cd3k8wE3RgYQ7kNvwEaOeaG&_nc_oc=AdkgMszNW6CG4Xa79YMXPz51YLZhN5oZ96GcXH5i12m7BlBwtb5zY9iPFQ22SXAVyvw&_nc_zt=23&_nc_ht=scontent.fuln8-1.fna&_nc_gid=DOq4_M8lUtGAsBplR6wTpg&oh=00_AfpMC889XfSit-GWgGjDRvuWKHnm1VD2IKmyhtREvB_Zmw&oe=696DC81B';
    img.onload = () => setHeroImageLoaded(true);
    img.onerror = () => {
      // If image fails, still proceed after delay
      setTimeout(() => setHeroImageLoaded(true), 1000);
    };
  }, []);

  useEffect(() => {
    // Maximum loading time of 2 seconds
    const maxLoadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Hide loading screen when hero image is loaded (don't wait for all product images)
    if (heroImageLoaded) {
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        setIsLoading(false);
        clearTimeout(maxLoadingTimer);
      }, 300);
      return () => {
        clearTimeout(timer);
        clearTimeout(maxLoadingTimer);
      };
    }

    return () => clearTimeout(maxLoadingTimer);
  }, [heroImageLoaded]);

  return (
    <>
      <LoadingScreen isLoading={isLoading} />
      <div className={`min-h-screen flex flex-col bg-white transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center text-white overflow-hidden">
        {/* Background Image with Loading */}
        <div className="absolute inset-0">
          {!heroImageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ${
              heroImageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: 'url(https://scontent.fuln8-1.fna.fbcdn.net/v/t39.30808-6/603888760_122101189869182833_2824381264987330544_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=cd3k8wE3RgYQ7kNvwEaOeaG&_nc_oc=AdkgMszNW6CG4Xa79YMXPz51YLZhN5oZ96GcXH5i12m7BlBwtb5zY9iPFQ22SXAVyvw&_nc_zt=23&_nc_ht=scontent.fuln8-1.fna&_nc_gid=DOq4_M8lUtGAsBplR6wTpg&oh=00_AfpMC889XfSit-GWgGjDRvuWKHnm1VD2IKmyhtREvB_Zmw&oe=696DC81B)',
            }}
          />
          <img
            src="https://scontent.fuln8-1.fna.fbcdn.net/v/t39.30808-6/603888760_122101189869182833_2824381264987330544_n.jpg?stp=cp6_dst-jpg_tt6&_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=cd3k8wE3RgYQ7kNvwEaOeaG&_nc_oc=AdkgMszNW6CG4Xa79YMXPz51YLZhN5oZ96GcXH5i12m7BlBwtb5zY9iPFQ22SXAVyvw&_nc_zt=23&_nc_ht=scontent.fuln8-1.fna&_nc_gid=DOq4_M8lUtGAsBplR6wTpg&oh=00_AfpMC889XfSit-GWgGjDRvuWKHnm1VD2IKmyhtREvB_Zmw&oe=696DC81B"
            alt=""
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
            onLoad={() => setHeroImageLoaded(true)}
            onError={() => {
              // If image fails to load, still hide loading after a delay
              setTimeout(() => setHeroImageLoaded(true), 1000);
            }}
          />
        </div>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/55" />
        
        {/* Hero Content with Animations */}
        <div className="relative z-10 text-center px-6 max-w-5xl">
          {/* Small decorative line above title */}
          <div
            className={`mx-auto mb-6 h-px w-24 bg-white/60 transition-all duration-1000 delay-100 ${
              contentVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`}
          />
          
          <h1
            className={`mb-6 text-white transition-all duration-1000`}
            style={{ 
              fontFamily: 'var(--font-tinos), serif',
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              fontWeight: 400,
              letterSpacing: '0.03em',
              lineHeight: '1.1',
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4)',
              ...(contentVisible
                ? { opacity: 1, transform: 'translateY(0)' }
                : { opacity: 0, transform: 'translateY(1.5rem)' })
            }}
          >
            GUYS SHOP
          </h1>
          
          {/* Decorative line below title */}
          <div
            className={`mx-auto mb-8 h-px w-16 bg-white/50 transition-all duration-1000 delay-150 ${
              contentVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
            }`}
          />
          
          <p
            className={`mb-16 text-white/95 transition-all duration-1000 delay-200`}
            style={{ 
              fontFamily: 'var(--font-tinos), serif',
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              fontWeight: 400,
              letterSpacing: '0.08em',
              lineHeight: '1.6',
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.3)',
              maxWidth: '42rem',
              marginLeft: 'auto',
              marginRight: 'auto',
              ...(contentVisible
                ? { opacity: 1, transform: 'translateY(0)' }
                : { opacity: 0, transform: 'translateY(1.5rem)' })
            }}
          >
            Бараг бүх төрлийн хувцаснууд зардаг эвтэд байдаг гайхалтай дэлгүүр хха.
          </p>
          
          <div
            className={`transition-all duration-1000 delay-300 ${
              contentVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-1.5rem'
            }`}
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 px-12 py-5 bg-white/100 text-gray-900 tracking-[0.2em] uppercase hover:bg-white/80 transition-all duration-500 hover:scale-[1.02] shadow-xl backdrop-blur-sm"
              style={{ 
                fontFamily: 'var(--font-tinos), serif',
                fontSize: '1.125rem',
                fontWeight: 400,
                letterSpacing: '0.2em',
              }}
            >
              <span>Бүтээгдэхүүн үзэх</span>
              <svg 
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 lg:px-12 py-12 md:py-16 lg:py-20 w-full">
        <ProductSlider limit={5} onImagesLoaded={() => setProductsImagesLoaded(true)} />
      </main>
    </div>
    </>
  );
}
