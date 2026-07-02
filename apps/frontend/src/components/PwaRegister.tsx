'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (window.location.hostname === 'localhost') return;

    let registered = false;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        registered = true;
        console.log('[PWA] Service worker registered', reg.scope);
      } catch (err) {
        console.warn('[PWA] Service worker registration failed', err);
      }
    };

    const handleLoad = () => {
      if (!registered) register();
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return null;
}
