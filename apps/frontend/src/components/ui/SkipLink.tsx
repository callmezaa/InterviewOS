'use client';

import React from 'react';

export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-[13px] focus:font-semibold focus:outline-none focus:shadow-lg focus:shadow-primary/30 focus:ring-2 focus:ring-white/30"
    >
      Skip to main content
    </a>
  );
};
