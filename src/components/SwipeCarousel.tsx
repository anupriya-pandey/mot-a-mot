import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useRef, useState, type ReactNode } from 'react';

export interface SwipeCarouselSlide {
  key: string;
  badge: string;
  subtitle?: string;
  content: ReactNode;
}

interface SwipeCarouselProps {
  slides: SwipeCarouselSlide[];
  ariaLabel: string;
}

export function SwipeCarousel({ slides, ariaLabel }: SwipeCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(index, slides.length - 1));
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
      setActiveIndex(clamped);
    },
    [slides.length],
  );

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.max(0, Math.min(index, slides.length - 1)));
  }, [slides.length]);

  if (slides.length === 0) return null;

  const active = slides[activeIndex];
  const hasNext = activeIndex < slides.length - 1;
  const hasPrev = activeIndex > 0;
  const nextSlide = slides[activeIndex + 1];

  return (
    <div className="space-y-s" aria-label={ariaLabel}>
      <div className="flex items-center justify-between gap-s px-xs">
        <span className="text-xs font-semibold text-text-primary">
          {active.badge}
          {active.subtitle ? ` · ${active.subtitle}` : ''}
        </span>
        <span className="text-xs text-text-secondary">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>

      <div className="relative px-10">
        {hasPrev && (
          <button
            type="button"
            onClick={() => scrollTo(activeIndex - 1)}
            className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-text-primary shadow-card ring-1 ring-border"
            aria-label={`Previous: ${slides[activeIndex - 1]?.badge}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide) => (
            <div
              key={slide.key}
              className="w-full min-w-full flex-shrink-0 snap-start snap-always"
              aria-hidden={slide.key !== active.key}
            >
              {slide.content}
            </div>
          ))}
        </div>

        {hasNext && (
          <button
            type="button"
            onClick={() => scrollTo(activeIndex + 1)}
            className="absolute right-0 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/95 text-text-primary shadow-card ring-1 ring-border"
            aria-label={`Next: ${nextSlide?.badge}`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex justify-center gap-xs" role="tablist" aria-label={`${ariaLabel} levels`}>
        {slides.map((slide, index) => (
          <button
            key={slide.key}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={slide.badge}
            onClick={() => scrollTo(index)}
            className={[
              'h-2 rounded-full transition-all',
              index === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-border',
            ].join(' ')}
          />
        ))}
      </div>

      {hasNext && nextSlide && (
        <p className="text-center text-xs text-text-secondary">
          Swipe or tap → for <span className="font-medium text-text-primary">{nextSlide.badge}</span>
        </p>
      )}
    </div>
  );
}
