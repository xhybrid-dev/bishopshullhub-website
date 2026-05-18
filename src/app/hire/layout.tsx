import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hire the Hub | Bishops Hull Hub',
  description:
    'Hire Bishops Hull Hub for parties, classes, meetings and community events. Modern village hall in Bishops Hull, Taunton — kitchen, AV, free parking and accessible facilities.',
  alternates: { canonical: '/hire' },
  openGraph: {
    title: 'Hire the Hub | Bishops Hull Hub',
    description:
      'Hire our modern village hall in Bishops Hull, Taunton for parties, classes, meetings and community events.',
    url: 'https://bhhub.co.uk/hire',
    type: 'website',
  },
};

export default function HireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
