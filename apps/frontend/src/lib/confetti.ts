import confetti from 'canvas-confetti';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const brandColors = ['#2997FF', '#f87171', '#34d399', '#fbbf24', '#a78bfa'];

/** Small burst from bottom-center — fires alongside success toasts */
export function triggerConfetti(): void {
  if (prefersReducedMotion()) return;

  const end = Date.now() + 300;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 90,
      spread: 60,
      origin: { x: 0.5, y: 1 },
      colors: brandColors,
      startVelocity: 45,
      gravity: 0.8,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  }());
}

/** Big celebration from both sides — fires on interview completion & account creation */
export function triggerMilestoneConfetti(): void {
  if (prefersReducedMotion()) return;

  const end = Date.now() + 2000;

  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: brandColors,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: brandColors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  }());
}

/** Burst from center — fires on review page when score >= 80 */
export function triggerScoreConfetti(): void {
  if (prefersReducedMotion()) return;

  const colors = ['#2997FF', '#34d399', '#fbbf24', '#a78bfa'];

  confetti({ spread: 360, ticks: 70, gravity: 0.5, colors, particleCount: 60, origin: { x: 0.5, y: 0.5 } });
  confetti({ spread: 360, ticks: 70, gravity: 0.5, colors, particleCount: 30, origin: { x: 0.5, y: 0.4 }, startVelocity: 30 });
  confetti({ spread: 360, ticks: 70, gravity: 0.5, colors, particleCount: 30, origin: { x: 0.5, y: 0.6 }, startVelocity: 30 });

  // Second wave after 400ms
  setTimeout(() => {
    confetti({ spread: 360, ticks: 60, gravity: 0.5, colors, particleCount: 40, origin: { x: 0.5, y: 0.5 }, startVelocity: 20 });
  }, 400);
}
