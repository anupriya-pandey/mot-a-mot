import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const DEMO_CONTENT_WIDTH = 720;

interface DemoScaledViewportProps {
  children: ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export function DemoScaledViewport({ children, scrollRef }: DemoScaledViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const width = container.clientWidth;
      setScale(Math.min(1, width / DEMO_CONTENT_WIDTH));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-background">
      <div
        ref={scrollRef as React.LegacyRef<HTMLDivElement> | undefined}
        className="h-full w-full overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        <div
          className="origin-top-left"
          style={{
            width: DEMO_CONTENT_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            minHeight: `${100 / scale}%`,
          }}
        >
          <div className="pointer-events-none select-none">{children}</div>
        </div>
      </div>
    </div>
  );
}
