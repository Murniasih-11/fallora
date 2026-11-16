import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'FALLORA · Sistem Deteksi Jatuh Real-Time',
  description:
    'Sistem pemantauan keselamatan dan deteksi jatuh berbasis Computer Vision untuk lansia.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  keywords: [
    'deteksi jatuh',
    'computer vision',
    'pemantauan lansia',
    'fall detection',
    'fallora',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${manrope.variable}`}>
      <body className="antialiased font-sans font-heading bg-[#F7F8F5] text-[#0F2421]">
        {children}
      </body>
    </html>
  );
}
