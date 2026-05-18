import type {Metadata} from 'next';
import { Inter, Permanent_Marker } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileFAB from '@/components/MobileFAB';
import HireChatbot from '@/components/HireChatbot';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

const permanentMarker = Permanent_Marker({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-permanent-marker',
  weight: '400',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bhhub.co.uk'),
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

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['CommunityCenter', 'EventVenue'],
  name: 'Bishops Hull Hub',
  url: 'https://bhhub.co.uk',
  email: 'bhhubbookings@gmail.com',
  description:
    'Community hub and village hall available for hire — parties, classes, meetings and events in Bishops Hull, Taunton. Modern facilities including kitchen, AV, parking and accessible access.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bishops Hull Hill',
    addressLocality: 'Taunton',
    addressRegion: 'Somerset',
    postalCode: 'TA1 5EB',
    addressCountry: 'GB',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 51.0160639,
    longitude: -3.1349833,
  },
  areaServed: ['Bishops Hull', 'Taunton', 'Somerset'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${permanentMarker.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
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
