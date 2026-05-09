import type {Metadata} from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileFAB from '@/components/MobileFAB';
import HireChatbot from '@/components/HireChatbot';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Bishops Hull Hub | Community Hub & Village Hall',
  description: 'The heart of our village community. Hire the hub for events, check what\'s on, and get involved with community projects in Bishops Hull, Taunton.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Bishops Hull Hub | Community Hub & Village Hall',
    description: 'The heart of our village community. Hire the hub for events, check what\'s on, and get involved.',
    url: 'https://bhhub.co.uk',
    siteName: 'Bishops Hull Hub',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bishops Hull Hub',
    description: 'The heart of our village community.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Permanent+Marker&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background text-foreground flex flex-col min-h-screen antialiased">
        <FirebaseClientProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <MobileFAB />
          <HireChatbot />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
