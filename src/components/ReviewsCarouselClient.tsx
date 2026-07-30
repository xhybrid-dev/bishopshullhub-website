"use client";

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Star } from 'lucide-react';
import type { GoogleReview } from '@/app/actions/get-reviews';
import Image from 'next/image';

interface Props {
  reviews: GoogleReview[];
  averageRating: number;
  totalRatings: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsCarouselClient({ reviews, averageRating, totalRatings }: Props) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  if (!reviews.length) return null;

  return (
    <section className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-8">
        {/* Section header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-200">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Google Reviews
          </div>
          <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary">
            What Our Community Says
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted'}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">· {totalRatings} reviews on Google</span>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 md:gap-6">
            {reviews.map((review, idx) => (
              <div
                key={idx}
                className="flex-none w-[85vw] sm:w-[400px] md:w-[380px]"
              >
                <div className="h-full bg-white border border-border rounded-[1.5rem] p-6 space-y-4 shadow-md hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 ease-out">
                  {/* Stars */}
                  <StarRating rating={review.rating} />

                  {/* Review text */}
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed italic line-clamp-5">
                    &ldquo;{review.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-muted">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden bg-primary/10 shrink-0">
                      {review.authorPhoto ? (
                        <Image
                          src={review.authorPhoto}
                          alt={review.authorName}
                          fill
                          sizes="36px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-primary font-bold text-sm">
                          {review.authorName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.authorName}</p>
                      <p className="text-xs text-muted-foreground">{review.relativeTime}</p>
                    </div>
                    {/* Google G logo */}
                    <div className="ml-auto">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-label="Google">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View all link */}
        <div className="text-center">
          <a
            href="https://maps.app.goo.gl/MTNHaRDkTX7a36xh7"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View all reviews on Google
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
