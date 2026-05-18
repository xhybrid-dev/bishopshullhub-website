import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, CalendarDays, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page Not Found | Bishops Hull Hub',
  description: 'The page you are looking for can\'t be found. Head back to the Bishops Hull Hub homepage to find what you need.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 md:py-28 max-w-2xl text-center">
      <p className="font-marker text-2xl text-accent mb-3">Oops</p>
      <h1 className="text-6xl md:text-7xl font-headline font-bold text-primary mb-5">404</h1>
      <p className="text-xl md:text-2xl mb-3">We can&apos;t find that page.</p>
      <p className="text-muted-foreground mb-10 max-w-md mx-auto">
        It may have moved, or the link might be out of date. Try one of these instead:
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="h-4 w-4 mr-2" /> Back to home
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/whats-on">
            <CalendarDays className="h-4 w-4 mr-2" /> What&apos;s on
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/find-us">
            <MapPin className="h-4 w-4 mr-2" /> Find us
          </Link>
        </Button>
      </div>
    </div>
  );
}
