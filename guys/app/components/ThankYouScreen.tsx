'use client';

import { useRouter } from 'next/navigation';

interface ThankYouScreenProps {
  orderId: string;
  productName: string;
  onClose: () => void;
}

export default function ThankYouScreen({ orderId, productName, onClose }: ThankYouScreenProps) {
  const router = useRouter();

  const handleViewOrders = () => {
    onClose();
    router.push('/orders');
  };

  const handleBackToShop = () => {
    onClose();
    router.push('/shop');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl p-6 md:p-8 lg:p-12 text-center">
        <div className="mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif text-gray-900 mb-3 md:mb-4 tracking-tight uppercase">Баярлалаа!</h2>
          <p className="text-lg md:text-xl text-gray-700 font-light mb-2">
            Таны захиалга амжилттай хүлээн авлаа
          </p>
          <p className="text-xs md:text-sm text-gray-600 font-light mb-4 md:mb-6">
            Захиалгын дугаар: <span className="font-medium">{orderId}</span>
          </p>
          <p className="text-sm md:text-base text-gray-700 font-light">
            Таны захиалга бэлтгэж, хүргэлтэнд гарна.
          </p>
        </div>

        <div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-gray-200">
          <button
            onClick={handleViewOrders}
            className="inline-block w-full px-6 md:px-8 py-3 md:py-4 bg-gray-900 text-white text-xs md:text-sm font-light tracking-widest uppercase hover:bg-gray-800 transition-colors"
          >
            Миний захиалгууд харах
          </button>
          <button
            onClick={handleBackToShop}
            className="inline-block w-full px-6 md:px-8 py-3 md:py-4 bg-gray-200 text-gray-900 text-xs md:text-sm font-light tracking-widest uppercase hover:bg-gray-300 transition-colors"
          >
            Дэлгүүр рүү буцах
          </button>
        </div>
      </div>
    </div>
  );
}
