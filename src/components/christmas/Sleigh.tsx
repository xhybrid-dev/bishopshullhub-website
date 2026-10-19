/** Silhouette of Santa's sleigh and two reindeer, facing right, trailing sparkles. */
export default function Sleigh() {
  return (
    <svg className="sleigh-svg" viewBox="-20 0 330 90" aria-hidden="true">
      <defs>
        <g id="deer">
          <ellipse cx="40" cy="44" rx="22" ry="10" />
          <path d="M56 40 L70 24 L78 28 L64 48 Z" />
          <ellipse cx="76" cy="25" rx="8" ry="5.5" transform="rotate(-15 76 25)" />
          <path d="M72 21 L67 5 M67 5 L60 8 M69 11 L75 3 M75 3 L81 5" className="antler" />
          <path d="M22 42 L14 38" className="antler" />
          <path d="M26 52 L12 66 M34 53 L24 70 M50 53 L64 62 M56 50 L74 58" className="antler" />
        </g>
      </defs>
      <g className="sleigh-body">
        <path d="M66 50 H146" className="rein" />
        <path d="M66 56 H100" className="rein" />
        <use href="#deer" x="108" y="8" />
        <use href="#deer" x="168" y="2" />
        <g transform="translate(-160 0)">
        <path d="M168 30 H236 Q234 56 212 60 H186 Q168 58 168 30 Z" />
        <path d="M160 70 H240 Q254 70 252 52" className="runner" />
        <path d="M176 60 V70 M222 60 V70" className="runner" />
        <circle cx="206" cy="22" r="8" />
        <path d="M198 18 Q206 0 218 14 Z" />
        <circle cx="219" cy="14" r="3" className="pom" />
        </g>
      </g>
      <g className="trail">
        <circle cx="-4" cy="78" r="2" /><circle cx="-14" cy="82" r="1.5" />
      </g>
    </svg>
  );
}
