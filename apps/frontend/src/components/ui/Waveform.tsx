'use client';

import React, { useEffect, useState } from 'react';

interface WaveformProps {
  isActive?: boolean;
  level?: number; // 0 to 100
  barCount?: number;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive = false, level = 0, barCount = 12 }) => {
  const [barHeights, setBarHeights] = useState<number[]>(new Array(barCount).fill(4));

  useEffect(() => {
    if (!isActive) {
      setBarHeights(new Array(barCount).fill(4));
      return;
    }

    // If active and specific level is provided, use it to scale bar heights, otherwise randomize for visual effect
    const interval = setInterval(() => {
      setBarHeights((prev) =>
        prev.map(() => {
          const factor = level > 0 ? level / 100 : Math.random();
          const target = Math.max(4, Math.floor(factor * 28));
          // Apply a simple damping/interpolation to make it look smooth
          return target;
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, level, barCount]);

  return (
    <div className="flex items-center gap-0.5 h-8 px-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
      {barHeights.map((height, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-primary transition-all duration-100 ease-in-out"
          style={{
            height: `${height}px`,
            opacity: isActive ? 0.3 + (height / 28) * 0.7 : 0.2,
          }}
        />
      ))}
    </div>
  );
};
