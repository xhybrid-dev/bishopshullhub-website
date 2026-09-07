"use client";

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Expand, Pause, Plane, Play } from 'lucide-react';

/**
 * Source clip is encoded at two sizes so phones never pull the desktop file.
 * Both are H.264/yuv420p with the moov atom up front (+faststart) so playback
 * can begin on the first few hundred KB rather than after a full download.
 */
const SOURCES = {
  desktop: '/hub-drone-tour.mp4', // 1600x900, ~4.5 MB
  mobile: '/hub-drone-tour-mobile.mp4', // 960x540, ~2.0 MB
} as const;

const POSTER = '/hub-drone-tour-poster.webp'; // ~85 KB, first frame of the clip

// 32x18 WebP of the same frame, inlined so the frame is never empty and the
// placeholder costs zero requests. Swapped for the real poster once in range.
const LQIP =
  'data:image/webp;base64,UklGRqYAAABXRUJQVlA4IJoAAADwBACdASogABIAPuVgpU2pJaOiMAwBIByJQBYdhEBVZBmsoKqHmpOSSnIU/0t9nggA/fB5zZjY+JA/9vord+Eguseiy7EEQ+Bjb0EsQdkAzKHJJ7UojIm+zDixk0dzHIOgTrrK/D8HJGldFaK3VxB8GSbgLkO3PRdP1gKhg1sdO4zOYnz96ugDpFt0aKJQipcTxymcrSrJbGAA';

/** True when the visitor has asked us not to burn their data allowance. */
function prefersLightData() {
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (!conn) return false;
  return (
    conn.saveData === true ||
    conn.effectiveType === 'slow-2g' ||
    conn.effectiveType === '2g'
  );
}

export default function DroneTourSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Nothing is requested — not even the poster — until the section is close to
  // the viewport. `src` stays null so the browser has no resource to fetch.
  const [src, setSrc] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Reduced motion / Save-Data visitors get the still frame and an explicit
  // play button instead of an autoplaying loop.
  const [manualOnly, setManualOnly] = useState(false);

  useEffect(() => {
    setManualOnly(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        prefersLightData()
    );
  }, []);

  // Pass 1 — warm up. Fires a screenful early so the clip is decoded and ready
  // by the time it is actually on screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || src) return;

    const load = () => {
      setSrc(
        window.matchMedia('(min-width: 768px)').matches
          ? SOURCES.desktop
          : SOURCES.mobile
      );
    };

    if (!('IntersectionObserver' in window)) {
      load();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          load();
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  // Pass 2 — playback. Tracks real visibility (no rootMargin) so the clip only
  // runs while it is being watched, and stops decoding when it is not.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Setting src on a media element restarts resource selection; load() makes
  // that explicit rather than relying on the browser noticing the change.
  useEffect(() => {
    if (src) videoRef.current?.load();
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src || manualOnly) return;

    if (inView) {
      video.play().catch(() => {
        // Autoplay can still be refused (low power mode, browser policy) —
        // fall back to the poster and let the button take over.
        setPlaying(false);
      });
    } else {
      video.pause();
    }
  }, [inView, src, manualOnly]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setManualOnly(false);
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === videoRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const goFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  return (
    <section className="container mx-auto px-4">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-border bg-primary"
      >
        <div
          className="relative aspect-[4/3] sm:aspect-video bg-cover bg-center"
          style={{ backgroundImage: `url("${LQIP}")` }}
        >
          <video
            ref={videoRef}
            {...(src ? { src, poster: POSTER } : {})}
            muted
            loop
            playsInline
            controls={isFullscreen}
            preload="none"
            disablePictureInPicture
            disableRemotePlayback
            aria-label="Aerial flight over Bishops Hull Playing Field towards the Hub"
            onCanPlay={() => setReady(true)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              ready ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Legibility wash for the overlaid copy — the bottom of the frame is
              open grass, so nothing of interest sits underneath it. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(10,60,55,0.94) 0%, rgba(10,60,55,0.62) 30%, rgba(10,60,55,0.22) 55%, rgba(0,0,0,0) 80%)',
            }}
          />

          {/* Matches the "Virtual Tour" badge above, so the two read as a pair. */}
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-black/60 backdrop-blur-md text-white border-none px-3 py-1.5 md:px-4 md:py-2 uppercase tracking-tighter text-[10px] md:text-xs font-bold">
              <Plane className="mr-1.5 md:mr-2 h-3 w-3" /> Aerial Tour
            </Badge>
          </div>

          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? 'Pause the aerial tour' : 'Play the aerial tour'}
              className="rounded-full bg-black/60 backdrop-blur-md p-2.5 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 transition-colors"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={goFullscreen}
              aria-label="View the aerial tour full screen"
              className="hidden sm:block rounded-full bg-black/60 backdrop-blur-md p-2.5 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 transition-colors"
            >
              <Expand className="h-4 w-4" />
            </button>
          </div>

          {/* Large centre affordance while the clip is idle — this is the only
              cue reduced-motion and Save-Data visitors get. */}
          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              aria-label="Play the aerial tour"
              className="absolute inset-0 z-10 flex items-center justify-center focus-visible:outline-none"
            >
              <span className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white shadow-xl transition-transform hover:scale-105">
                <Play className="h-7 w-7 md:h-8 md:w-8 translate-x-0.5 fill-current" />
              </span>
            </button>
          )}

          <div className="absolute inset-x-0 bottom-0 z-10 p-5 md:p-10 lg:p-12">
            <div className="max-w-2xl space-y-1.5 md:space-y-3">
              <h2 className="text-xl sm:text-2xl md:text-4xl font-headline font-bold text-white drop-shadow-md">
                The Hub from above
              </h2>
              <p className="text-xs sm:text-sm md:text-lg text-white/85 leading-relaxed">
                A short flight across Bishops Hull Playing Field, from the cricket
                square to our front door.
              </p>
              <Link
                href="/find-us"
                className="inline-flex items-center pt-1 text-sm md:text-base font-semibold text-white hover:gap-2 transition-all"
              >
                Plan your visit <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
