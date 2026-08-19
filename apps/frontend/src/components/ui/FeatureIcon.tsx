'use client';

import React, { useId } from 'react';

export type FeatureIconName = 'activity' | 'cpu' | 'shield' | 'eye' | 'lock' | 'video' | 'code' | 'sparkles';

const GRADIENT_STOPS = (
  <>
    <stop stopColor="#2f9bff" />
    <stop offset="1" stopColor="#0055b3" />
  </>
);

function FeatureIcon({
  name,
  className,
}: {
  name: FeatureIconName;
  className?: string;
}) {
  const id = useId();
  const g = `${id}-g`;

  const icons: Record<FeatureIconName, React.ReactNode> = {
    activity: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5.5" fill={`url(#${g})`} />
        <path
          d="M4.5 12.5h3l2-4.8 3 9 2.2-4.2h4.8"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    cpu: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5.5" fill={`url(#${g})`} />
        <g fill="rgba(255,255,255,0.92)">
          <rect x="6.4" y="10" width="2" height="5.4" rx="1" />
          <rect x="9.6" y="7.4" width="2" height="10.6" rx="1" />
          <rect x="12.8" y="9" width="2" height="7.4" rx="1" />
          <rect x="16" y="11" width="2" height="3.6" rx="1" />
        </g>
      </svg>
    ),
    shield: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <path
          d="M12 2.6 19 5v6.2c0 4.6-3 7.6-7 9.2-4-1.6-7-4.6-7-9.2V5l7-2.4Z"
          fill={`url(#${g})`}
        />
        <path
          d="m8.8 11.6 2.2 2.2 4.2-4.4"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    eye: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="5.6" x2="12" y2="18.4" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <path
          d="M2.6 12S6 5.6 12 5.6 21.4 12 21.4 12 18 18.4 12 18.4 2.6 12 2.6 12Z"
          fill={`url(#${g})`}
        />
        <circle cx="12" cy="12" r="3.1" fill="rgba(255,255,255,0.95)" />
        <circle cx="12" cy="12" r="1.4" fill="#0055b3" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <path
          d="M7.5 10V7.6a4.5 4.5 0 0 1 9 0V10"
          stroke={`url(#${g})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect x="5.5" y="10" width="13" height="9.4" rx="3" fill={`url(#${g})`} />
        <circle cx="12" cy="14.1" r="1.55" fill="rgba(255,255,255,0.95)" />
        <rect x="11" y="14.6" width="2" height="2.9" rx="1" fill="rgba(255,255,255,0.95)" />
      </svg>
    ),
    video: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="7" x2="12" y2="17" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <rect x="3" y="7" width="13" height="10" rx="2.6" fill={`url(#${g})`} />
        <path
          d="m16 11 4.4-2.6a1 1 0 0 1 1.5.86v5.5a1 1 0 0 1-1.5.86L16 13"
          fill={`url(#${g})`}
        />
        <circle cx="9.2" cy="12" r="2.6" fill="rgba(255,255,255,0.95)" />
        <circle cx="9.2" cy="12" r="1" fill="#0055b3" />
      </svg>
    ),
    code: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5.5" fill={`url(#${g})`} />
        <path
          d="M14.3 6.4 10.6 17.6"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="m8.2 9.6-3 2.4 3 2.4"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m15.8 9.6 3 2.4-3 2.4"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    sparkles: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            {GRADIENT_STOPS}
          </linearGradient>
        </defs>
        <rect x="3" y="3" width="18" height="18" rx="5.5" fill={`url(#${g})`} />
        <path
          d="M12 4c.8 3.4 2.6 5.2 6 6-3.4.8-5.2 2.6-6 6-.8-3.4-2.6-5.2-6-6 3.4-.8 5.2-2.6 6-6Z"
          fill="rgba(255,255,255,0.92)"
        />
        <path
          d="M18.6 15.4c.4 1.5 1.1 2.2 2.6 2.6-1.5.4-2.2 1.1-2.6 2.6-.4-1.5-1.1-2.2-2.6-2.6 1.5-.4 2.2-1.1 2.6-2.6Z"
          fill="rgba(255,255,255,0.85)"
        />
      </svg>
    ),
  };

  return <span className={`block [&>svg]:w-full [&>svg]:h-full ${className ?? ''}`}>{icons[name]}</span>;
}

export { FeatureIcon };
