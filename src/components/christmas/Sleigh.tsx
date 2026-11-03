/** Santa's sleigh and two reindeer in silhouette; flies across the moon via CSS. */
export default function Sleigh() {
  return (
    <svg className="sleigh" viewBox="-6 -16 150 52" aria-hidden="true">
      <defs>
        <g id="grotto-deer">
          <ellipse cx="12" cy="12" rx="11" ry="4.6" stroke="none" />
          <path d="M20 10 25 2" strokeWidth="3.2" fill="none" />
          <ellipse cx="27.5" cy="1.5" rx="4.2" ry="2.4" stroke="none" />
          <path d="M25 0 23-7M24-4 21-6M28 0 29-7M28.6-4 31.5-6" strokeWidth="1.2" fill="none" />
          <path d="M5 15 1 22M9 15 10 23M16 15 20 22M20 14 26 19M1.5 10-2 8" strokeWidth="1.8" fill="none" />
        </g>
      </defs>
      <g fill="#0f2547" stroke="#0f2547" strokeLinecap="round">
        <use href="#grotto-deer" x="74" y="2" />
        <use href="#grotto-deer" x="108" y="-3" />
        <path d="M42 15 76 14M74 13 110 9" strokeWidth="1" fill="none" />
        <ellipse cx="9" cy="9" rx="7.5" ry="6.5" stroke="none" />
        <path d="M18 5h12l2 10H16z" stroke="none" />
        <circle cx="24" cy="1" r="4.4" stroke="none" />
        <path d="M20 -1.5h8.5L32-9z" stroke="none" />
        <path d="M2 12c0 10 6 14 16 14h22c6 0 8-4 10-10h-6l-4 4H8c-2 0-2-6-6-8z" stroke="none" />
        <path d="M0 31h46c6 0 8-4 10-7M12 26v5M36 26v5" strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}
