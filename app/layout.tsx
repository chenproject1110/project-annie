import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'PROJECT ANNIE - Anime Discovery',
  description: 'Discover anime from Winter 2013 to upcoming seasons. Powered by MyAnimeList via Jikan.',
  keywords: ['anime', 'discovery', 'myanimelist', 'jikan', 'seasons'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
