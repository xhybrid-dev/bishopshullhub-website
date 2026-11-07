import localFont from 'next/font/local';

// Self-hosted for the same reason as the site fonts in app/layout.tsx: the
// App Hosting build fails if Google Fonts misbehaves. Latin subsets only.
const fredoka = localFont({
  src: '../fonts/fredoka-latin-variable.woff2',
  display: 'swap',
  variable: '--font-fredoka',
  weight: '500 700',
});

const nunitoSans = localFont({
  src: '../fonts/nunito-sans-latin-variable.woff2',
  display: 'swap',
  variable: '--font-nunito-sans',
  weight: '400 700',
});

/** Put on a wrapper around the lottery page so .lotto can use the fonts. */
export const lotteryFontVars = `${fredoka.variable} ${nunitoSans.variable}`;
