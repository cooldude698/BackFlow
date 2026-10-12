import type { Metadata, Viewport } from 'next';
import './globals.css';
import MobileFrame from '../components/MobileFrame';
import { LoginStepProvider } from '../context/LoginStepContext';
import { ThemeProvider } from '../context/ThemeContext';

export const metadata: Metadata = {
  title: 'BackFlow App | Mobile Revenue Sharing Rail',
  description: 'Raise upfront capital and automate pro-rata revenue sharing natively on phone.',
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFC800',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-[#FFC800] selection:text-black transition-colors duration-200">
        <ThemeProvider>
          <LoginStepProvider>
            <MobileFrame>{children}</MobileFrame>
          </LoginStepProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
