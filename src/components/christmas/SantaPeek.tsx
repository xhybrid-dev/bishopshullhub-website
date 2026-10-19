"use client";

import { useEffect, useState } from 'react';

const LINES = [
  'Ho ho ho!',
  'Have you been good this year?',
  'Is that a mince pie I smell?',
  'Rudolph ate my carrot again…',
  'My list is long. My beard is longer.',
  'Elves on strike? Never!',
  'Psst… I know who ate the last biscuit.',
];

/** Santa peeking over a snow bank: blinks, waves, says silly things. */
export default function SantaPeek() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % LINES.length), 3600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="santa-peek" aria-hidden="true">
      <div className="bubble" key={line}>{LINES[line]}</div>
      <svg viewBox="0 0 200 216" role="img" className="santa-svg">
        <g className="santa-rise">
          <g className="santa-bob">
            {/* body */}
            <path d="M52 206 C52 172 76 160 100 160 C124 160 148 172 148 206 Z" fill="#c4122f" />
            <rect x="94" y="160" width="12" height="40" fill="#7a0a1e" opacity=".35" />
            {/* waving arm */}
            <g className="santa-wave">
              <path d="M146 184 L166 142" stroke="#c4122f" strokeWidth="20" strokeLinecap="round" />
              <circle cx="168" cy="136" r="11" fill="#fff" />
              <circle cx="146" cy="184" r="1" fill="none" />
            </g>
            {/* face */}
            <circle cx="100" cy="114" r="40" fill="#f6c9a8" />
            <circle cx="76" cy="126" r="7" fill="#ff7a8a" opacity=".5" />
            <circle cx="124" cy="126" r="7" fill="#ff7a8a" opacity=".5" />
            {/* beard */}
            <path d="M58 112 C52 162 78 186 100 188 C122 186 148 162 142 112 C132 134 118 138 100 138 C82 138 68 134 58 112 Z" fill="#fff" />
            <path d="M58 112 C52 162 78 186 100 188 C122 186 148 162 142 112" fill="none" stroke="#dfe6f2" strokeWidth="3" />
            <ellipse cx="86" cy="136" rx="17" ry="8" transform="rotate(-12 86 136)" fill="#fff" stroke="#dfe6f2" strokeWidth="2" />
            <ellipse cx="114" cy="136" rx="17" ry="8" transform="rotate(12 114 136)" fill="#fff" stroke="#dfe6f2" strokeWidth="2" />
            <ellipse className="santa-mouth" cx="100" cy="150" rx="7" ry="5.5" fill="#7a0a1e" />
            <circle cx="100" cy="127" r="7.5" fill="#e8907a" />
            {/* eyes */}
            <g className="santa-eyes">
              <ellipse cx="85" cy="113" rx="4.5" ry="5.5" fill="#2a1a1a" />
              <ellipse cx="115" cy="113" rx="4.5" ry="5.5" fill="#2a1a1a" />
              <circle cx="86.5" cy="111" r="1.5" fill="#fff" />
              <circle cx="116.5" cy="111" r="1.5" fill="#fff" />
            </g>
            <path d="M76 103 Q85 97 94 102" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M106 102 Q115 97 124 103" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* hat */}
            <path d="M56 98 C54 56 78 36 108 36 C128 36 142 50 146 98 Z" fill="#c4122f" />
            <g className="santa-tip">
              <path d="M118 40 Q150 40 160 74" stroke="#c4122f" strokeWidth="22" strokeLinecap="round" fill="none" />
              <circle cx="161" cy="84" r="12" fill="#fff" />
            </g>
            <rect x="48" y="86" width="104" height="20" rx="10" fill="#fff" stroke="#dfe6f2" strokeWidth="2" />
          </g>
        </g>
        {/* snow bank */}
        <ellipse cx="100" cy="202" rx="96" ry="16" fill="#d9e8fb" />
        <ellipse cx="100" cy="199" rx="92" ry="17" fill="#fff" />
        <ellipse cx="62" cy="192" rx="26" ry="6" fill="#eaf4ff" />
        <ellipse cx="146" cy="195" rx="22" ry="5" fill="#eaf4ff" />
      </svg>
    </div>
  );
}
