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
 */
export const ScrollRevealCard: React.FC<ScrollRevealCardProps> = ({
  children,
  className = '',
  delayMs = 0,
  threshold = 0.12,
  scaleFrom = 0.94,
  translateY = 32,
  durationMs = 700,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Check if the card is already in the viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          } else {
            // Only reset if user scrolls back up completely above this card
            // so that scrolling down triggers the smooth pop up again
            if (entry.boundingClientRect.top > window.innerHeight) {
              setIsVisible(false);
            }
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -40px 0px', // Triggers slightly before reaching the bottom
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
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
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
};
