import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo.png"
                alt="GUYS SHOP"
                width={140}
                height={45}
                className="h-11 w-auto object-contain"
              />
            </Link>
            <p className="text-gray-600 text-sm font-light leading-relaxed">
              Цаг хугацааг давамгайлах гоо сайхан. Гайхамшигтай чанар. Уламжлалт хэв маяг.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-light text-gray-900 mb-6 tracking-widest uppercase">Холбоосууд</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">
                  Нүүр хуудас
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">
                  Дэлгүүр
                </Link>
              </li>
              <li>
                <Link href="/shop?category=mens" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">
                  Эрэгтэй
                </Link>
              </li>
              <li>
                <Link href="/shop?category=womens" className="text-sm text-gray-600 hover:text-gray-900 font-light transition-colors">
                  Эмэгтэй
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-light text-gray-900 mb-6 tracking-widest uppercase">Холбоо барих</h4>
            <p className="text-sm text-gray-600 font-light mb-2">Утас: 99112233</p>
            <p className="text-sm text-gray-600 font-light mb-2">Имэйл: guysshop@gmail.com</p>
            <p className="text-sm text-gray-600 font-light">Facebook: @guysshop</p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500 font-light tracking-wider">
            © {new Date().getFullYear()} GUYS SHOP. БҮХ ЭРХ ХУУЛИАР ХАМГААЛАГДСАН.
          </p>
        </div>
      </div>
    </footer>
  );
}
