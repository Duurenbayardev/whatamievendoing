import type { Metadata } from "next";
import { PT_Serif, Tinos } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { CartProvider } from "./contexts/CartContext";

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

const tinos = Tinos({
  variable: "--font-tinos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Guys Shop - Чанартай хувцаслагч",
  description: "Guys Shop-д тавтай морилно уу - Чанартай хувцаслагч, хэв маягийн бүтээгдэхүүн",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ptSerif.variable} ${tinos.variable} antialiased flex flex-col min-h-screen`}
        style={{ fontFamily: 'var(--font-pt-serif), serif' }}
      >
        <CartProvider>
          <Header />
          <div className="flex flex-1">
            <div className="flex-1 w-full">
              {children}
            </div>
          </div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
