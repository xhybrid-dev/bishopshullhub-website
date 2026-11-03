"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  GROTTO_GENDERS,
  GROTTO_MAX_CHILDREN,
  GROTTO_START_ISO,
  GROTTO_TICKET_PRICE_PENCE,
} from '@/lib/santa-grotto';
import { ArrowRight, CalendarDays, Clock, Coffee, Gift, Lock, Plus, Scissors, X } from 'lucide-react';
import { HatIcon } from './SantaFigure';
import Sleigh from './Sleigh';
import Snowfall from './Snowfall';
import WinterScene from './WinterScene';
import './santa-grotto.css';

interface Child {
  id: number;
  name: string;
  age: string;
  gender: string;
}

const money = (p: number) => `£${(p / 100).toFixed(2)}`;
const shortMoney = (p: number) => (p % 100 === 0 ? `£${p / 100}` : money(p));
const newChild = (id: number): Child => ({ id, name: '', age: '', gender: '' });

const UNITS = ['Sleeps', 'Hours', 'Mins', 'Secs'] as const;

function Countdown() {
  // Starts null so server and client markup match; filled in after mount.
  const [secs, setSecs] = useState<number | null>(null);
  useEffect(() => {
    const target = new Date(GROTTO_START_ISO).getTime();
    const tick = () => setSecs(Math.floor(Math.max(0, target - Date.now()) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const vals =
    secs === null
      ? null
      : [Math.floor(secs / 86400), Math.floor((secs % 86400) / 3600), Math.floor((secs % 3600) / 60), secs % 60];
  return (
    <>
      <div className="baubles" role="timer" aria-label="Countdown to the Grotto">
        {UNITS.map((unit, i) => (
          <div className="bauble" key={unit}>
            <i />
            <div>
              <b>{vals ? (i === 0 ? vals[0] : String(vals[i]).padStart(2, '0')) : '–'}</b>
              <span>{unit}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="cd-label">{secs === 0 ? 'Santa has arrived at the Hub!' : 'until Santa arrives at the Hub'}</p>
    </>
  );
}

const FEATURES = [
  { Icon: HatIcon, title: 'Meet Santa', text: 'A one-to-one chat with Santa in his grotto.' },
  { Icon: Scissors, title: 'Festive crafts', text: 'Make something festive to take home.' },
  { Icon: Coffee, title: 'Winter café', text: 'Home-baked Christmas treats and coffee.' },
  { Icon: Gift, title: 'A gift from Santa', text: 'Every child leaves with a little something.' },
];

export default function SantaGrotto() {
  const [parent, setParent] = useState({ name: '', email: '', phone: '' });
  const [kids, setKids] = useState<Child[]>([newChild(1)]);
  const [nextId, setNextId] = useState(2);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/christmas2026/availability')
      .then((r) => r.json())
      .then((j) => typeof j.remaining === 'number' && setRemaining(j.remaining))
      .catch(() => {});
  }, []);
  const maxKids = Math.min(GROTTO_MAX_CHILDREN, remaining ?? GROTTO_MAX_CHILDREN);
  const soldOut = remaining === 0;

  const updateKid = (id: number, patch: Partial<Child>) =>
    setKids((ks) => ks.map((k) => (k.id === id ? { ...k, ...patch } : k)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/christmas2026/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent,
          children: kids.map(({ name, age, gender }) => ({ name, age, gender })),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) {
        window.location.href = j.url;
        return;
      }
      throw new Error(j.error || 'Something went wrong.');
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <div className="grotto">
      <header className="hero">
        <div className="bunting" aria-hidden="true" />
        <div className="moon" aria-hidden="true" />
        <Sleigh />
        <Snowfall />
        <div className="in">
          <p className="eyebrow">Christmas at Bishops Hull Hub</p>
          <h1>Santa’s <span>Grotto</span></h1>
          <p className="lede">
            Visit Santa in his grotto, make something festive, warm up in the winter café and take home a little gift.
          </p>
          <ul className="facts">
            <li><i><CalendarDays aria-hidden="true" /></i> Saturday 12 December</li>
            <li><i><Clock aria-hidden="true" /></i> 10am – 12pm</li>
            <li><i><HatIcon /></i> Arrive by 11am to see Santa</li>
          </ul>
          <div className="cta-row">
            <a className="btn" href="#book">
              {soldOut ? 'Fully booked' : 'Book a visit'} <ArrowRight aria-hidden="true" />
            </a>
            <span className="price">{shortMoney(GROTTO_TICKET_PRICE_PENCE)} per child</span>
          </div>
        </div>
        <WinterScene />
      </header>

      <section className="sec">
        <div className="in">
          <Countdown />

          <h2 className="feat-h">What to expect</h2>
          <div className="feat">
            {FEATURES.map(({ Icon, title, text }) => (
              <div className="tagw" key={title}>
                <div className="tag">
                  <Icon aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="find">
            <figure className="polaroid">
              <Image
                src="/images/hub-christmas.webp"
                alt="Bishops Hull Hub in the snow, with a Christmas tree glowing in the doorway, fairy lights along the roof and reindeer in the foreground"
                width={2000}
                height={1116}
                sizes="(min-width: 1024px) 560px, 100vw"
              />
            </figure>
            <div>
              <h3>Find us at the Hub</h3>
              <p>Bishops Hull Playing Field, Bishops Hull Hill, Taunton TA1 5EB</p>
              <p>Please arrive before 11am so Santa can see everyone.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="book" id="book">
        <div className="in">
          <div className="card">
            <div className="card-h">
              <h2>Book your visit to Santa</h2>
              <p>
                One ticket per child, {money(GROTTO_TICKET_PRICE_PENCE)} each. Fill in your details and we’ll send you
                to Stripe to pay safely.
              </p>
              {remaining !== null && remaining > 0 && remaining <= 20 && (
                <p className="places">Only {remaining} place{remaining === 1 ? '' : 's'} left!</p>
              )}
            </div>
            {soldOut ? (
              <p className="soldout">
                Sorry, the Santa Grotto is fully booked. Please check back in case places are released.
              </p>
            ) : (
              <form onSubmit={submit} noValidate>
                <fieldset>
                  <legend>Grown-up’s details</legend>
                  <div className="grid3">
                    <div>
                      <label htmlFor="pname">Your name</label>
                      <input id="pname" autoComplete="name" required value={parent.name}
                        onChange={(e) => setParent({ ...parent, name: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="pemail">Email</label>
                      <input id="pemail" type="email" autoComplete="email" required value={parent.email}
                        onChange={(e) => setParent({ ...parent, email: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="pphone">Phone</label>
                      <input id="pphone" type="tel" autoComplete="tel" required value={parent.phone}
                        onChange={(e) => setParent({ ...parent, phone: e.target.value })} />
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>Who’s visiting Santa?</legend>
                  {kids.map((k, i) => (
                    <div className="kid" key={k.id}>
                      <div className="kid-h">
                        <span className="kid-n">Child {i + 1}</span>
                        {kids.length > 1 && (
                          <button type="button" className="rm" aria-label={`Remove child ${i + 1}`}
                            onClick={() => setKids((ks) => ks.filter((x) => x.id !== k.id))}>
                            <X aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      <div className="kgrid">
                        <div>
                          <label htmlFor={`cn${k.id}`}>Child’s name</label>
                          <input id={`cn${k.id}`} required value={k.name}
                            onChange={(e) => updateKid(k.id, { name: e.target.value })} />
                        </div>
                        <div>
                          <label htmlFor={`ca${k.id}`}>Age</label>
                          <input id={`ca${k.id}`} type="number" min={0} max={17} inputMode="numeric" required value={k.age}
                            onChange={(e) => updateKid(k.id, { age: e.target.value })} />
                        </div>
                        <div>
                          <label htmlFor={`cg${k.id}`}>Gender</label>
                          <select id={`cg${k.id}`} required value={k.gender}
                            onChange={(e) => updateKid(k.id, { gender: e.target.value })}>
                            <option value="">Choose…</option>
                            {GROTTO_GENDERS.map((g) => <option key={g}>{g}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {kids.length < maxKids && (
                    <button type="button" className="add"
                      onClick={() => { setKids((ks) => [...ks, newChild(nextId)]); setNextId(nextId + 1); }}>
                      <Plus aria-hidden="true" /> Add another child
                    </button>
                  )}
                </fieldset>

                <div className="tot">
                  <span>
                    {kids.length} ticket{kids.length === 1 ? '' : 's'} × {money(GROTTO_TICKET_PRICE_PENCE)}
                  </span>
                  <strong>{money(kids.length * GROTTO_TICKET_PRICE_PENCE)}</strong>
                </div>
                <button className="go" type="submit" disabled={busy}>
                  {busy ? 'Wrapping your tickets…' : <><Lock aria-hidden="true" /> Pay &amp; book with Stripe</>}
                </button>
                <div className="err" role="alert">{error}</div>
                <p className="note">Secure payment by Stripe. Arrive before 11am so Santa can see everyone.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="trees" aria-hidden="true" />
        <div className="in">
          <p>Merry Christmas from all of us at the Hub</p>
          <small>Bishops Hull Playing Field, Bishops Hull Hill, Taunton TA1 5EB</small>
        </div>
      </footer>
    </div>
  );
}
