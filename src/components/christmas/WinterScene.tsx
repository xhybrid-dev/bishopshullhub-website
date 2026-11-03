"use client";

import { useEffect, useState } from 'react';
import { SantaFigure } from './SantaFigure';

const LINES = [
  'Ho ho ho!',
  'Been good this year?',
  'Bring your wish list!',
  'Mince pie? Yes please!',
  'See you on the 12th!',
];

const TreeShape = () => (
  <>
    <path d="M0-46-10-30h5l-9 15h7L-17 0h34L7-15h7L5-30h5z" />
    <rect x="-2.5" y="-1" width="5" height="6" />
  </>
);

/** A pine at (x, y) on the ground, scaled by s. */
const Pine = ({ x, y, s }: { x: number; y: number; s: number }) => (
  <use href="#grotto-pine" transform={`translate(${x} ${y}) scale(${s})`} />
);

const Lantern = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y - 6} r="16" fill="url(#grotto-glow)" />
    <rect x={x - 3} y={y - 15} width="6" height="2.5" rx="1" fill="#1b2b45" />
    <rect x={x - 4} y={y - 12} width="8" height="10" rx="2" fill="#ffd36e" />
  </g>
);

/**
 * Layered paper-cut clearing: hills, pines, a big decorated tree with
 * presents, a snowman, and Santa waving from behind the middle hill.
 */
export default function WinterScene() {
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setLine((l) => (l + 1) % LINES.length), 3600);
    return () => clearInterval(t);
  }, []);

  return (
    <svg className="scene" viewBox="0 60 1200 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <g id="grotto-pine"><TreeShape /></g>
        <radialGradient id="grotto-glow">
          <stop offset="0" stopColor="#ffd36e" stopOpacity=".75" />
          <stop offset="1" stopColor="#ffd36e" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* far hills */}
      <g className="layer">
        <path d="M0 170C140 140 260 150 380 165 520 182 620 128 790 140 930 150 1060 120 1200 135V300H0z" fill="#8ec1dd" />
        <g fill="#6fa6c6">
          <Pine x={170} y={160} s={0.55} />
          <Pine x={205} y={162} s={0.45} />
          <Pine x={1010} y={131} s={0.55} />
          <Pine x={1048} y={129} s={0.65} />
          <Pine x={1086} y={132} s={0.45} />
        </g>
      </g>

      {/* Santa, standing behind the middle hill */}
      <g transform="translate(650 72) scale(.85)">
        <g className="layer"><SantaFigure /></g>
      </g>
      <g className="bub" key={line}>
        <rect x="470" y="86" width="200" height="44" rx="22" fill="#fff" />
        <path d="M650 124l42 16-22-22z" fill="#fff" />
        <text x="570" y="115" textAnchor="middle" fontWeight="600" fontSize="19" fill="#1b2b45">{LINES[line]}</text>
      </g>

      {/* middle hill */}
      <g className="layer">
        <path d="M0 225C150 195 280 190 420 208 560 226 660 236 800 214 940 192 1060 196 1200 210V300H0z" fill="#c3e0ee" />
        <g fill="#2f7a5f">
          <Pine x={70} y={214} s={0.9} />
          <Pine x={110} y={207} s={1.15} />
          <Pine x={148} y={203} s={0.8} />
          <Pine x={930} y={201} s={1} />
          <Pine x={968} y={197} s={1.25} />
          <Pine x={1008} y={198} s={0.85} />
        </g>
      </g>

      {/* front snow */}
      <g className="layer">
        <path d="M0 262C200 246 380 244 600 250 820 256 1000 244 1200 252V300H0z" fill="#f4f8fb" />
        <g fill="#245f4a">
          <Pine x={48} y={262} s={1.5} />
          <Pine x={92} y={264} s={1.05} />
          <Pine x={1100} y={256} s={1.15} />
          <Pine x={1140} y={258} s={1.45} />
          <Pine x={1172} y={262} s={1} />
        </g>
      </g>

      {/* the big tree */}
      <g>
        <rect x="423" y="248" width="14" height="12" fill="#8a5a3c" />
        <path className="tier" d="M430 170 360 250Q430 262 500 250z" fill="#2f7a5f" />
        <path className="tier" d="M430 140 375 212Q430 222 485 212z" fill="#348a69" />
        <path className="tier" d="M430 112 390 176Q430 184 470 176z" fill="#3c9873" />
        <g fill="none" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="0 10">
          <path d="M372 230Q430 248 488 228" stroke="#f7c548" />
          <path d="M388 194Q430 208 472 192" stroke="#fff3c4" />
          <path d="M402 160Q430 170 458 158" stroke="#f7c548" />
        </g>
        <circle cx="402" cy="240" r="5" fill="#e5484d" />
        <circle cx="446" cy="236" r="4.5" fill="#f59ab5" />
        <circle cx="474" cy="242" r="4.5" fill="#fff" />
        <circle cx="410" cy="203" r="4.5" fill="#f59ab5" />
        <circle cx="452" cy="200" r="4.5" fill="#e5484d" />
        <circle cx="421" cy="166" r="4" fill="#fff" />
        <circle cx="444" cy="168" r="4" fill="#e5484d" />
        <circle cx="430" cy="106" r="16" fill="url(#grotto-glow)" />
        <path
          className="star"
          d="M430 93L433.2 101.6 442.4 102 435.2 107.7 437.6 116.5 430 111.5 422.4 116.5 424.8 107.7 417.6 102 426.8 101.6Z"
          fill="#f7c548"
        />
      </g>

      {/* presents */}
      <g>
        <rect x="366" y="240" width="28" height="20" rx="2" fill="#e5484d" />
        <rect x="377" y="240" width="6" height="20" fill="#f7c548" />
        <rect x="366" y="247" width="28" height="5" fill="#f7c548" />
        <circle cx="376" cy="238" r="4" fill="#f7c548" /><circle cx="384" cy="238" r="4" fill="#f7c548" />
        <rect x="470" y="244" width="24" height="16" rx="2" fill="#f7c548" />
        <rect x="479.5" y="244" width="5" height="16" fill="#e5484d" />
        <rect x="470" y="250" width="24" height="4" fill="#e5484d" />
        <circle cx="479" cy="242" r="3.5" fill="#e5484d" /><circle cx="486" cy="242" r="3.5" fill="#e5484d" />
        <rect x="396" y="248" width="20" height="13" rx="2" fill="#f59ab5" />
        <rect x="403.5" y="248" width="5" height="13" fill="#fff" />
      </g>

      {/* snowman */}
      <g>
        <path d="M256 208 238 194M243 198l-5 5M284 208l18-12M297 199l4 5" stroke="#8a5a3c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <g className="paper" fill="#fff">
          <circle cx="270" cy="240" r="20" />
          <circle cx="270" cy="210" r="15" />
          <circle cx="270" cy="186" r="11" />
        </g>
        <rect x="258" y="195" width="24" height="6" rx="3" fill="#e5484d" />
        <rect x="274" y="198" width="6" height="14" rx="3" fill="#e5484d" />
        <rect x="257" y="174" width="26" height="4" rx="2" fill="#1b2b45" />
        <rect x="261" y="158" width="18" height="17" rx="2" fill="#1b2b45" />
        <rect x="261" y="168" width="18" height="4" fill="#e5484d" />
        <circle cx="266" cy="184" r="1.6" fill="#1b2b45" /><circle cx="274" cy="184" r="1.6" fill="#1b2b45" />
        <path d="M270 187l11 2-11 2z" fill="#f39c3d" />
        <circle cx="270" cy="208" r="1.8" fill="#1b2b45" /><circle cx="270" cy="216" r="1.8" fill="#1b2b45" />
      </g>

      <Lantern x={600} y={254} />
      <Lantern x={868} y={252} />
      <Lantern x={1030} y={254} />
    </svg>
  );
}
