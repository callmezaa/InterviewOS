'use client';

import { useId } from 'react';

export function RoleIcon({ role }: { role: 'INTERVIEWER' | 'CANDIDATE' }) {
  const id = useId();
  const g = `${id}-g`;
  const stops = (
    <>
      <stop stopColor="#2f9bff" />
      <stop offset="1" stopColor="#0055b3" />
    </>
  );

  return (
    <span className="block w-9 h-9 [&>svg]:w-full [&>svg]:h-full">
      {role === 'INTERVIEWER' ? (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <defs>
            <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
              {stops}
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="5.5" fill={`url(#${g})`} />
          <rect x="9" y="3" width="6" height="11" rx="3" fill="rgba(255,255,255,0.92)" />
          <path
            d="M6.2 10.6a5.8 5.8 0 0 0 11.6 0"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect x="10.6" y="14.7" width="2.8" height="1.9" rx="0.95" fill="rgba(255,255,255,0.92)" />
          <path
            d="M12 16.6v1.8"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
          <defs>
            <linearGradient id={g} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
              {stops}
            </linearGradient>
          </defs>
          <rect x="3" y="3" width="18" height="18" rx="5.5" fill={`url(#${g})`} />
          <circle cx="12" cy="9.2" r="3.1" fill="rgba(255,255,255,0.92)" />
          <path d="M5.9 19.2c0-3.4 2.7-5.7 6.1-5.7s6.1 2.3 6.1 5.7" fill="rgba(255,255,255,0.92)" />
        </svg>
      )}
    </span>
  );
}