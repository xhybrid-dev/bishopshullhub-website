import Image from 'next/image';

/** The Hub in the snow, with the lit windows and lanterns gently glowing. */
export default function HubBanner() {
  return (
    <figure className="hub-banner" data-reveal>
      <div className="hub-frame">
        <Image
          src="/images/hub-christmas.webp"
          alt="Bishops Hull Hub in the snow, with a Christmas tree glowing in the doorway, fairy lights along the roof and reindeer in the foreground"
          width={2000}
          height={1116}
          sizes="(min-width: 1024px) 980px, 100vw"
          className="hub-photo"
        />
        <span className="glow g-door" aria-hidden="true" />
        <span className="glow g-win1" aria-hidden="true" />
        <span className="glow g-win2" aria-hidden="true" />
        <span className="glow g-lan1" aria-hidden="true" />
        <span className="glow g-lan2" aria-hidden="true" />
        <span className="glow g-lan3" aria-hidden="true" />
        <div className="hub-shade" aria-hidden="true" />
      </div>
      <figcaption>
        <span className="eyebrow">Santa’s Grotto at</span>
        <strong>Find us at the Hub, Bishops Hull</strong>
      </figcaption>
    </figure>
  );
}
