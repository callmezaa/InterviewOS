'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * useActiveSection
 *
 * Tracks which section ID is currently most visible in the viewport
 * using IntersectionObserver. Returns the ID of the active section.
 *
 * @param sectionIds - Array of element IDs to observe (e.g. ['features', 'how-it-works'])
 * @param options    - IntersectionObserver options override
 */
export function useActiveSection(
  sectionIds: string[],
  options: IntersectionObserverInit = {}
): string {
  const [activeId, setActiveId] = useState<string>('');

  // Store current intersection ratios to always pick the most visible section
  const ratioMap = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const defaultOptions: IntersectionObserverInit = {
      // Offset: start tracking when section hits 20% from the top of viewport
      rootMargin: '-10% 0px -60% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      ...options,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        ratioMap.current.set(entry.target.id, entry.intersectionRatio);
      });

      // Pick the section with the highest visible ratio
      let topId = '';
      let topRatio = 0;

      ratioMap.current.forEach((ratio, id) => {
        if (ratio > topRatio) {
          topRatio = ratio;
          topId = id;
        }
      });

      if (topId) setActiveId(topId);
    }, defaultOptions);

    // Observe each section element
    const elements: Element[] = [];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        observer.observe(el);
        elements.push(el);
        ratioMap.current.set(id, 0);
      }
    });

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionIds.join(',')]);

  return activeId;
}
