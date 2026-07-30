"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useScroll, useTransform, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  heroImageUrl: string;
}

export default function HeroSection({ heroImageUrl }: HeroSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  // Parallax/overlay effects only apply on desktop — mobile uses a stacked layout.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fall back to the static image if the video errors out or the user prefers reduced motion.
  const [videoFailed, setVideoFailed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const showVideo = !videoFailed && !prefersReducedMotion;

  // Parallax: image moves up at ~40% of scroll speed
  const imageY = useTransform(scrollY, [0, 600], ['0%', '25%']);

  // Overlay darkens as user scrolls
  const overlayOpacity = useTransform(scrollY, [0, 350], [0.4, 0.75]);

  // Frosted glass blur increases on scroll
  const blurAmount = useTransform(scrollY, [0, 350], [0, 10]);
  const blurFilter = useTransform(blurAmount, (v) => `blur(${v}px)`);


  return (
    <section
      ref={ref}
      className="relative flex flex-col md:items-center md:justify-center md:h-[680px] md:overflow-hidden"
    >
      {/* Video — full-width banner on mobile, parallax background on desktop */}
      <motion.div
        className="relative w-full md:absolute md:inset-0 md:z-0 md:scale-110"
        style={{ y: isDesktop ? imageY : 0 }}
      >
        {showVideo ? (
          <video
            src="/hub-sunrise.mp4"
            poster={heroImageUrl}
            muted
            playsInline
            autoPlay
            loop
            // "auto" tells the browser to pull all 4 MB up front, competing with
            // the render-critical assets. "metadata" lets it stream as it plays;
            // the poster covers the frame in the meantime either way.
            preload="metadata"
            disablePictureInPicture
            disableRemotePlayback
            onError={() => setVideoFailed(true)}
            aria-label="Bishops Hull Hub Exterior"
            className="block w-full h-auto md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
            style={{ transform: 'translateZ(0)' }}
          />
        ) : (
          <Image
            src={heroImageUrl}
            alt="Bishops Hull Hub Exterior"
            width={1920}
            height={1080}
            priority
            className="block w-full h-auto md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
            data-ai-hint="modern building community hall"
          />
        )}
      </motion.div>

      {/* Darkening overlay with frosted glass effect — desktop only */}
      <motion.div
        className="hidden md:block absolute inset-0 z-10"
        style={{
          opacity: overlayOpacity,
          backdropFilter: blurFilter,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(10,60,55,0.85) 100%)',
        }}
      />

      {/* Hero content — in flow below the video on mobile, overlaid on desktop */}
      <div className="relative z-20 w-full bg-primary md:bg-transparent md:absolute md:inset-0 md:flex md:items-center md:justify-center md:w-auto">
        <div className="container text-center text-white px-4 py-10 pb-20 md:py-0 md:pb-0 space-y-5 md:space-y-7">
          <motion.h1
            className="text-4xl md:text-6xl font-headline font-bold tracking-tight md:drop-shadow-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            Welcome to the{' '}
            <span className="text-accent">Bishops Hull Hub</span>
          </motion.h1>

          <motion.p
            className="font-marker text-2xl md:text-3xl max-w-2xl mx-auto md:drop-shadow-md text-white/90"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            The heart of our village community.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center pt-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          >
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 md:bg-primary md:text-primary-foreground md:hover:bg-primary/90 text-base md:text-lg px-8 h-12 md:h-14 shadow-lg"
            >
              <Link href="/whats-on">View Schedule</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/40 hover:bg-white/25 text-white text-base md:text-lg px-8 h-12 md:h-14"
            >
              <Link href="/hire">Make a Booking</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator — desktop only */}
      <motion.div
        className="hidden md:block absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-white/70"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
      >
        <ChevronDown className="h-7 w-7" />
      </motion.div>
    </section>
  );
}
