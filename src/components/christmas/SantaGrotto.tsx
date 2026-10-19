"use client";

import { useEffect, useRef, useState } from 'react';
import {
  GROTTO_GENDERS,
  GROTTO_MAX_CHILDREN,
  GROTTO_START_ISO,
  GROTTO_TICKET_PRICE_PENCE,
} from '@/lib/santa-grotto';
import SantaPeek from './SantaPeek';
import './santa-grotto.css';

interface Child {
  id: number;
  name: string;
  age: string;
  gender: string;
}

const money = (p: number) => `£${(p / 100).toFixed(2)}`;
const newChild = (id: number): Child => ({ id, name: '', age: '', gender: '' });

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
  if (secs === null) return <div className="countdown" aria-hidden="true" />;
  const parts: Array<[string, number]> = [
    ['Days', Math.floor(secs / 86400)],
    ['Hours', Math.floor((secs % 86400) / 3600)],
    ['Mins', Math.floor((secs % 3600) / 60)],
    ['Secs', secs % 60],
  ];
  return (
    <div className="countdown" role="timer" aria-label="Countdown to the Grotto">
      {parts.map(([label, n]) => (
        <div key={label}>
          <b>{n}</b>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function Snow() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const flakes = Array.from({ length: 140 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: 1 + Math.random() * 4,
      s: 0.5 + Math.random() * 1.5,
      d: Math.random() * 6,
    }));
    const size = () => { c.width = innerWidth; c.height = innerHeight; };
    size();
    addEventListener('resize', size);
    let t = 0;
    let raf = 0;
    const frame = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      t += 0.01;
      for (const p of flakes) {
        p.y += p.s;
        p.x += Math.sin(t + p.d) * 0.6;
        if (p.y > c.height) { p.y = -5; p.x = Math.random() * c.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return <canvas id="snow" ref={ref} aria-hidden="true" />;
}

export default function SantaGrotto() {
  const [bulbs, setBulbs] = useState(0);
  const [parent, setParent] = useState({ name: '', email: '', phone: '' });
  const [kids, setKids] = useState<Child[]>([newChild(1)]);
  const [nextId, setNextId] = useState(2);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setBulbs(Math.ceil(innerWidth / 38)); }, []);

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
      setError(`🎅 ${ex instanceof Error ? ex.message : 'Something went wrong.'}`);
      setBusy(false);
    }
  };

  return (
    <div className="grotto">
      <Snow />
      <div className="lights" aria-hidden="true">
        {Array.from({ length: bulbs }, (_, i) => <i key={i} />)}
      </div>
      <div className="sleigh" aria-hidden="true"><span>🦌🦌🦌🦌🛷</span></div>

      <header className="hero">
        <div className="stars" aria-hidden="true">✨ ⭐ ✨ ⭐ ✨</div>
        <SantaPeek />
        <h1>Santa’s Grotto</h1>
        <div className="sub">at Bishops Hull Hub ❄️ Ho Ho Ho! ❄️</div>
        <div>
          <span className="badge">📅 Saturday 12th December</span>
          <span className="badge">🕙 10am – 12pm</span>
          <span className="badge">🎁 Arrive before 11 to see Santa!</span>
        </div>
        <Countdown />
        <p className="sub">sleeps until the magic begins! 🌟</p>
      </header>

      <div className="content">
        <div className="candy" aria-hidden="true" />
        <section className="cards" aria-label="What to expect">
          <div className="card"><div className="e">🎅</div><h3>Meet Santa</h3><p>A magical one-to-one chat with the big man himself.</p></div>
          <div className="card"><div className="e">🎨</div><h3>Magical Crafts</h3><p>Get stuck in with some festive, creative fun.</p></div>
          <div className="card"><div className="e">🎄</div><h3>Winter Wonderland</h3><p>Twinkling lights, snowy scenes and festive surprises.</p></div>
          <div className="card"><div className="e">🎁</div><h3>A Gift from Santa</h3><p>Every child leaves with a little something from the grotto.</p></div>
        </section>
        <div className="candy" aria-hidden="true" />

        <section className="panel" id="book">
          <h2>🎟️ Book Your Visit to Santa 🎟️</h2>
          <p style={{ textAlign: 'center' }}>
            One ticket per child. Fill in the details and we’ll send you to Stripe to pay safely.
          </p>
          <form onSubmit={submit} noValidate>
            <h3>🧑‍🎄 Grown-up details</h3>
            <div className="row">
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

            <h3>🧒 Little ones visiting Santa</h3>
            {kids.map((k, i) => (
              <div className="child" key={k.id}>
                {kids.length > 1 && (
                  <button type="button" className="remove" aria-label={`Remove child ${i + 1}`}
                    onClick={() => setKids((ks) => ks.filter((x) => x.id !== k.id))}>❌</button>
                )}
                <h4>🎁 Child {i + 1}</h4>
                <div className="row">
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
            {kids.length < GROTTO_MAX_CHILDREN && (
              <button type="button" className="add"
                onClick={() => { setKids((ks) => [...ks, newChild(nextId)]); setNextId(nextId + 1); }}>
                ➕ Add another child
              </button>
            )}

            <div className="total">
              <span>🎁 Total</span>
              <span>{kids.length} × {money(GROTTO_TICKET_PRICE_PENCE)} = {money(kids.length * GROTTO_TICKET_PRICE_PENCE)}</span>
            </div>
            <button className="go" type="submit" disabled={busy}>
              {busy ? '🎄 Wrapping your tickets…' : '🎅 Pay & Book with Stripe 🎅'}
            </button>
            <div className="err" role="alert">{error}</div>
            <p className="note">🔒 Secure payment by Stripe. Arrive before 11am so Santa can see everyone!</p>
          </form>
        </section>
      </div>

      <div className="grotto-foot">
        <div className="elves" aria-hidden="true">🧝 🎄 ⛄ 🎁 🔔 🍪 🥛 🧝‍♀️</div>
        <p>Merry Christmas from all of us at the Hub! 🎄</p>
      </div>
    </div>
  );
}
