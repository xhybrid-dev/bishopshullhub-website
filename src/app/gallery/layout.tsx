import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery | Bishops Hull Hub',
  description:
    'Photos of Bishops Hull Hub through the seasons — events, community gatherings and the village hall in Bishops Hull, Taunton.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Gallery | Bishops Hull Hub',
    description: 'Photos of Bishops Hull Hub through the seasons.',
    url: 'https://bhhub.co.uk/gallery',
    type: 'website',
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
