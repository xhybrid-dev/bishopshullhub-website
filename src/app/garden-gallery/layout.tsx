import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Garden Gallery | Bishops Hull Hub',
  description:
    'See the community garden and sensory walk at Bishops Hull Hub — a green space for the village of Bishops Hull, Taunton.',
  alternates: { canonical: '/garden-gallery' },
  openGraph: {
    title: 'Garden Gallery | Bishops Hull Hub',
    description: 'The community garden and sensory walk at Bishops Hull Hub.',
    url: 'https://bhhub.co.uk/garden-gallery',
    type: 'website',
  },
};

export default function GardenGalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
