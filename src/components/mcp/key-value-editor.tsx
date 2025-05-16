"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ArrowRightCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface KeyValueEditorProps {
	value: Record<string, string>;
	onChange: (value: Record<string, string>) => void;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
}

export function KeyValueEditor({
	value,
	onChange,
	keyPlaceholder = "Key",
	valuePlaceholder = "Value",
}: KeyValueEditorProps) {
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");
	const [isFocused, setIsFocused] = useState(false);

	// Add new key-value pair
	const handleAdd = () => {
		if (!newKey.trim()) return;

		onChange({
			...value,
			[newKey]: newValue,
		});

		setNewKey("");
		setNewValue("");
	};

	// Remove key-value pair
	const handleRemove = (key: string) => {
		const newValue = { ...value };
		delete newValue[key];
		onChange(newValue);
	};

	// Update value
	const handleValueChange = (key: string, newVal: string) => {
		onChange({
			...value,
			[key]: newVal,
		});
	};

	// Handle key press events (Enter to add)
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && newKey.trim()) {
			e.preventDefault();
			handleAdd();
		}
	};

	return (
		<div className="space-y-2">
			{/* Existing key-value pairs */}
			{Object.entries(value).map(([key, val]) => (
				<div key={key} className="flex items-center gap-2">
					<div className="flex-1 flex items-center gap-2">
						<Input value={key} disabled className="bg-muted" />
						<Input
							value={val}
							onChange={(e) => handleValueChange(key, e.target.value)}
							placeholder={valuePlaceholder}
						/>
					</div>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => handleRemove(key)}
								>
									<X className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Remove this item</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			))}

			{/* Add new key-value pair */}
			<div className="space-y-1.5">
				<div
					className={cn(
						"flex items-center gap-2 p-2 rounded-md transition-colors",
						(newKey || isFocused) &&
							"bg-muted/50 border border-dashed border-primary/30",
					)}
				>
					<div className="flex-1 flex items-center gap-2">
						<Input
							value={newKey}
							onChange={(e) => setNewKey(e.target.value)}
							placeholder={keyPlaceholder}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							className={cn(newKey && "border-primary/50")}
							onKeyDown={handleKeyPress}
						/>
						<Input
							value={newValue}
							onChange={(e) => setNewValue(e.target.value)}
							placeholder={valuePlaceholder}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							onKeyDown={handleKeyPress}
						/>
					</div>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant={newKey.trim() ? "default" : "outline"}
									onClick={handleAdd}
									disabled={!newKey.trim()}
									className="gap-1"
								>
									<ArrowRightCircle className="h-4 w-4" />
									<span>Add</span>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Click to add this item</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				{newKey.trim() && (
					<p className="text-xs text-muted-foreground px-1">
						<span className="text-primary">*</span>{" "}
						Please click the "Add" button to save this item
					</p>
				)}
			</div>
		</div>
	);
}
