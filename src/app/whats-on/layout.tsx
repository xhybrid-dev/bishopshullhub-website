import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "What's On | Bishops Hull Hub",
  description:
    "See what's happening this week at Bishops Hull Hub — classes, clubs, community events and one-off bookings at our village hall in Bishops Hull, Taunton.",
  alternates: { canonical: '/whats-on' },
  openGraph: {
    title: "What's On at Bishops Hull Hub",
    description:
      "This week's classes, clubs and community events at our village hall in Bishops Hull, Taunton.",
    url: 'https://bhhub.co.uk/whats-on',
    type: 'website',
  },
};

export default function WhatsOnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
