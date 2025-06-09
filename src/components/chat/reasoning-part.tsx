"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { ReasoningPart as ReasoningPartType } from "@/types/tool-invocation";
import {
	BrainCircuit,
	CheckCircle2,
	Loader,
	Loader2,
	Sparkle,
} from "lucide-react";

export function ReasoningPart({
	part,
	isLoading,
}: { part: ReasoningPartType; isLoading: boolean }) {
	return (
		<div className="border rounded-[var(--radius)] my-3 shadow-[var(--shadow-xs)] border-primary/30 bg-accent/30 ">
			<Accordion type="single" collapsible defaultValue="item-0">
				<AccordionItem value="item-0" className="border-0 flex flex-col h-full">
					<AccordionTrigger className="px-3 py-2 hover:no-underline">
						<div className="flex items-center gap-2 w-full">
							<Sparkle size={18} className="text-primary" />
							{isLoading ? (
								<>
									<span className="font-medium text-primary">Reasoning</span>
									<Loader className="h-4 w-4 animate-spin text-primary" />
								</>
							) : (
								<span className="font-medium text-primary">
									Reasoned for a few seconds
								</span>
							)}
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-3 pb-3 pt-0 h-full flex-1 overflow-auto">
						<div className="bg-card rounded-[var(--radius)]  p-3 max-h-[300px] overflow-auto">
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
