'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/** Floating "back to top" button that only appears once the page is scrolled. */
export function ScrollToTopButton({ threshold = 300 }: { threshold?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Go to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-20 right-6 sm:bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/30 transition-all duration-200 hover:bg-violet-500 hover:scale-110 active:scale-95 ${
        show ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-3'
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
