import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealCardProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
  scaleFrom?: number;
  translateY?: number;
  durationMs?: number;
}

/**
 * High-performance, tactile scroll reveal component.
 * Causes cards to smoothly "pop up" into place as the user scrolls into each section,
 * using an Apple/Linear-grade cubic-bezier spring curve.
 * 
 * Engineered with bulletproof fallbacks:
 * - Never leaves cards trapped in invisible opacity:0 state.
 * - Triggers generously before elements hit the viewport bottom.
 * - Locks revealed state once triggered so scrolling back/forth doesn't flash white space.
 */
export const ScrollRevealCard: React.FC<ScrollRevealCardProps> = ({
  children,
  className = '',
  delayMs = 0,
  threshold = 0.04,
  scaleFrom = 0.96,
  translateY = 24,
  durationMs = 650,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Safety fallback: guarantee visible state after a short delay so cards never stay blank
    const fallbackTimer = setTimeout(() => {
      setIsVisible(true);
    }, 900);

    // If IntersectionObserver is not available, immediately show
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      clearTimeout(fallbackTimer);
      return;
    }

    // Check if the card is already in the viewport on mount
    try {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 50 && rect.bottom > 0) {
        setIsVisible(true);
        clearTimeout(fallbackTimer);
      }
    } catch {
      setIsVisible(true);
      clearTimeout(fallbackTimer);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            clearTimeout(fallbackTimer);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin: '120px 0px 40px 0px', // Pre-trigger generously before entering bottom
      }
    );

    observer.observe(el);

    return () => {
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <div
      ref={containerRef}
      className={`will-change-transform ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translateY(0px) scale(1)'
          : `translateY(${translateY}px) scale(${scaleFrom})`,
        transitionProperty: 'opacity, transform',
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {children}
    </div>
  );
};
