'use client';

import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  estimateSize?: number;
  className?: string;
  gap?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  renderItem,
  overscan = 5,
  estimateSize = 80,
  className = '',
  gap = 12,
  getItemKey,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: useMemo(() => () => estimateSize + gap, [estimateSize, gap]),
    overscan,
  });

  const itemsMemo = useMemo(() => items, [items]);

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto ${className}`}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = itemsMemo[virtualItem.index];
          if (!item) return null;
          const key = getItemKey
            ? getItemKey(item, virtualItem.index)
            : (item as { id?: string | number })?.id ?? virtualItem.index;
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
