// components/TipsSection.tsx
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { IconKeyboard, IconSearch, IconTarget } from "@tabler/icons-react";

export function TipsSection() {
	return (
		<CommandGroup heading="📚 Usage Tips">
			<CommandItem
				value="tips:keyboard-shortcuts-tips"
				className="flex flex-col items-start gap-2 py-4 cursor-default"
				onSelect={() => {}}
			>
				<div className="w-full">
					<div className="flex items-center gap-2 mb-2">
						<IconKeyboard className="h-5 w-5 text-yellow-500" />
						<h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
					</div>
					<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
						<p>
							•{" "}
							<kbd className="px-1.5 py-0.5 rounded-md bg-muted border">⌘K</kbd>{" "}
							/{" "}
							<kbd className="px-1.5 py-0.5 rounded-md bg-muted border">
								Ctrl+K
							</kbd>{" "}
							- Open/close this dialog
						</p>
						<p>
							•{" "}
							<kbd className="px-1.5 py-0.5 rounded-md bg-muted border">P</kbd>{" "}
							- Quick filter providers
						</p>
						<p>
							•{" "}
							<kbd className="px-1.5 py-0.5 rounded-md bg-muted border">M</kbd>{" "}
							- Quick filter models
						</p>
						<p>
							•{" "}
							<kbd className="px-1.5 py-0.5 rounded-md bg-muted border">T</kbd>{" "}
							- Show tips (this section)
						</p>
					</div>
				</div>
			</CommandItem>

			<CommandItem
				value="tips:search-patterns-tips"
				className="flex flex-col items-start gap-2 py-4 cursor-default"
				onSelect={() => {}}
			>
				<div className="w-full">
					<div className="flex items-center gap-2 mb-2">
						<IconSearch className="h-5 w-5 text-blue-500" />
						<h4 className="font-medium text-sm">Search Patterns</h4>
					</div>
					<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
						<p>
							•{" "}
							<code className="px-1.5 py-0.5 rounded-md bg-muted border">
								provider:
							</code>{" "}
							- Filter and browse all providers
						</p>
						<p>
							•{" "}
							<code className="px-1.5 py-0.5 rounded-md bg-muted border">
								model:
							</code>{" "}
							- Filter and browse available models
						</p>
						<p>
							•{" "}
							<code className="px-1.5 py-0.5 rounded-md bg-muted border">
								tips:
							</code>{" "}
							- Show this help section
						</p>
						<p>• Just type any text to search across everything</p>
					</div>
				</div>
			</CommandItem>

			<CommandItem
				value="tips:workflow-tips"
				className="flex flex-col items-start gap-2 py-4 cursor-default"
				onSelect={() => {}}
			>
				<div className="w-full">
					<div className="flex items-center gap-2 mb-2">
						<IconTarget className="h-5 w-5 text-green-500" />
						<h4 className="font-medium text-sm">Workflow Tips</h4>
					</div>
					<div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
						<p>
							• Select a provider → automatically get "model:" to choose models
						</p>
						<p>
							• Current provider's models always show first for quick switching
						</p>
						<p>• Providers are grouped by type (OpenAI, Anthropic, etc.)</p>
						<p>• Use Quick Access for common actions</p>
					</div>
				</div>
			</CommandItem>
		</CommandGroup>
	);
}
