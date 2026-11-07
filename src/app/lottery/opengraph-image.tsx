import { ImageResponse } from 'next/og';
import { LOTTERY, formatPounds } from '@/lib/community-lottery';

// The card Facebook/WhatsApp show when someone shares /lottery.
export const runtime = 'edge';
export const alt = `${LOTTERY.name}: ${formatPounds(LOTTERY.ticketPricePence)} a month, three cash prizes every month`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BALLS = [
  { n: 1, c1: '#ffd659', c2: '#df9a00' },
  { n: 2, c1: '#eef2f3', c2: '#93a4a7' },
  { n: 3, c1: '#f4ac78', c2: '#b55f27' },
];

// Satori can't read woff2, so the OG card has its own .woff copies of Fredoka (SIL OFL).
// The URLs must be literal strings so the bundler can include the files.
const loadFonts = () =>
  Promise.all([
    fetch(new URL('../fonts/fredoka-latin-700.woff', import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL('../fonts/fredoka-latin-600.woff', import.meta.url)).then((r) => r.arrayBuffer()),
  ]);

export default async function OgImage() {
  const price = formatPounds(LOTTERY.ticketPricePence);
  const [bold, semi] = await loadFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '64px 72px', fontFamily: 'Fredoka', color: '#fff',
          background: 'linear-gradient(160deg, #0e3d37 0%, #082824 100%)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '700px' }}>
          <div style={{ display: 'flex', fontSize: '26px', fontWeight: 600, letterSpacing: '0.12em', color: '#bdeedd', textTransform: 'uppercase' }}>
            Bishops Hull
          </div>
          <div style={{ display: 'flex', fontSize: '104px', fontWeight: 700, lineHeight: 0.95, color: '#f7bd2e', marginTop: '12px' }}>
            Community Lottery
          </div>
          <div style={{ display: 'flex', fontSize: '38px', fontWeight: 600, marginTop: '30px' }}>
            {`${price} a month · 3 cash prizes every month`}
          </div>
          <div style={{ display: 'flex', fontSize: '28px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: '14px' }}>
            A little chance to win. A big difference for our village.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
          {BALLS.map((b) => (
            <div
              key={b.n}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: '140px', height: '140px', borderRadius: '50%',
                background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${b.c1} 30%, ${b.c2} 100%)`,
              }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '78px', height: '78px', borderRadius: '50%',
                  background: '#fff', color: '#082824', fontSize: '48px', fontWeight: 700,
                }}
              >
                {String(b.n)}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Fredoka', data: bold, weight: 700, style: 'normal' },
        { name: 'Fredoka', data: semi, weight: 600, style: 'normal' },
      ],
    }
  );
}
