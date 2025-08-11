"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { IconChevronDown } from "@tabler/icons-react";

export type ScrollButtonProps = {
  className?: string;
  /** Distance to bottom (px) under which we treat as "at bottom" */
  threshold?: number;
  /** Optional title/aria label */
  label?: string;
};

function isScrollable(el: HTMLElement) {
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  if (!(overflowY === "auto" || overflowY === "scroll")) return false;
  return el.scrollHeight > el.clientHeight;
}

function findScrollParent(start: HTMLElement | null): HTMLElement | null {
  let el: HTMLElement | null = start;
  while (el) {
    if (isScrollable(el)) return el;
    el = el.parentElement;
  }
  return document.scrollingElement as HTMLElement | null;
}

export function ScrollButton({
  className,
  threshold = 48,
  label = "Scroll to bottom",
}: ScrollButtonProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  // Resolve scroll parent after mount and when host ref changes
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    setScrollParent(findScrollParent(hostRef.current ?? null));
  }, []);

  useEffect(() => {
    if (!scrollParent) return;

    const compute = () => {
      const top = scrollParent.scrollTop;
      const h = scrollParent.clientHeight;
      const sh = scrollParent.scrollHeight;
      const atBottom = top + h >= sh - threshold;
      setVisible(!atBottom);
    };

    compute();
    scrollParent.addEventListener("scroll", compute, { passive: true });
    const ro = new ResizeObserver(compute);
    ro.observe(scrollParent);
    return () => {
      scrollParent.removeEventListener("scroll", compute);
      ro.disconnect();
    };
  }, [scrollParent, threshold]);

  const handleClick = () => {
    const target = scrollParent ?? window;
    // Scroll the parent to bottom smoothly
    if (scrollParent) {
      scrollParent.scrollTo({
        top: scrollParent.scrollHeight,
        behavior: "smooth",
      });
    } else {
      (target as Window).scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div ref={hostRef} className={cn("pointer-events-none", className)}>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={handleClick}
        className={cn(
          "pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-sm transition-all duration-200",
          "hover:scale-105 hover:shadow-md hover:bg-primary/90 active:scale-95",
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <IconChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

export default ScrollButton;
