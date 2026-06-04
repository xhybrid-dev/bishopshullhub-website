'use client';

import { Mail, ChevronDown, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAT_COLORS } from '@/app/faq/FAQClient';
import { SITE_CONTACT } from '@/lib/site-contact';

type CategoryId = 'all' | 'venue' | 'hire' | 'access' | 'safety' | 'rules';

interface Category {
  id: CategoryId;
  label: string;
  color: string;
}

interface FAQCategoryNavProps {
  categories: Category[];
  counts: Record<string, number>;
  activeCategory: CategoryId;
  collapsed: boolean;
  searchActive: boolean;
  onSelect: (id: CategoryId) => void;
  onExpand: () => void;
}

export default function FAQCategoryNav({
  categories,
  counts,
  activeCategory,
  collapsed,
  searchActive,
  onSelect,
  onExpand,
}: FAQCategoryNavProps) {
  const activeLabel = categories.find(c => c.id === activeCategory)?.label ?? 'All Questions';

  return (
    <aside
      className={cn(
        'faq-sidebar md:sticky md:top-20 md:h-fit w-full md:w-56 flex-shrink-0 transition-all duration-500',
        collapsed ? 'faq-sidebar--collapsed' : ''
      )}
    >
      {/* Collapsed state — pill showing active category */}
      {collapsed && (
        <button
          onClick={onExpand}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-card border border-border rounded-2xl shadow-sm text-sm font-semibold text-primary mb-3 hover:border-primary/30 transition-all"
        >
          <span className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: CAT_COLORS[activeCategory] ?? 'var(--primary)' }}
            />
            {activeLabel}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Expanded state */}
      <div
        className={cn(
          'bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-500',
          collapsed ? 'faq-sidebar-panel--hidden' : 'faq-sidebar-panel--visible'
        )}
      >
        <div className="p-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">
            Categories
          </p>
          <nav className="flex flex-col gap-1">
            {categories.map(cat => {
              const isActive = activeCategory === cat.id && !searchActive;
              const dotColor = cat.id === 'all' ? 'hsl(171,44%,38%)' : CAT_COLORS[cat.id] ?? 'hsl(171,44%,38%)';
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-transparent text-left text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold border-primary/10'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: dotColor }}
                  />
                  {cat.label}
                  <span
                    className={cn(
                      'ml-auto text-[0.68rem] font-semibold px-1.5 py-0.5 rounded-full',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {counts[cat.id] ?? 0}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border my-3" />

          <a
            href="mailto:booking@bishopshullhub.co.uk"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/7 border border-primary/15 text-primary text-sm font-semibold hover:bg-primary/12 transition-colors"
          >
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            Ask a question
          </a>

          <a
            href={SITE_CONTACT.telHref}
            className="block mt-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-amber-900 text-sm font-semibold">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              On-site issue? Call {SITE_CONTACT.name}
            </div>
            <div className="text-xs font-bold text-amber-900 mt-0.5 ml-5">
              {SITE_CONTACT.displayPhone}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5 ml-5 leading-tight">
              {SITE_CONTACT.notForBookings}
            </div>
          </a>
        </div>
      </div>

      {/* Tip card */}
      <div className="mt-3 px-3 py-3 rounded-xl bg-accent/10 border border-accent/25">
        <p className="text-[0.72rem] font-semibold text-secondary-foreground mb-0.5">Tip</p>
        <p className="text-[0.72rem] text-muted-foreground leading-relaxed">
          Click a category to step through the hub — each filter transports you into a new space.
        </p>
      </div>
    </aside>
  );
}
