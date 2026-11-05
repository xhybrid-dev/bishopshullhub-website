"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, Ticket } from 'lucide-react';
import { GROTTO_START_ISO, GROTTO_TICKET_PRICE_PENCE } from '@/lib/santa-grotto';
import { SantaFigure } from './SantaFigure';
import Snowfall from './Snowfall';
import './grotto-banner.css';

const price = (p: number) => (p % 100 === 0 ? `£${p / 100}` : `£${(p / 100).toFixed(2)}`);
// The grotto runs 10am–12pm; stop promoting it once it has finished.
const EVENT_END = new Date(GROTTO_START_ISO).getTime() + 2 * 60 * 60 * 1000;

/** Home page promo for the Santa Grotto, styled like /christmas2026. */
export default function GrottoBanner({ className = '' }: { className?: string }) {
  const [over, setOver] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (Date.now() > EVENT_END) { setOver(true); return; }
    fetch('/api/christmas2026/availability')
      .then((r) => r.json())
      .then((j) => typeof j.remaining === 'number' && setRemaining(j.remaining))
      .catch(() => {});
  }, []);

  if (over) return null;
  const soldOut = remaining === 0;

  return (
    <section className={className} aria-labelledby="grotto-banner-title">
      <div className="grotto-banner">
        <div className="gb-bunting" aria-hidden="true" />
        <div className="gb-moon" aria-hidden="true" />
        <Snowfall density={6000} />
        <svg className="gb-hills" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 22C60 8 120 10 200 20s140 6 200-6V40H0z" fill="#8ec1dd" />
          <path d="M0 30C80 20 160 24 240 30s120 2 160-4V40H0z" fill="#c3e0ee" />
        </svg>

        <svg className="gb-santa" viewBox="0 0 210 214" aria-hidden="true">
          <g transform="translate(5 0)"><SantaFigure /></g>
          <ellipse cx="105" cy="208" rx="104" ry="14" fill="#c3e0ee" />
          <ellipse cx="105" cy="206" rx="100" ry="14" fill="#fff" />
        </svg>

        <div className="gb-text">
          <p className="gb-eyebrow">Christmas at the Hub</p>
          <h2 id="grotto-banner-title">Santa’s <span>Grotto</span></h2>
          <p className="gb-blurb">Meet Santa, festive crafts, a winter café and a gift for every child.</p>
          <ul className="gb-chips">
            <li><i><CalendarDays aria-hidden="true" /></i> Sat 12 December</li>
            <li><i><Clock aria-hidden="true" /></i> 10am – 12pm</li>
            <li><i><Ticket aria-hidden="true" /></i> {price(GROTTO_TICKET_PRICE_PENCE)} per child</li>
          </ul>
        </div>

        <div className="gb-cta">
          {soldOut ? (
            <span className="gb-places">Fully booked</span>
          ) : remaining !== null && remaining <= 20 ? (
            <span className="gb-places">Only {remaining} place{remaining === 1 ? '' : 's'} left!</span>
          ) : null}
          <Link className="gb-btn" href={soldOut ? '/christmas2026' : '/christmas2026#book'}>
            {soldOut ? 'Find out more' : 'Book tickets'} <ArrowRight aria-hidden="true" />
          </Link>
          {!soldOut && <Link className="gb-more" href="/christmas2026">See what’s on the day</Link>}
        </div>
      </div>
    </section>
  );
}
