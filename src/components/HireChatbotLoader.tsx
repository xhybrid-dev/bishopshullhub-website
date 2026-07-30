'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// The assistant is mounted on every route but is never part of the first
// screenful, so it has no business in the initial bundle. Loading it once the
// browser is idle keeps it available well before anyone reaches for it.
const HireChatbot = dynamic(() => import('@/components/HireChatbot'), { ssr: false });

export default function HireChatbotLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const idle = window.requestIdleCallback;
    if (typeof idle === 'function') {
      const handle = idle(() => setReady(true), { timeout: 3000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return ready ? <HireChatbot /> : null;
}
