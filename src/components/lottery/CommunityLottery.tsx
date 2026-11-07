import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, CalendarDays, FileDown, HandCoins, Heart, Lightbulb, Mail, PartyPopper,
  ShieldCheck, Ticket, Trees, Trophy, Wrench,
} from 'lucide-react';
import {
  LOTTERY, formatDrawDate, formatPounds, salesFor, winnersByDraw,
} from '@/lib/community-lottery';
import './community-lottery.css';

const L = LOTTERY;
const price = formatPounds(L.ticketPricePence);
const PLACES = ['1st', '2nd', '3rd'] as const;
const BALLS = ['gold', 'silver', 'bronze'] as const;

const SIGN_UP_EMAIL_BODY = [
  'Hello,',
  '',
  `I would like to join the ${L.name}.`,
  '',
  'Name:',
  `Number of tickets (${price} a month each):`,
  'Phone:',
  'Address:',
  '',
  'I confirm I am aged 16 or over.',
].join('\n');

const joinHref =
  L.signUpUrl ??
  `mailto:${L.contactEmail}?subject=${encodeURIComponent(`${L.name}: sign me up`)}&body=${encodeURIComponent(SIGN_UP_EMAIL_BODY)}`;
const joinExternal = L.signUpUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {};

const IMPACT = [
  { Icon: Wrench, title: 'Facilities & equipment', text: 'Keeping the hall, kitchen and kit in great shape for everyone who uses them.' },
  { Icon: Trees, title: 'Grounds & outdoor spaces', text: 'Caring for the playing field surroundings, garden and the sensory trail.' },
  { Icon: Lightbulb, title: 'Lighting, security & access', text: 'Safer, brighter, more accessible spaces for all ages and abilities.' },
  { Icon: PartyPopper, title: 'Activities & events', text: 'Quiz nights, craft fairs, Christmas events and more for local residents.' },
  { Icon: HandCoins, title: 'Affordable for local groups', text: 'Helping keep hire prices low for clubs, classes and community groups.' },
];

function JoinButton({ className = 'btn' }: { className?: string }) {
  return (
    <a className={className} href={joinHref} {...joinExternal}>
      <Ticket aria-hidden /> Get your ticket
    </a>
  );
}

function Ball({ n, size = 'md' }: { n: 1 | 2 | 3; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`ball ball--${BALLS[n - 1]} ball--${size}`} aria-hidden>
      <b>{n}</b>
    </span>
  );
}

/** Decorative ticket in the hero. */
function HeroTicket() {
  return (
    <div className="ticket-stage" aria-hidden>
      <div className="ticket">
        <div className="ticket-main">
          <span className="ticket-kicker">{L.drawName}</span>
          <span className="ticket-price">{price}</span>
          <span className="ticket-per">a month</span>
        </div>
        <div className="ticket-stub">
          <span>No.</span>
          <b>0100</b>
        </div>
      </div>
      <div className="hero-balls">
        <Ball n={1} size="lg" />
        <Ball n={2} size="lg" />
        <Ball n={3} size="lg" />
      </div>
    </div>
  );
}

export default function CommunityLottery() {
  const firstDraw = formatDrawDate(L.firstDrawDate);
  const target = salesFor(L.supporterTarget);
  const stretch = salesFor(L.stretchTarget);
  const prizesConfirmed = L.prizesPence.every((p) => p !== null);
  const draws = winnersByDraw(L.winners);
  const progress =
    L.currentSupporters === null ? null : Math.min(100, Math.round((L.currentSupporters / L.supporterTarget) * 100));

  return (
    <div className="lotto">
      {/* ---- Hero ---- */}
      <section className="hero">
        <div className="in hero-grid">
          <div className="hero-copy">
            <p className="chip">The new home of the 100 Club</p>
            <h1>
              Bishops Hull <span>Community Lottery</span>
            </h1>
            <p className="tagline">A little chance to win. A big difference for our village.</p>
            <ul className="facts">
              <li><i>£</i>{price} a month</li>
              <li><i><Trophy aria-hidden /></i>3 cash prizes every month</li>
              <li><i><Heart aria-hidden /></i>Supports Bishops Hull Hub</li>
            </ul>
            <div className="cta-row">
              <JoinButton />
              <a className="text-link" href="#how">How it works <ArrowRight aria-hidden /></a>
            </div>
            <p className="next-draw">
              <CalendarDays aria-hidden />
              {firstDraw ? <>First {L.drawName}: <strong>{firstDraw}</strong></> : <>First {L.drawName}: date to be announced</>}
            </p>
          </div>
          <HeroTicket />
        </div>
      </section>

      {/* ---- Prizes ---- */}
      <section className="band prizes" aria-labelledby="prizes-h">
        <div className="in">
          <p className="eyebrow">{L.drawName}</p>
          <h2 id="prizes-h">Three chances to win, every month</h2>
          <ul className="prize-grid">
            {L.prizesPence.map((p, i) => (
              <li key={i} className={`prize prize--${BALLS[i]}`}>
                <Ball n={(i + 1) as 1 | 2 | 3} />
                <span className="prize-place">{PLACES[i]} prize</span>
                <span className="prize-amount">{p === null ? 'Cash prize' : formatPounds(p)}</span>
              </li>
            ))}
          </ul>
          <p className="fine">
            {prizesConfirmed
              ? `Every ${price} ticket is entered into every monthly draw while your membership is active.`
              : 'Prize amounts will be confirmed and published here before the first draw.'}
          </p>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section id="how" className="band how" aria-labelledby="how-h">
        <div className="in">
          <p className="eyebrow">How it works</p>
          <h2 id="how-h">Join in three easy steps</h2>
          <ol className="steps">
            <li>
              <span className="step-n">1</span>
              <h3>Join for {price} a month</h3>
              <p>Sign up online{L.paperFormUrl ? ' or with a paper form' : ''}. Each {price} buys one ticket in every monthly draw.</p>
            </li>
            <li>
              <span className="step-n">2</span>
              <h3>Get your lucky number</h3>
              <p>We&rsquo;ll confirm your entry and send you your ticket number.</p>
            </li>
            <li>
              <span className="step-n">3</span>
              <h3>Watch for {L.drawName}</h3>
              <p>
                Three numbers are drawn {L.drawSchedule ?? 'every month'}. Winners are contacted directly and
                announced here and on the Hub&rsquo;s Facebook page.
              </p>
            </li>
          </ol>
          <div className="cta-row center">
            <JoinButton />
            {L.paperFormUrl && (
              <a className="btn btn--ghost" href={L.paperFormUrl} download>
                <FileDown aria-hidden /> Download a paper form
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ---- Impact ---- */}
      <section id="impact" className="band impact" aria-labelledby="impact-h">
        <div className="in">
          <p className="eyebrow">Where your money goes</p>
          <h2 id="impact-h">It&rsquo;s about more than winning</h2>
          <p className="lede">
            Every ticket helps support Bishops Hull Hub &mdash; the maintenance, improvements, facilities and
            activities that make the Hub such an important part of village life.
          </p>
          <ul className="impact-grid">
            {IMPACT.map(({ Icon, title, text }) => (
              <li key={title}>
                <i><Icon aria-hidden /></i>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>

          {L.split ? (
            <figure className="split">
              <figcaption>How every {price} ticket is shared</figcaption>
              <div className="split-bar" role="img"
                aria-label={`Prizes ${L.split.prizes}%, Bishops Hull Hub ${L.split.hub}%, running costs ${L.split.costs}%`}>
                <span className="seg seg--hub" style={{ flexGrow: L.split.hub }} />
                <span className="seg seg--prizes" style={{ flexGrow: L.split.prizes }} />
                <span className="seg seg--costs" style={{ flexGrow: L.split.costs }} />
              </div>
              <ul className="split-key">
                <li><i className="seg--hub" />Bishops Hull Hub <b>{L.split.hub}%</b></li>
                <li><i className="seg--prizes" />Prizes <b>{L.split.prizes}%</b></li>
                <li><i className="seg--costs" />Running costs <b>{L.split.costs}%</b></li>
              </ul>
            </figure>
          ) : (
            <div className="promise">
              <ShieldCheck aria-hidden />
              <p>
                <strong>Our transparency promise.</strong> We&rsquo;ll publish the prize amounts and exactly how every{' '}
                {price} is shared before the first draw, and report back every quarter on what your tickets have helped fund.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ---- Target ---- */}
      <section className="target" aria-labelledby="target-h">
        <div className="in">
          <p className="eyebrow">Our first target</p>
          <h2 id="target-h">{L.supporterTarget} local supporters</h2>
          <div className="sum" role="img"
            aria-label={`${L.supporterTarget} supporters times ${price} is ${formatPounds(target.monthly)} a month, or ${formatPounds(target.yearly)} a year`}>
            <span><b>{L.supporterTarget}</b>supporters</span>
            <em>&times;</em>
            <span><b>{price}</b>a month</span>
            <em>=</em>
            <span className="sum-hi"><b>{formatPounds(target.monthly)}</b>a month</span>
          </div>
          <p className="sum-year">
            That&rsquo;s <strong>{formatPounds(target.yearly)} a year</strong> in ticket sales. Imagine what we could achieve together.
          </p>
          {progress !== null && (
            <div className="progress">
              <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={L.supporterTarget}
                aria-valuenow={L.currentSupporters ?? 0} aria-label="Supporters so far">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p><strong>{L.currentSupporters}</strong> of {L.supporterTarget} supporters so far</p>
            </div>
          )}
          <p className="stretch">
            Next stop: <strong>{L.stretchTarget} supporters</strong> &mdash; {formatPounds(stretch.yearly)} a year.
            <span> Figures are ticket sales before prizes and running costs.</span>
          </p>
        </div>
      </section>

      {/* ---- Results & updates ---- */}
      <section id="results" className="band news" aria-label="Results and updates">
        <div className="in news-grid">
          <div className="card">
            <h2><Trophy aria-hidden /> {L.drawName} results</h2>
            {draws.length === 0 ? (
              <div className="empty">
                <div className="empty-balls"><Ball n={1} size="sm" /><Ball n={2} size="sm" /><Ball n={3} size="sm" /></div>
                <p>
                  {firstDraw ? <>The first draw is on <strong>{firstDraw}</strong>.</> : <>The first draw date will be announced soon.</>}{' '}
                  Our first winners will appear right here.
                </p>
              </div>
            ) : (
              draws.slice(0, 3).map((g) => (
                <div className="draw" key={g.draw}>
                  <h3>{g.draw}</h3>
                  <ul>
                    {g.results.map((w) => (
                      <li key={w.place}>
                        <Ball n={w.place} size="sm" />
                        <span className="w-name">{w.name}</span>
                        <span className="w-ticket">No. {String(w.ticket).padStart(4, '0')}</span>
                        {w.amountPence !== undefined && <span className="w-amt">{formatPounds(w.amountPence)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <h2><Heart aria-hidden /> What we&rsquo;ve achieved together</h2>
            {L.updates.length === 0 ? (
              <div className="empty">
                <p>
                  Every quarter we&rsquo;ll share what your tickets have helped fund, with photos of the difference
                  it&rsquo;s made at the Hub.
                </p>
              </div>
            ) : (
              <ul className="updates">
                {L.updates.slice(0, 3).map((u) => (
                  <li key={u.title}>
                    {u.image && (
                      <div className="u-img"><Image src={u.image} alt="" fill sizes="120px" /></div>
                    )}
                    <div>
                      <span className="u-when">{u.when}</span>
                      <h3>{u.title}</h3>
                      <p>{u.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ---- Existing members ---- */}
      <section className="band members" aria-labelledby="members-h">
        <div className="in">
          <div className="members-card">
            <span className="members-badge" aria-hidden>100</span>
            <div>
              <h2 id="members-h">Already in the 100 Club? Thank you!</h2>
              <p>
                Your support has helped keep the Hub going for years. The 100 Club is becoming the {L.name}, and
                we&rsquo;ll be in touch personally about moving your membership across. Questions in the meantime?
                Email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="band faq" aria-labelledby="faq-h">
        <div className="in narrow">
          <p className="eyebrow">Questions</p>
          <h2 id="faq-h">Good to know</h2>
          <div className="faq-list">
            <details>
              <summary>Who can join?</summary>
              <p>Anyone aged 16 or over. Friends and family outside the village are welcome to support the Hub too.</p>
            </details>
            <details>
              <summary>How much does it cost?</summary>
              <p>{price} a month for each ticket. Tickets must be paid for before the draw they&rsquo;re entered into.</p>
            </details>
            <details>
              <summary>How is the draw made?</summary>
              <p>
                Three winning numbers are drawn at random from all paid-up tickets {L.drawSchedule ?? 'every month'}.
                Results are published on this page.
              </p>
            </details>
            <details>
              <summary>How will I know if I&rsquo;ve won?</summary>
              <p>We&rsquo;ll contact winners directly using the details you gave when you joined, and arrange payment of your prize.</p>
            </details>
            <details>
              <summary>Where does the money go?</summary>
              <p>
                After prizes and running costs, the money raised supports Bishops Hull Hub (Registered Charity
                No. 1176851): its upkeep, improvements and community activities. We report back on what it has
                funded <a href="#results">right here</a>.
              </p>
            </details>
            <details>
              <summary>Can I stop at any time?</summary>
              <p>Yes. Just email <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a> and we&rsquo;ll stop your entry.</p>
            </details>
          </div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="finale">
        <div className="in">
          <h2>Your village. Your Hub. <span>Your lottery.</span></h2>
          <p>Every ticket counts. Every contribution helps. And you could be one of our next lucky winners!</p>
          <div className="cta-row center">
            <JoinButton className="btn btn--dark" />
            <Link className="text-link" href="/community">More ways to support the Hub <ArrowRight aria-hidden /></Link>
          </div>
        </div>
      </section>

      {/* ---- Small print ---- */}
      <footer className="small-print">
        <div className="in">
          <p>
            The {L.name} is promoted by Bishops Hull Hub, Registered Charity No. 1176851
            {L.registration ? <>, and registered with Somerset Council as a small society lottery (ref. {L.registration})</> : null}.
            {L.promoter ? <> Promoter: {L.promoter}.</> : null} You must be 16 or over to play.
            {L.rulesUrl ? <> <a href={L.rulesUrl}>Read the full rules</a>.</> : null}
          </p>
          <p>
            Please play responsibly. For free, confidential support call the National Gambling Helpline on{' '}
            <a href="tel:08088020133">0808 8020 133</a> or visit <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer">GamCare</a>.
          </p>
          <p><Mail aria-hidden /> <a href={`mailto:${L.contactEmail}`}>{L.contactEmail}</a></p>
        </div>
      </footer>
    </div>
  );
}
