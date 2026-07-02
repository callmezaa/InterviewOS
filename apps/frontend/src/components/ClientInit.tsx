'use client';

import { useEffect } from 'react';
import { patchGlobalFetch } from '../lib/patchFetch';

export function ClientInit() {
  useEffect(() => {
    patchGlobalFetch();
  }, []);
  return null;
}
