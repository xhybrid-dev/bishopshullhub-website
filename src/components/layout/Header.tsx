"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFirebase, initiateAnonymousSignIn } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, auth, isUserLoading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Wait for the persisted-session check to complete before deciding to
    // sign in anonymously. Otherwise an admin who just refreshed the page
    // would get clobbered by anonymous auth before their stored token has
    // a chance to rehydrate.
    if (isUserLoading) return;
    if (!user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth, isUserLoading]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: "What's On", href: '/whats-on' },
    { name: 'Hire the Hub', href: '/hire' },
    { name: 'Community', href: '/community' },
    { name: 'Hub Garden', href: '/garden-gallery' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Find Us', href: '/find-us' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    setIsOpen(false);
  };

  // Auth-dependent UI should only show after mount to prevent hydration errors
  const isRealUser = mounted && user && !user.isAnonymous;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <span className="font-marker text-xl text-primary transition-colors group-hover:text-primary/80">
            Bishops Hull Hub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-all duration-200 rounded-full px-3 py-1",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                )}
              >
                {link.name}
              </Link>
            );
          })}
          
          <div className="h-6 w-px bg-border mx-2" />

          {mounted ? (
            <>
              {isRealUser ? (
                <div className="flex items-center gap-4">
                  <Button asChild variant="ghost" size="sm" className="gap-2 text-primary">
                    <Link href="/admin"><ShieldCheck className="h-4 w-4" /> Admin</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="w-20" /> /* Placeholder to maintain layout during hydration */
          )}

          <div className="relative">
            <span className="absolute inset-0 rounded-md bg-primary/30 animate-ping" style={{ animationIterationCount: 3 }} />
            <Button
              asChild
              variant="default"
              className="relative bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 text-white font-bold shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 hover:scale-105 transition-all duration-200 border-0"
            >
              <Link href="/hire#booking-form">Book the Hub</Link>
            </Button>
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          "md:hidden fixed inset-x-0 top-20 bg-background border-b border-border px-4 py-6 space-y-4 transition-all duration-300 ease-in-out shadow-2xl",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        {navLinks.map((link) => {
          const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block text-lg font-medium py-3 border-b border-muted last:border-0 transition-colors",
                isActive ? "text-primary" : "hover:text-primary"
              )}
            >
              {link.name}
            </Link>
          );
        })}
        
        <div className="pt-4 space-y-3">
          {mounted && (
            <>
              {isRealUser ? (
                <>
                  <Button asChild variant="outline" className="w-full gap-2 justify-start" onClick={() => setIsOpen(false)}>
                    <Link href="/admin"><ShieldCheck className="h-5 w-5" /> Admin Portal</Link>
                  </Button>
                  <Button variant="ghost" className="w-full gap-2 justify-start text-destructive" onClick={handleLogout}>
                    <LogOut className="h-5 w-5" /> Sign Out
                  </Button>
                </>
              ) : null}
            </>
          )}
          <Button
            asChild
            className="w-full h-12 text-lg shadow-lg bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 font-bold border-0"
            onClick={() => setIsOpen(false)}
          >
            <Link href="/hire#booking-form">Book the Hub</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}