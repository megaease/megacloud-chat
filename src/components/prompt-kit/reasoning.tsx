"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { DotsLoader } from "@/components/prompt-kit/loader";
import { Markdown } from "@/components/prompt-kit/markdown";

type ReasoningContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  isStreaming?: boolean;
};

const ReasoningCtx = createContext<ReasoningContextValue | null>(null);

export type ReasoningProps = {
  isStreaming?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Reasoning({
  isStreaming,
  defaultOpen = false,
  className,
  children,
}: ReasoningProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  return (
    <ReasoningCtx.Provider value={{ open, setOpen, isStreaming }}>
      <div className={cn("not-prose w-full", className)}>{children}</div>
    </ReasoningCtx.Provider>
  );
}

export type ReasoningTriggerProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ReasoningTrigger({
  className,
  children,
  ...props
}: ReasoningTriggerProps) {
  const ctx = useContext(ReasoningCtx);
  if (!ctx) return null;
  const { open, setOpen, isStreaming } = ctx;
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm",
        "border-primary/30 bg-accent/30 hover:bg-accent/50 transition-colors",
        className
      )}
      {...props}
    >
      <span>
        {children ?? (open ? "Hide AI reasoning" : "Show AI reasoning")}
      </span>
      {isStreaming ? <DotsLoader size="sm" /> : null}
    </button>
  );
}

export type ReasoningContentProps = {
  markdown?: boolean;
  className?: string;
  children: string;
};

export function ReasoningContent({
  markdown = false,
  className,
  children,
}: ReasoningContentProps) {
  const ctx = useContext(ReasoningCtx);
  if (!ctx) return null;
  const { open } = ctx;
  if (!open) return null;

  const contentClass = cn(
    "mt-2 ml-2 border-l-2 border-l-slate-200 px-2 pb-1 dark:border-l-slate-700",
    className
  );

  return markdown ? (
    <Markdown className={contentClass}>{children}</Markdown>
  ) : (
    <div className={contentClass}>
      <pre className="whitespace-pre-wrap break-words text-sm">{children}</pre>
    </div>
  );
}

export default Reasoning;
