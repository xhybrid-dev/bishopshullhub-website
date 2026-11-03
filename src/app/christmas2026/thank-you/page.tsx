import type { Metadata } from 'next';
import Link from 'next/link';
import { SantaFigure } from '@/components/christmas/SantaFigure';
import Snowfall from '@/components/christmas/Snowfall';
import { grottoFontVars } from '../fonts';
import '@/components/christmas/santa-grotto.css';

export const metadata: Metadata = {
  title: 'Ho Ho Ho! You’re booked | Bishops Hull Hub',
  robots: { index: false },
};

export default function GrottoThankYouPage() {
  return (
    <div className={grottoFontVars}>
      <div className="grotto grotto-thanks">
        <div className="bunting" aria-hidden="true" />
        <Snowfall />
        <svg className="thanks-santa" viewBox="0 0 210 214" aria-hidden="true">
          <g transform="translate(5 0)"><SantaFigure /></g>
          <ellipse cx="105" cy="206" rx="100" ry="14" fill="#c3e0ee" />
          <ellipse cx="105" cy="204" rx="96" ry="14" fill="#fff" />
        </svg>
        <h1>Ho ho ho! You’re <span>booked!</span></h1>
        <p>Thank you! Santa can’t wait to meet you at the Bishops Hull Hub Grotto.</p>
        <p className="when">
          <b>Saturday 12th December, 10am–12pm</b>
          Please arrive before 11am to see Santa.
        </p>
        <p>A receipt is on its way to your inbox.</p>
        <Link className="btn" href="/christmas2026">Back to the Grotto</Link>
      </div>
    </div>
  );
}
