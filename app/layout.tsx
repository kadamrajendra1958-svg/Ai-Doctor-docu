import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'AI Doctor Documentation',
  description: 'Premium medical documentation application.',
  openGraph: {
    title: 'AI Doctor Documentation',
    description: 'Premium medical documentation application.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Doctor Documentation',
    description: 'Premium medical documentation application.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.className}>
      <body suppressHydrationWarning className="bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
