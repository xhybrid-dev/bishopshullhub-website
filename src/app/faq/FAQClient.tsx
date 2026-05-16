'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FAQItem from '@/components/FAQItem';
import FAQCategoryNav from '@/components/FAQCategoryNav';
import { Search, X, Loader2, Phone } from 'lucide-react';
import { SITE_CONTACT } from '@/lib/site-contact';
import HireJourneyAccordion from '@/components/HireJourneyAccordion';
import { useFirebase } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

/* ── TYPES & CONFIG ───────────────────────────────────────────────── */
export type FAQCategory = 'venue' | 'hire' | 'access' | 'safety' | 'rules';

export interface FAQEntry {
  id: string;
  cat: FAQCategory;
  q: string;
  a: string;
}

export const CATEGORIES = [
  { id: 'all'    as const, label: 'All Questions',    color: 'hsl(171,44%,38%)' },
  { id: 'venue'  as const, label: 'The Venue',        color: 'hsl(171,44%,38%)' },
  { id: 'hire'   as const, label: 'During Your Hire', color: 'hsl(197,55%,42%)' },
  { id: 'access' as const, label: 'Access & Parking', color: 'hsl(43,65%,48%)'  },
  { id: 'safety' as const, label: 'Safety',           color: 'hsl(0,68%,52%)'   },
  { id: 'rules'  as const, label: 'Rules & Policies', color: 'hsl(133,55%,38%)' },
];

export const CAT_COLORS: Record<string, string> = {
  venue:  'hsl(171,44%,38%)',
  hire:   'hsl(197,55%,42%)',
  access: 'hsl(43,65%,48%)',
  safety: 'hsl(0,68%,52%)',
  rules:  'hsl(133,55%,38%)',
};

type TransitionPhase = 'idle' | 'exiting' | 'entering';
type CategoryId = 'all' | FAQCategory;

/* ══════════════════════════════════════════════════════════════════
   CLIENT COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function FAQClient() {
  const [activeCategory,   setActiveCategory]   = useState<CategoryId>('all');
  const [search,           setSearch]           = useState('');
  const [phase,            setPhase]            = useState<TransitionPhase>('idle');
  const [displayedFaqs,    setDisplayedFaqs]    = useState<FAQEntry[]>([]);
  const [openId,           setOpenId]           = useState<string | null>(null);
  const [toast,            setToast]            = useState(false);
  const [flash,            setFlash]            = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [allFaqsData,      setAllFaqsData]      = useState<FAQEntry[] | null>(null);
  const [loadingFaqs,      setLoadingFaqs]      = useState(true);

  const questionsRef  = useRef<HTMLDivElement>(null);
  const pendingRef    = useRef<{ cat: CategoryId; search: string } | null>(null);
  const allFaqsRef    = useRef<FAQEntry[]>([]);
  const activeCatRef  = useRef<CategoryId>('all');
  const searchTextRef = useRef('');

  const { firestore } = useFirebase();

  /* Filter — reads from ref so the function stays stable */
  const computeFaqs = useCallback((cat: CategoryId, q: string): FAQEntry[] => {
    return allFaqsRef.current.filter(f => {
      const matchCat    = cat === 'all' || f.cat === cat;
      const matchSearch = !q || f.q.toLowerCase().includes(q.toLowerCase()) || f.a.toLowerCase().includes(q.toLowerCase());
      return matchCat && matchSearch;
    });
  }, []);

  /* Fetch FAQs directly — bypasses errorEmitter so a permission/missing-rules
     error shows an empty list instead of crashing the page. */
  useEffect(() => {
    const q = query(collection(firestore, 'faqs'), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const faqs = snap.docs.map(d => ({ ...d.data(), id: d.id })) as FAQEntry[];
        allFaqsRef.current = faqs;
        setAllFaqsData(faqs);
        setDisplayedFaqs(computeFaqs(activeCatRef.current, searchTextRef.current));
        setLoadingFaqs(false);
      },
      (err) => {
        console.error('FAQs unavailable:', err.message);
        setAllFaqsData([]);
        setLoadingFaqs(false);
      }
    );
    return () => unsub();
  }, [firestore, computeFaqs]);

  /* 3D corridor transition */
  const triggerTransition = useCallback((newCat: CategoryId, newSearch: string) => {
    if (phase !== 'idle') {
      setDisplayedFaqs(computeFaqs(newCat, newSearch));
      setPhase('idle');
      return;
    }
    pendingRef.current = { cat: newCat, search: newSearch };
    setPhase('exiting');
    setFlash(true);
    setTimeout(() => setFlash(false), 120);

    setTimeout(() => {
      const next = pendingRef.current!;
      setDisplayedFaqs(computeFaqs(next.cat, next.search));
      setOpenId(null);
      setPhase('entering');
      setTimeout(() => setPhase('idle'), 560);
    }, 360);
  }, [phase, computeFaqs]);

  /* Category click */
  const handleCatClick = useCallback((catId: CategoryId) => {
    activeCatRef.current = catId;
    searchTextRef.current = '';
    setActiveCategory(catId);
    setSearch('');
    triggerTransition(catId, '');
    if (catId !== 'all') {
      setSidebarCollapsed(true);
      setTimeout(() => {
        if (questionsRef.current) {
          const y = questionsRef.current.getBoundingClientRect().top + window.scrollY - 72;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 440);
    } else {
      setSidebarCollapsed(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [triggerTransition]);

  /* Search */
  const handleSearch = useCallback((val: string) => {
    searchTextRef.current = val;
    setSearch(val);
    triggerTransition(activeCatRef.current, val);
    if (!val) setSidebarCollapsed(false);
  }, [triggerTransition]);

  /* Accordion */
  const handleToggle = useCallback((id: string) => {
    setOpenId(prev => prev === id ? null : id);
  }, []);

  /* Copy deep link */
  const handleCopy = useCallback((id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#faq-${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast(true);
      setTimeout(() => setToast(false), 2200);
    });
  }, []);

  /* Deep-link on load */
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('faq-')) {
      const idStr = hash.replace('faq-', '');
      setOpenId(idStr);
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 700);
    }
  }, []);

  /* Counts */
  const counts = useMemo(() => {
    const source = allFaqsData ?? [];
    const c: Record<string, number> = { all: source.length };
    source.forEach(f => { c[f.cat] = (c[f.cat] || 0) + 1; });
    return c;
  }, [allFaqsData]);

  /* Active category meta */
  const activeMeta = CATEGORIES.find(c => c.id === activeCategory) ?? CATEGORIES[0];

  /* Grouped display */
  const grouped = useMemo(() => {
    if (activeCategory !== 'all' || search) {
      return [{
        catId: activeCategory,
        label: search ? `Results for "${search}"` : activeMeta.label,
        color: activeMeta.color,
        faqs:  displayedFaqs,
      }];
    }
    return CATEGORIES
      .filter(c => c.id !== 'all')
      .map(c => ({
        catId: c.id,
        label: c.label,
        color: c.color,
        faqs:  displayedFaqs.filter(f => f.cat === c.id),
      }))
      .filter(g => g.faqs.length > 0);
  }, [displayedFaqs, activeCategory, search, activeMeta]);

  const phaseClass =
    phase === 'exiting' ? 'faq-phase-exit' :
    phase === 'entering' ? 'faq-phase-enter' :
    'faq-phase-idle';

  return (
    <>
      {/* Portal flash */}
      <div className={cn('faq-portal-flash', flash && 'faq-portal-flash--active')} />

      {/* Toast */}
      <div className={cn('faq-toast', toast && 'faq-toast--show')}>
        Link copied ✓
      </div>

      {/* ── HERO ── */}
      <section className="container mx-auto px-4 pt-8 pb-6 text-center max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-headline font-bold tracking-tight text-foreground mb-2">
          Frequently Asked{' '}
          <span className="text-primary">Questions</span>
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
          Everything you need to know about hiring and using the Bishops Hull Hub.
        </p>

        {/* Search bar */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-full py-3.5 pl-11 pr-11 text-base text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {search && (
          <p className="mt-3 text-sm text-muted-foreground">
            {displayedFaqs.length === 0
              ? 'No results found.'
              : `${displayedFaqs.length} question${displayedFaqs.length !== 1 ? 's' : ''} found`}
          </p>
        )}
      </section>

      {/* ── HIRE JOURNEY ACCORDION ── */}
      <div className="container mx-auto px-4 max-w-6xl mb-8">
        <HireJourneyAccordion />
      </div>

      {/* ── BODY ── */}
      <div className="container mx-auto px-4 pb-24 max-w-6xl flex flex-col md:flex-row gap-8 md:gap-10 items-start">

        {/* Sidebar */}
        <FAQCategoryNav
          categories={CATEGORIES}
          counts={counts}
          activeCategory={activeCategory}
          collapsed={sidebarCollapsed}
          onSelect={handleCatClick}
          onExpand={() => { setSidebarCollapsed(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          searchActive={!!search}
        />

        {/* Questions */}
        <div ref={questionsRef} className="flex-1 min-w-0">
          {loadingFaqs && displayedFaqs.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className={cn('faq-stage', phaseClass)}>
              <div className="faq-list-inner">
                {displayedFaqs.length === 0 && search ? (
                  <div className="text-center py-20 bg-card rounded-2xl border border-border">
                    <p className="text-4xl mb-4 text-border">◈</p>
                    <p className="font-bold text-lg text-muted-foreground mb-2">
                      No results for &ldquo;{search}&rdquo;
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try different keywords, or browse by category.
                    </p>
                  </div>
                ) : displayedFaqs.length === 0 ? (
                  <div className="text-center py-20 bg-card rounded-2xl border border-border">
                    <p className="text-4xl mb-4 text-border">◈</p>
                    <p className="font-bold text-lg text-muted-foreground">
                      No FAQs available yet.
                    </p>
                  </div>
                ) : (
                  grouped.map(group => (
                    <div
                      key={group.catId}
                      id={`cat-${group.catId}`}
                      className="mb-10 scroll-mt-20"
                    >
                      {/* Category heading */}
                      <div className="flex items-center gap-3 mb-5">
                        <div
                          className="w-1 h-7 rounded-full flex-shrink-0"
                          style={{ background: group.color }}
                        />
                        <h2
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: group.color }}
                        >
                          {group.label}
                        </h2>
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-semibold">
                          {group.faqs.length} {group.faqs.length === 1 ? 'question' : 'questions'}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-3 faq-items-list">
                        {group.faqs.map(faq => (
                          <div key={faq.id} className="faq-item-wrap">
                            <FAQItem
                              faq={faq}
                              isOpen={openId === faq.id}
                              onToggle={handleToggle}
                              onCopy={handleCopy}
                              searchTerm={search}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTACT CTA ── */}
      <section className="bg-gradient-to-br from-primary via-primary to-teal-600 text-primary-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/15 border border-white/25 mb-2">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold">Still have questions?</h2>
          <p className="text-lg opacity-85 leading-relaxed">
            If you could not find what you were looking for, our volunteer bookings secretary will be happy to help.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-base rounded-xl h-14 px-8 font-bold shadow-lg">
            <a href="mailto:bhhubbookings@gmail.com">
              Contact the Bookings Secretary
            </a>
          </Button>
          <p className="text-sm opacity-50">
            bhhubbookings@gmail.com · We aim to reply within 3 working days
          </p>

          <div className="mt-6 pt-6 border-t border-white/20 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-75 mb-2">
              <Phone className="h-3.5 w-3.5" /> Already On-Site?
            </div>
            <p className="text-sm opacity-90 mb-3">
              For issues <span className="font-bold">during your hire</span>, call {SITE_CONTACT.name}:
            </p>
            <a
              href={SITE_CONTACT.telHref}
              className="inline-block text-2xl font-bold tracking-wide bg-white/15 border border-white/30 rounded-xl px-6 py-3 hover:bg-white/25 transition-colors"
            >
              {SITE_CONTACT.displayPhone}
            </a>
            <p className="text-xs opacity-60 mt-3 font-medium">
              {SITE_CONTACT.notForBookings}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
