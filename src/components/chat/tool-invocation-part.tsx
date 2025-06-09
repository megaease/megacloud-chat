import { cn } from "@/lib/utils";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	IconTerminal,
	IconDatabase,
	IconClock,
	IconCircleCheck,
	IconAlertCircle,
	IconLoader,
	IconClock2,
} from "@tabler/icons-react";
import type {
	ToolInvocationPart as ToolInvocationPartType,
	ResultContent,
} from "@/types/tool-invocation";
import { Markdown } from "../markdown";
import { CopyButton } from "../copy-button";

function renderResultContent(content: ResultContent | string, key: string) {
	// Function to try parsing JSON strings and display them with formatting
	const tryParseAndRenderJSON = (text: string, contentKey: string) => {
		try {
			// Try to parse the JSON string
			const parsed = JSON.parse(text);
			return (
				<div
					key={contentKey}
					className="relative rounded-[var(--radius)] border border-border overflow-hidden"
				>
					<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
						{JSON.stringify(parsed, null, 2)}
					</pre>
				</div>
			);
		} catch {
			// If not JSON, return null to use fallback rendering method
			return null;
		}
	};

	if (typeof content === "string") {
		// Try to parse as JSON
		const jsonResult = tryParseAndRenderJSON(content, key);
		if (jsonResult) return jsonResult;

		// Not JSON, render with Markdown
		return (
			<Markdown
				key={key}
				className="whitespace-pre-wrap my-0"
				content={content}
			/>
		);
	}

	switch (content.type) {
		case "text":
		case "markdown":
			try {
				const parsed = JSON.parse(content.text);
				return (
					<div
						key={key}
						className="relative rounded-[var(--radius)] border border-border overflow-hidden"
					>
						<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
							{JSON.stringify(parsed, null, 2)}
						</pre>
					</div>
				);
			} catch {
				return (
					<Markdown
						key={key}
						className="whitespace-pre-wrap my-0"
						content={content.text}
					/>
				);
			}
		case "code":
			return (
				<div
					key={key}
					className="relative rounded-[var(--radius)] border border-border overflow-hidden"
				>
					<div className="bg-muted/50 px-3 py-1.5 border-b border-border flex items-center justify-between">
						<span className="text-xs font-medium">Code</span>
						<CopyButton text={content.text} />
					</div>
					<pre className="whitespace-pre-wrap break-words text-xs p-2 m-0">
						<code className="font-mono">{content.text}</code>
					</pre>
				</div>
			);
		default:
			return null;
	}
}

export function ToolInvocationPart({
	part,
	isLoading,
}: { part: ToolInvocationPartType; isLoading: boolean }) {
	const { toolInvocation } = part;
	const toolName = toolInvocation.toolName;
	const step = toolInvocation.step;
	const isDatabase =
		toolName.includes("sql") || toolName.includes("postgresql");
	const args = JSON.stringify(toolInvocation.args, null, 2);

	const hasError = toolInvocation.result?.isError;
	const errorMessage = hasError
		? toolInvocation.result?.error || "Unknown error"
		: null;

	// Determine icon based on tool name
	const getToolIcon = (name: string) => {
		if (isDatabase) {
			return <IconDatabase size={18} className="text-primary" />;
		}
		return <IconTerminal size={18} className="text-primary" />;
	};

	// Determine status icon
	const getStatusIcon = () => {
		const { state } = toolInvocation;

		if (state === "result") {
			return hasError ? (
				<IconAlertCircle size={16} className="text-destructive" />
			) : (
				<IconCircleCheck size={16} className="text-green-500" />
			);
		}

		// Handle loading state
		if (state === "call" || state === "partial-call") {
			return (
				<div className="animate-spin">
					<IconClock2 size={16} className="text-primary" />
				</div>
			);
		}

		return <IconClock2 size={16} className="text-muted-foreground" />;
	};

	// Render result content
	const renderResult = () => {
		const { result, state } = toolInvocation;

		// Handle loading state
		if (state === "call" || state === "partial-call") {
			return (
				<div className="flex items-center gap-2 text-muted-foreground">
					<div className="animate-spin h-4 w-4 rounded-full border-2 border-primary border-r-transparent" />
					<span className="text-xs font-medium">Executing...</span>
				</div>
			);
		}

		// If there's no result
		if (!result) {
			return (
				<div className="text-muted-foreground text-xs font-medium">
					Waiting for execution results...
				</div>
			);
		}

		// If there's no content, display the complete result object
		if (!result.content) {
			return (
				<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
					{JSON.stringify(result, null, 2)}
				</pre>
			);
		}

		if (typeof result.content === "string") {
			try {
				const parsed = JSON.parse(result.content);

				return (
					<div className="rounded-[var(--radius)] border border-border overflow-hidden">
						<pre className="whitespace-pre-wrap break-words text-xs p-2 max-h-[300px] overflow-auto m-0">
							{JSON.stringify(parsed, null, 2)}
						</pre>
					</div>
				);
			} catch {
				return (
					<Markdown
						content={result.content}
						className="text-xs max-h-[300px] overflow-auto my-0"
					/>
				);
			}
		}

		// If content is an array
		if (Array.isArray(result.content)) {
			if (result.content.length === 1) {
				const item = result.content[0];
				if (item) {
					const key = `${toolInvocation.toolName}-result-single-${typeof item === "string" ? "text" : item.type}`;
					return renderResultContent(item, key);
				}
			}

			return (
				<div className="rounded-[var(--radius)] border border-border overflow-hidden">
					<div className="bg-muted/50 px-3 py-1.5 border-b border-border">
						<span className="text-xs font-medium">
							Result List ({result.content.length})
						</span>
					</div>
					<div className="divide-y divide-border">
						{result.content.map((item, index) => {
							const key = `${toolInvocation.toolName}-result-${index}-${typeof item === "string" ? "text" : item.type}`;
							return (
								<div key={key} className="p-2">
									{renderResultContent(item, key)}
								</div>
							);
						})}
					</div>
				</div>
			);
		}

		return null;
	};

	return (
		<div
			className={cn(
				"border rounded-[var(--radius)] my-3 shadow-[var(--shadow-xs)]",
				hasError
					? "border-destructive/50 bg-destructive/10"
					: "border-primary/30 bg-accent/30",
			)}
		>
			<Accordion
				type="single"
				collapsible
				defaultValue={hasError ? "item-0" : undefined}
			>
				<AccordionItem value="item-0" className="border-0">
					<AccordionTrigger className="px-3 py-2 hover:no-underline">
						<div className="flex items-center gap-2 w-full">
							{getToolIcon(toolName)}
							<span
								className={cn(
									"font-medium",
									hasError ? "text-destructive" : "text-primary",
								)}
							>
								{toolName}
							</span>
							<div className="ml-auto flex items-center gap-1.5 text-xs">
								{getStatusIcon()}
								<span
									className={cn(
										hasError ? "text-destructive" : "text-muted-foreground",
										"font-medium",
									)}
								>
									{toolInvocation.state === "result"
										? hasError
											? "Execution Failed"
											: "Completed"
										: "Processing"}
								</span>
							</div>
						</div>
					</AccordionTrigger>
					<AccordionContent className="px-3 pb-3 pt-0">
						{toolInvocation.state === "result" && (
							<div className="text-sm">
								{hasError && (
									<div className="mb-3 p-3 rounded-[var(--radius)] bg-destructive/10 border border-destructive/30 text-destructive">
										<div className="flex items-center gap-2 mb-1.5">
											<IconAlertCircle size={16} />
											<span className="font-medium">Error Message</span>
										</div>
										<p className="text-xs whitespace-pre-wrap break-words">
											{errorMessage}
										</p>
									</div>
								)}

								<div className="bg-card rounded-[var(--radius)] overflow-hidden mb-3 border border-border">
									<div className="flex items-center justify-between px-3 py-1.5 bg-accent/50 border-b border-border">
										<div className="font-medium text-xs text-card-foreground flex items-center gap-1.5">
											<span>Input Parameters</span>
										</div>
									</div>
									<div className="p-3">
										<pre className="whitespace-pre-wrap break-words text-xs">
											{args}
										</pre>
									</div>
								</div>

								<div
									className={cn(
										"bg-card rounded-[var(--radius)] overflow-hidden border",
										hasError ? "border-destructive/50" : "border-border",
									)}
								>
									<div
										className={cn(
											"flex items-center justify-between px-3 py-1.5 border-b",
											hasError
												? "bg-destructive/10 border-destructive/50"
												: "bg-accent/50 border-border",
										)}
									>
										<div
											className={cn(
												"font-medium text-xs flex items-center gap-1.5",
												hasError ? "text-destructive" : "text-card-foreground",
											)}
										>
											Execution Results
										</div>
									</div>
									<div className="p-3">{renderResult()}</div>
								</div>
							</div>
						)}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	);
}
