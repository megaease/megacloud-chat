"use client";

import { Loader } from "@/components/prompt-kit/loader";

export function Thinking() {
  return (
    <div className="flex items-center justify-center gap-2 max-w-[180px] w-auto mx-auto py-1.5 px-3 rounded-full border border-primary/10 shadow-sm dark:border-primary/30 z-10 mb-4 bg-background/60 backdrop-blur">
      <Loader variant="wave" size="sm" />
      <span className="text-primary text-xs font-medium dark:text-primary/90">
        Thinking...
      </span>
    </div>
  );
}
