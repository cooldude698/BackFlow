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
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-black">
      <body className="bg-black text-slate-100 antialiased selection:bg-periwinkle selection:text-black">
        <MobileFrame>{children}</MobileFrame>
      </body>
    </html>
  );
}
