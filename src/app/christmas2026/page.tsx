import type { Metadata } from 'next';
import SantaGrotto from '@/components/christmas/SantaGrotto';

export const metadata: Metadata = {
  title: 'Santa’s Grotto 2026 | Bishops Hull Hub',
  description:
    'Meet Santa at the Bishops Hull Hub Santa Grotto on Saturday 12th December, 10am–12pm. Book your child’s magical visit!',
  alternates: { canonical: '/christmas2026' },
  openGraph: {
    title: 'Santa’s Grotto at Bishops Hull Hub',
    description: 'Saturday 12th December 2026, 10am–12pm. Book your child’s visit to Santa.',
    url: 'https://bhhub.co.uk/christmas2026',
    type: 'website',
    images: [{ url: '/images/hub-christmas.webp', width: 2000, height: 1116, alt: 'Bishops Hull Hub in the snow' }],
  },
};

export default function Christmas2026Page() {
  return <SantaGrotto />;
}
