import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { BottomNav } from '@/components/BottomNav';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { TitleLanguageProvider } from '@/context/TitleLanguageContext';
import { TrackingProvider } from '@/context/TrackingContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SettingsProvider } from '@/context/SettingsContext';

// Runs before paint to set theme + minimal-mode classes, preventing a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('annie_theme');if(t==='light'){document.documentElement.classList.add('light');}var s=localStorage.getItem('annie_settings');if(s&&JSON.parse(s).minimal){document.documentElement.classList.add('minimal');}}catch(e){}})();`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} bg-bg text-fg antialiased`}>
        <ThemeProvider>
        <SettingsProvider>
        <TitleLanguageProvider>
        <TrackingProvider>
          <Navbar />
          {children}
          {/* Spacer so fixed bottom nav never covers page content on mobile */}
          <div className="h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] sm:hidden" aria-hidden />
          <BottomNav />
          <ServiceWorkerRegister />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: 'border-line/10 bg-surface text-fg',
            }}
          />
        </TrackingProvider>
        </TitleLanguageProvider>
        </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
