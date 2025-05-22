"use client";

import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { ReasoningPart as ReasoningPartType } from "@/types/tool-invocation";

export function ReasoningPart({ part }: { part: ReasoningPartType }) {
	return (
		<div className="border rounded-[var(--radius)] my-3 shadow-[var(--shadow-xs)] border-primary/30 bg-accent/30">
			<Accordion type="single" collapsible defaultValue="item-0">
				<AccordionItem value="item-0" className="border-0">
					<AccordionTrigger className="px-3 py-2 hover:no-underline">
						<div className="flex items-center gap-2 w-full">
							<BrainCircuit size={18} className="text-primary" />
							<span className="font-medium text-primary">
								Reasoning Process
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-3 pb-3 pt-0">
						<div className="bg-card rounded-[var(--radius)] overflow-hidden border border-border p-3">
							<pre className="whitespace-pre-wrap break-words text-xs">
								{part.reasoning}
							</pre>
						</div>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
