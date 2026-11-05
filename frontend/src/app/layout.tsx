import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'BrewLite | Coffee, made simple',
  description: 'Cashless coffee ordering for BrewLite',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/brewlite.svg' },
};

export const viewport: Viewport = {
  themeColor: '#34241c',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col bg-crema text-espresso">
        <Providers>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
