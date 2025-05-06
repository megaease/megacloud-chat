"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface KeyValueEditorProps {
	value: Record<string, string>;
	onChange: (value: Record<string, string>) => void;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
}

export function KeyValueEditor({
	value,
	onChange,
	keyPlaceholder = "键",
	valuePlaceholder = "值",
}: KeyValueEditorProps) {
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");

	// 添加新的键值对
	const handleAdd = () => {
		if (!newKey.trim()) return;

		onChange({
			...value,
			[newKey]: newValue,
		});

		setNewKey("");
		setNewValue("");
	};

	// 删除键值对
	const handleRemove = (key: string) => {
		const newValue = { ...value };
		delete newValue[key];
		onChange(newValue);
	};

	// 更新值
	const handleValueChange = (key: string, newVal: string) => {
		onChange({
			...value,
			[key]: newVal,
		});
	};

	return (
		<div className="space-y-2">
			{/* 现有键值对 */}
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
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => handleRemove(key)}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			))}

			{/* 添加新键值对 */}
			<div className="flex items-center gap-2">
				<div className="flex-1 flex items-center gap-2">
					<Input
						value={newKey}
						onChange={(e) => setNewKey(e.target.value)}
						placeholder={keyPlaceholder}
					/>
					<Input
						value={newValue}
						onChange={(e) => setNewValue(e.target.value)}
						placeholder={valuePlaceholder}
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={handleAdd}
					disabled={!newKey.trim()}
				>
					<Plus className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
