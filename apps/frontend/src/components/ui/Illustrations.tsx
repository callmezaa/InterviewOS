import React from 'react';

interface IllusProps {
  className?: string;
}

function DotGrid({ cx, cy, spacing }: { cx: number; cy: number; spacing: number }) {
  const dots: { x: number; y: number }[] = [];
  for (let x = 0; x < 7; x++) {
    for (let y = 0; y < 5; y++) {
      dots.push({ x: x * spacing, y: y * spacing });
    }
  }
  return (
    <g className="opacity-8">
      {dots.map((d, i) => (
        <circle key={i} cx={cx + d.x} cy={cy + d.y} r="1" fill="currentColor" />
      ))}
    </g>
  );
}

export function IllustrationEmpty({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      <rect x={36} y={30} width={128} height={100} rx={10} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <rect x={42} y={38} width={116} height={84} rx={7} stroke="currentColor" strokeWidth={1} className="opacity-15" />
      <circle cx={100} cy={80} r={26} stroke="currentColor" strokeWidth={1} className="opacity-20" />
      <circle cx={100} cy={80} r={16} stroke="currentColor" strokeWidth={1} strokeDasharray="3 3" className="opacity-30" />
      <circle cx={100} cy={80} r={4} fill="#2997FF" />
      {/* scanning arcs */}
      <path d="M74 80 A26 26 0 0 1 126 80" stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-40" />
      <path d="M86 62 A26 26 0 0 1 100 54" stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-25" />
      {/* corner dots */}
      <circle cx={52} cy={52} r={2} fill="#2997FF" className="opacity-30" />
      <circle cx={148} cy={52} r={2} fill="#2997FF" className="opacity-30" />
      <circle cx={52} cy={116} r={2} fill="currentColor" className="opacity-15" />
      <circle cx={148} cy={116} r={2} fill="currentColor" className="opacity-15" />
    </svg>
  );
}

export function IllustrationSearch({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      <circle cx={88} cy={72} r={30} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <circle cx={88} cy={72} r={22} stroke="currentColor" strokeWidth={1.5} className="opacity-20" />
      <circle cx={88} cy={72} r={12} stroke="currentColor" strokeWidth={1} className="opacity-15" />
      <line x1={104} y1={88} x2={122} y2={106} stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="opacity-25" />
      <circle cx={88} cy={72} r={3} fill="#2997FF" />
      {/* target crosshair */}
      <line x1={88} y1={58} x2={88} y2={50} stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-35" />
      <line x1={88} y1={86} x2={88} y2={94} stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-35" />
      <line x1={74} y1={72} x2={66} y2={72} stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-35" />
      <line x1={102} y1={72} x2={110} y2={72} stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-35" />
      {/* floating search bars */}
      <rect x={130} y={46} width={36} height={6} rx={3} stroke="currentColor" strokeWidth={1} className="opacity-12" />
      <rect x={136} y={58} width={24} height={6} rx={3} stroke="currentColor" strokeWidth={1} className="opacity-8" />
      <rect x={32} y={106} width={48} height={6} rx={3} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <rect x={38} y={118} width={30} height={6} rx={3} stroke="currentColor" strokeWidth={1} className="opacity-8" />
    </svg>
  );
}

export function IllustrationCalendar({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      <rect x={40} y={26} width={120} height={108} rx={8} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <rect x={40} y={26} width={120} height={28} rx={8} stroke="currentColor" strokeWidth={1} className="opacity-15" />
      {/* pegs */}
      <line x1={66} y1={26} x2={66} y2={14} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="opacity-15" />
      <line x1={134} y1={26} x2={134} y2={14} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className="opacity-15" />
      {/* date dots */}
      <circle cx={62} cy={76} r={5} fill="#2997FF" className="opacity-30" />
      <circle cx={82} cy={76} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={102} cy={76} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={122} cy={76} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={62} cy={96} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={82} cy={96} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={102} cy={96} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={122} cy={96} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={62} cy={116} r={5} fill="currentColor" className="opacity-10" />
      <circle cx={82} cy={116} r={5} fill="currentColor" className="opacity-10" />
      {/* selected dot */}
      <circle cx={62} cy={76} r={2} fill="#2997FF" />
      {/* connecting line */}
      <path d="M52 76 L72 76" stroke="#2997FF" strokeWidth={1} strokeLinecap="round" className="opacity-20" />
      {/* month labels */}
      <rect x={72} y={34} width={56} height={4} rx={2} fill="currentColor" className="opacity-15" />
    </svg>
  );
}

export function IllustrationActivity({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      {/* grid lines */}
      <line x1={30} y1={120} x2={170} y2={120} stroke="currentColor" strokeWidth={1} className="opacity-8" />
      <line x1={30} y1={100} x2={170} y2={100} stroke="currentColor" strokeWidth={1} strokeDasharray="2 4" className="opacity-6" />
      <line x1={30} y1={80} x2={170} y2={80} stroke="currentColor" strokeWidth={1} strokeDasharray="2 4" className="opacity-6" />
      <line x1={30} y1={60} x2={170} y2={60} stroke="currentColor" strokeWidth={1} strokeDasharray="2 4" className="opacity-6" />
      {/* main line chart */}
      <path d="M40 110 L60 100 L80 72 L100 90 L120 56 L140 68 L160 44" stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="opacity-50" />
      {/* area fill */}
      <path d="M40 110 L60 100 L80 72 L100 90 L120 56 L140 68 L160 44 L160 120 L40 120 Z" fill="#2997FF" className="opacity-6" />
      {/* data points */}
      <circle cx={80} cy={72} r={3} fill="#2997FF" />
      <circle cx={120} cy={56} r={3} fill="#2997FF" />
      <circle cx={160} cy={44} r={3} fill="#2997FF" />
      <circle cx={40} cy={110} r={2} fill="currentColor" className="opacity-15" />
      <circle cx={60} cy={100} r={2} fill="currentColor" className="opacity-15" />
      <circle cx={100} cy={90} r={2} fill="currentColor" className="opacity-15" />
      <circle cx={140} cy={68} r={2} fill="currentColor" className="opacity-15" />
      {/* bar chart */}
      <rect x={42} y={44} width={6} height={20} rx={1.5} fill="currentColor" className="opacity-10" />
      <rect x={54} y={38} width={6} height={26} rx={1.5} fill="currentColor" className="opacity-8" />
      <rect x={142} y={48} width={6} height={16} rx={1.5} fill="currentColor" className="opacity-8" />
      <rect x={154} y={36} width={6} height={28} rx={1.5} fill="currentColor" className="opacity-8" />
    </svg>
  );
}

export function IllustrationFeedback({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      {/* document body */}
      <rect x={50} y={16} width={100} height={132} rx={8} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <rect x={56} y={22} width={88} height={120} rx={6} stroke="currentColor" strokeWidth={1} className="opacity-15" />
      {/* content lines */}
      <rect x={70} y={38} width={52} height={4} rx={2} fill="currentColor" className="opacity-15" />
      <rect x={70} y={50} width={60} height={3} rx={1.5} fill="currentColor" className="opacity-8" />
      <rect x={70} y={60} width={40} height={3} rx={1.5} fill="currentColor" className="opacity-8" />
      <rect x={70} y={80} width={52} height={4} rx={2} fill="currentColor" className="opacity-12" />
      <rect x={70} y={92} width={36} height={3} rx={1.5} fill="currentColor" className="opacity-8" />
      {/* checkmark circle */}
      <circle cx={100} cy={118} r={18} stroke="#2997FF" strokeWidth={1.5} className="opacity-30" />
      <circle cx={100} cy={118} r={12} stroke="#2997FF" strokeWidth={1} className="opacity-20" />
      <path d="M92 118 L98 124 L108 112" stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="opacity-60" />
      {/* star dots */}
      <circle cx={148} cy={42} r={2} fill="#2997FF" className="opacity-25" />
      <circle cx={148} cy={52} r={1.5} fill="currentColor" className="opacity-10" />
      <circle cx={52} cy={106} r={2} fill="currentColor" className="opacity-12" />
    </svg>
  );
}

export function IllustrationTemplate({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      {/* stack of docs */}
      <rect x={62} y={34} width={80} height={96} rx={6} stroke="currentColor" strokeWidth={1} className="opacity-8" />
      <rect x={56} y={28} width={80} height={96} rx={6} stroke="currentColor" strokeWidth={1} className="opacity-12" />
      <rect x={50} y={22} width={80} height={96} rx={6} stroke="currentColor" strokeWidth={1.5} className="opacity-20" />
      {/* template marks on top doc */}
      <rect x={68} y={44} width={44} height={4} rx={2} fill="#2997FF" className="opacity-20" />
      <rect x={68} y={54} width={36} height={3} rx={1.5} fill="currentColor" className="opacity-10" />
      <rect x={68} y={62} width={28} height={3} rx={1.5} fill="currentColor" className="opacity-8" />
      <rect x={68} y={78} width={44} height={4} rx={2} fill="#2997FF" className="opacity-15" />
      <rect x={68} y={88} width={32} height={3} rx={1.5} fill="currentColor" className="opacity-8" />
      <rect x={68} y={96} width={24} height={3} rx={1.5} fill="currentColor" className="opacity-8" />
      {/* plus icon */}
      <circle cx={140} cy={28} r={10} fill="#2997FF" className="opacity-15" />
      <path d="M136 28 H144 M140 24 V32" stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-50" />
      {/* corner flourish */}
      <path d="M50 22 L38 14" stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="opacity-10" />
      <circle cx={34} cy={12} r={2} fill="#2997FF" className="opacity-20" />
    </svg>
  );
}

export function IllustrationRecording({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      {/* outer frame */}
      <rect x={30} y={28} width={140} height={104} rx={12} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <rect x={36} y={34} width={128} height={92} rx={8} stroke="currentColor" strokeWidth={1} className="opacity-15" />
      {/* play circle */}
      <circle cx={100} cy={80} r={26} stroke="#2997FF" strokeWidth={1.5} className="opacity-30" />
      <circle cx={100} cy={80} r={18} stroke="#2997FF" strokeWidth={1} className="opacity-20" />
      <path d="M92 68 V92 L112 80 Z" fill="#2997FF" className="opacity-50" />
      {/* recording dot */}
      <circle cx={148} cy={46} r={4} fill="#f87171" className="opacity-40" />
      <circle cx={148} cy={46} r={2} fill="#f87171" />
      {/* timeline bar */}
      <rect x={50} y={108} width={100} height={3} rx={1.5} fill="currentColor" className="opacity-8" />
      <rect x={50} y={108} width={60} height={3} rx={1.5} fill="#2997FF" className="opacity-25" />
      {/* waveform bars */}
      {[70, 44, 56, 38, 62, 48, 52, 42, 58, 46].map((h, i) => (
        <rect key={i} x={62 + i * 8} y={80 - h / 2} width={3} height={h} rx={1.5} fill="currentColor" className="opacity-8" />
      ))}
      {[52, 38, 44, 34].map((h, i) => (
        <rect key={`a-${i}`} x={62 + i * 8} y={80 - h / 2} width={3} height={h} rx={1.5} fill="#2997FF" className="opacity-20" />
      ))}
    </svg>
  );
}

export function IllustrationTeam({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      {/* avatar circles */}
      <circle cx={80} cy={56} r={22} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <circle cx={80} cy={56} r={16} stroke="currentColor" strokeWidth={1} className="opacity-15" />
      <circle cx={80} cy={56} r={6} fill="#2997FF" className="opacity-20" />
      <circle cx={130} cy={64} r={18} stroke="currentColor" strokeWidth={1} className="opacity-8" />
      <circle cx={130} cy={64} r={12} stroke="currentColor" strokeWidth={1} className="opacity-12" />
      <circle cx={130} cy={64} r={4} fill="currentColor" className="opacity-15" />
      <circle cx={56} cy={96} r={16} stroke="currentColor" strokeWidth={1} className="opacity-8" />
      <circle cx={56} cy={96} r={10} stroke="currentColor" strokeWidth={1} className="opacity-10" />
      <circle cx={56} cy={96} r={3} fill="currentColor" className="opacity-12" />
      {/* connecting dots between avatars */}
      <circle cx={96} cy={62} r={1.5} fill="#2997FF" className="opacity-25" />
      <circle cx={108} cy={66} r={1.5} fill="currentColor" className="opacity-12" />
      <circle cx={64} cy={72} r={1.5} fill="currentColor" className="opacity-10" />
      <circle cx={72} cy={82} r={1.5} fill="#2997FF" className="opacity-20" />
      {/* plus on main avatar */}
      <circle cx={80} cy={56} r={8} stroke="#2997FF" strokeWidth={1} strokeDasharray="2 2" className="opacity-25" />
      <path d="M76 56 H84 M80 52 V60" stroke="#2997FF" strokeWidth={1.5} strokeLinecap="round" className="opacity-40" />
      {/* bottom bar */}
      <rect x={64} y={124} width={72} height={4} rx={2} fill="currentColor" className="opacity-8" />
    </svg>
  );
}

export function IllustrationError({ className }: IllusProps) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <DotGrid cx={10} cy={10} spacing={26} />
      {/* outer frame */}
      <rect x={30} y={20} width={140} height={120} rx={10} stroke="currentColor" strokeWidth={1} strokeDasharray="4 4" className="opacity-10" />
      {/* X circle */}
      <circle cx={100} cy={72} r={28} stroke="#f87171" strokeWidth={1.5} className="opacity-20" />
      <circle cx={100} cy={72} r={20} stroke="#f87171" strokeWidth={1} className="opacity-15" />
      <line x1={90} y1={62} x2={110} y2={82} stroke="#f87171" strokeWidth={2} strokeLinecap="round" className="opacity-50" />
      <line x1={110} y1={62} x2={90} y2={82} stroke="#f87171" strokeWidth={2} strokeLinecap="round" className="opacity-50" />
      <circle cx={100} cy={72} r={3} fill="#f87171" />
      {/* wavy lines below */}
      <path d="M60 112 Q70 104 80 112 Q90 120 100 112 Q110 104 120 112 Q130 120 140 112" stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="opacity-10" />
      <path d="M60 120 Q70 112 80 120 Q90 128 100 120 Q110 112 120 120 Q130 128 140 120" stroke="currentColor" strokeWidth={1} strokeLinecap="round" className="opacity-8" />
      {/* warning dots */}
      <circle cx={50} cy={46} r={2} fill="#f87171" className="opacity-25" />
      <circle cx={150} cy={46} r={2} fill="currentColor" className="opacity-12" />
      <circle cx={50} cy={106} r={2} fill="currentColor" className="opacity-10" />
    </svg>
  );
}

// ── Backward-compatible aliases for old misspelled exports ──
/** @deprecated Use `IllustrationEmpty` instead */
export const IlustrationEmpty = IllustrationEmpty;
/** @deprecated Use `IllustrationSearch` instead */
export const IlustrationSearch = IllustrationSearch;
/** @deprecated Use `IllustrationCalendar` instead */
export const IlustrationCalendar = IllustrationCalendar;
/** @deprecated Use `IllustrationActivity` instead */
export const IlustrationActivity = IllustrationActivity;
/** @deprecated Use `IllustrationFeedback` instead */
export const IlustrationFeedback = IllustrationFeedback;
/** @deprecated Use `IllustrationError` instead */
export const IlustrationError = IllustrationError;
