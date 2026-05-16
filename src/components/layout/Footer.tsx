import Link from 'next/link';
import { Mail, MapPin, Facebook, Instagram, Phone } from 'lucide-react';
import { SITE_CONTACT } from '@/lib/site-contact';

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80 py-14 border-t border-background/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="md:col-span-1 space-y-4">
            <h3 className="text-lg font-headline font-bold text-background">Bishops Hull Hub</h3>
            <p className="text-sm leading-relaxed text-background/60">
              The heart of our village community. A purpose-built hub for events, activities, and local connection.
            </p>
            <span className="inline-block text-xs text-background/40 bg-background/10 px-3 py-1 rounded-full">
              Registered Charity · England &amp; Wales
            </span>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-background uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-background/70">Bishops Hull Hill, Taunton TA1 5EB</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a
                  href="mailto:bhhubbookings@gmail.com"
                  className="text-background/70 hover:text-background transition-colors hover:underline"
                >
                  bhhubbookings@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-background/70">
                  <a
                    href={SITE_CONTACT.telHref}
                    className="hover:text-background transition-colors hover:underline font-medium"
                  >
                    {SITE_CONTACT.name} — {SITE_CONTACT.displayPhone}
                  </a>
                  <span className="block text-[11px] text-background/50 mt-0.5">
                    {SITE_CONTACT.notForBookings}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-background uppercase tracking-wider">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {[
                { label: 'Home', href: '/' },
                { label: "What's On", href: '/whats-on' },
                { label: 'Hire the Hub', href: '/hire' },
                { label: 'Community', href: '/community' },
                { label: 'FAQs', href: '/faq' },
                { label: 'Bouncy Castles', href: '/bouncy-castles' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Hire Agreement', href: '/hire-agreement' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-background uppercase tracking-wider">Follow Us</h3>
            <p className="text-sm text-background/60 leading-relaxed">
              Stay up to date with events, news, and community updates.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.facebook.com/BishopsHullHub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-sm font-medium text-background/70 hover:text-background transition-colors group"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 group-hover:bg-[#1877F2]/20 transition-colors">
                  <Facebook className="h-4 w-4 text-background group-hover:text-[#1877F2] transition-colors" />
                </span>
                Facebook
              </a>
              <a
                href="https://www.instagram.com/bishopshullhub/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-sm font-medium text-background/70 hover:text-background transition-colors group"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 group-hover:bg-pink-500/20 transition-colors">
                  <Instagram className="h-4 w-4 text-background group-hover:text-pink-400 transition-colors" />
                </span>
                Instagram
              </a>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-background/40">
          <p>© {new Date().getFullYear()} Bishops Hull Hub. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-background/70 transition-colors">Privacy Statement</Link>
            <Link href="/hire-agreement" className="hover:text-background/70 transition-colors">Hire Agreement</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
