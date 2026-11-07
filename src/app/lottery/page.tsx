import type { Metadata } from 'next';
import CommunityLottery from '@/components/lottery/CommunityLottery';
import { LOTTERY, formatPounds } from '@/lib/community-lottery';
import { lotteryFontVars } from './fonts';

const price = formatPounds(LOTTERY.ticketPricePence);
const description = `Join the ${LOTTERY.name}: ${price} a month, three cash prizes every month, and every ticket supports Bishops Hull Hub. Formerly the 100 Club.`;

export const metadata: Metadata = {
  title: `${LOTTERY.name} | Bishops Hull Hub`,
  description,
  alternates: { canonical: '/lottery' },
  openGraph: {
    title: LOTTERY.name,
    description: `${price} a month. Three cash prizes every month. A big difference for our village.`,
    url: 'https://bhhub.co.uk/lottery',
    type: 'website',
  },
};

export default function LotteryPage() {
  return (
    <div className={lotteryFontVars}>
      <CommunityLottery />
    </div>
  );
}
