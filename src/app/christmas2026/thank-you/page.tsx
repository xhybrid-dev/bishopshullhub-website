import type { Metadata } from 'next';
import Link from 'next/link';
import '@/components/christmas/santa-grotto.css';

export const metadata: Metadata = {
  title: 'Ho Ho Ho! You’re booked | Bishops Hull Hub',
  robots: { index: false },
};

export default function GrottoThankYouPage() {
  return (
    <div className="grotto grotto-thanks">
      <div className="big" aria-hidden="true">🎅🎁</div>
      <h1>Ho Ho Ho! You’re booked!</h1>
      <p>Thank you! Santa can’t wait to meet you at the Bishops Hull Hub Grotto.</p>
      <p>
        <b>Saturday 12th December, 10am–12pm</b>
        <br />
        Please arrive before 11am to see Santa. 🎄
      </p>
      <p>A receipt is on its way to your inbox.</p>
      <p>
        <Link href="/christmas2026">← Back to the Grotto</Link>
      </p>
    </div>
  );
}
