'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  items: T[];
  pageSize?: number;
}

export function useInfiniteScroll<T>({ items, pageSize = 20 }: UseInfiniteScrollOptions<T>) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset when items change (e.g. filter change)
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items.length, pageSize]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setVisibleCount(prev => Math.min(prev + pageSize, items.length));
          }
        },
        { rootMargin: '200px' }
      );

      observerRef.current.observe(node);
    },
    [hasMore, pageSize, items.length]
  );

  return { visibleItems, hasMore, sentinelRef };
}
