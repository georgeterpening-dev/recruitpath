import { useEffect, useRef } from "react";

interface UseIntersectionAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  staggerIndex?: number;
  staggerDelay?: number;
}

/**
 * Custom hook that applies a slide-up fade-in animation to an element
 * when it enters the viewport using IntersectionObserver.
 *
 * Animation: translateY(30px) + opacity(0) → translateY(0) + opacity(1)
 * Duration: 0.4s with cubic-bezier(0.25, 0.46, 0.45, 0.94)
 * Stagger: 60ms delay between each element (configurable)
 */
export function useIntersectionAnimation(
  options: UseIntersectionAnimationOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    staggerIndex = 0,
    staggerDelay = 60,
  } = options;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Set initial state
    element.style.opacity = "0";
    element.style.transform = "translateY(30px)";
    element.style.transition = "none";

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger animation with stagger delay
            setTimeout(() => {
              if (element) {
                element.style.transition =
                  "opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
                element.style.opacity = "1";
                element.style.transform = "translateY(0)";
              }
            }, staggerIndex * staggerDelay);

            // Unobserve after animation triggers
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, staggerIndex, staggerDelay]);

  return ref;
}
