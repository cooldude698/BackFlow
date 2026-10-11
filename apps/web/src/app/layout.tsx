import type { Metadata, Viewport } from 'next';
import './globals.css';
import MobileFrame from '../components/MobileFrame';

export const metadata: Metadata = {
  title: 'BackFlow App | Mobile Revenue Sharing Rail',
  description: 'Raise upfront capital and automate pro-rata revenue sharing natively on phone.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f4f5fa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#f1f3f9]">
      <body className="bg-[#f1f3f9] text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <MobileFrame>{children}</MobileFrame>
      </body>
    </html>
  );
}
