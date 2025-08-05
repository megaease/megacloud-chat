// components/shared.tsx - Shared utility components
import type React from "react";
import { IconCornerDownLeft } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function CommandMenuKbd({
	className,
	...props
}: React.ComponentProps<"kbd">) {
	return (
		<kbd
			className={cn(
				"inline-flex h-5 items-center justify-center gap-1 rounded border border-border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground select-none pointer-events-none",
				className,
			)}
			{...props}
		/>
	);
}

export function EnterKeyIcon({ className }: { className?: string }) {
	return <IconCornerDownLeft className={cn("h-3 w-3", className)} />;
}
