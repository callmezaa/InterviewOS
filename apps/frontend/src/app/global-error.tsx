'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { captureError } from '../lib/sentry';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    captureError(error, {
      route: 'global',
      tags: { error_boundary: 'global' },
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-surface-black text-white" style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '460px' }}>
            <svg width="120" height="90" viewBox="0 0 160 120" fill="none" style={{ opacity: 0.25 }}>
              <rect x="10" y="10" width="140" height="100" rx="8" className="stroke-[var(--color-danger-soft)]" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx="80" cy="50" r="24" className="stroke-[var(--color-danger-soft)]" strokeWidth="1.5" opacity="0.5" />
              <circle cx="80" cy="50" r="16" className="stroke-[var(--color-danger-soft)]" strokeWidth="1" opacity="0.3" />
              <line x1="72" y1="42" x2="88" y2="58" className="stroke-[var(--color-danger-soft)]" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="88" y1="42" x2="72" y2="58" className="stroke-[var(--color-danger-soft)]" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <path d="M40 85 L50 75 L60 85" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
              <path d="M100 75 L110 85 L120 75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
            </svg>

            <div>
              <h1 className="text-white/90" style={{
                fontFamily: '"SF Pro Display", system-ui, sans-serif',
                fontSize: '24px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: 0,
              }}>
                Application error
              </h1>
              <p className="text-body-muted/60" style={{
                fontSize: '15px',
                lineHeight: 1.55,
                marginTop: '8px',
                maxWidth: '360px',
              }}>
                A critical error occurred. Please try reloading the application.
              </p>
            </div>

            {error.digest && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '9999px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'rgba(204,204,204,0.4)',
              }}>
                <span>Error ID:</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{error.digest}</span>
              </div>
            )}

            <button
              onClick={() => unstable_retry()}
              className="bg-primary text-white" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: 400,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'background 0.2s ease',
                marginTop: '8px',
              }}
            >
              <RefreshCw size={16} />
              <span>Reload application</span>
            </button>

            {error.message && (
              <details style={{ width: '100%', maxWidth: '400px', marginTop: '8px' }}>
                <summary style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: 'rgba(204,204,204,0.25)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}>
                  Error details
                </summary>
                <pre style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  textAlign: 'left',
                  color: 'rgba(248, 113, 113, 0.6)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {error.message}
                  {error.stack ? `\n\n${error.stack}` : ''}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
