import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { TitleLanguageProvider } from '@/context/TitleLanguageContext';
import { TrackingProvider } from '@/context/TrackingContext';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  title: 'PROJECT ANNIE - Anime Discovery',
  description:
    'Discover anime from Winter 2013 to upcoming seasons. Powered by AniList.',
  keywords: ['anime', 'discovery', 'anilist', 'seasons'],
  applicationName: 'ANNIE',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ANNIE',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        <TitleLanguageProvider>
        <TrackingProvider>
          <Navbar />
          {children}
          {/* Spacer so fixed bottom nav never covers page content on mobile */}
          <div className="h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] sm:hidden" aria-hidden />
          <BottomNav />
          <ServiceWorkerRegister />
          <Toaster
            theme="dark"
            position="bottom-center"
            toastOptions={{
              className: 'border-white/10 bg-white/[0.06] backdrop-blur-md text-white',
            }}
          />
        </TrackingProvider>
        </TitleLanguageProvider>
      </body>
    </html>
  );
}
