'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 md:py-28 max-w-2xl text-center">
      <p className="font-marker text-2xl text-accent mb-3">Hmm</p>
      <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-5">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mb-10 max-w-md mx-auto">
        An unexpected error occurred while loading this page. Please try again, or head back home and have another go.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" onClick={reset}>
          <RefreshCw className="h-4 w-4 mr-2" /> Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">
            <Home className="h-4 w-4 mr-2" /> Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
