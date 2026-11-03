/**
 * Paper-cut Santa, drawn in a 200 × 212 box with his body running off the
 * bottom edge so he can stand behind a hill or snow bank. The arm waves and
 * the mouth goes "ho ho ho" via the .wave and .ho classes in santa-grotto.css.
 */
export function SantaFigure() {
  return (
    <g className="santa-fig">
      <path d="M38 212C38 162 66 142 100 142s62 20 62 70z" fill="#e5484d" />
      <rect x="92" y="146" width="16" height="66" rx="8" fill="#fff" />
      <g className="wave">
        <rect x="140" y="104" width="24" height="62" rx="12" transform="rotate(28 152 166)" fill="#e5484d" />
        <circle cx="181" cy="109" r="14" fill="#2f9e6e" />
      </g>
      <circle cx="100" cy="100" r="38" fill="#f8c9a6" />
      <circle cx="73" cy="110" r="7.5" fill="#f59ab5" opacity=".7" />
      <circle cx="127" cy="110" r="7.5" fill="#f59ab5" opacity=".7" />
      <path d="M60 98C54 150 82 176 100 176s46-26 40-78c-10 22-24 28-40 28s-30-6-40-28z" fill="#fff" />
      <ellipse className="ho" cx="100" cy="138" rx="7" ry="5.5" fill="#8a2430" />
      <path
        d="M100 124c-6-10-24-11-30-1 9 6 22 6 30 1zM100 124c6-10 24-11 30-1-9 6-22 6-30 1z"
        fill="#fff"
        stroke="#dfe7ef"
        strokeWidth="1.5"
      />
      <circle cx="100" cy="114" r="7" fill="#ef8f7a" />
      <path d="M81 101q6-7 12 0M107 101q6-7 12 0" stroke="#1b2b45" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M62 80C60 40 90 18 118 24c18 4 30 18 38 40l-12 16z" fill="#e5484d" />
      <circle cx="158" cy="72" r="13" fill="#fff" />
      <rect x="54" y="68" width="94" height="22" rx="11" fill="#fff" />
    </g>
  );
}

/** Santa hat icon, sized and stroked like the lucide icons around it. */
export function HatIcon({ className = '', ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...rest}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide ${className}`}
      aria-hidden="true"
    >
      <path d="M4.5 18c0-7 3.4-12 8.8-12 3.3 0 5.4 2.4 6.3 6.6" />
      <circle cx="19.8" cy="15.2" r="1.8" />
      <rect x="2.5" y="18" width="17" height="3.4" rx="1.7" />
    </svg>
  );
}
