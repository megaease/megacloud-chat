"use client";

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { nanoid } from "nanoid";

interface KeyValuePairProps {
	pairs: Record<string, string>;
	onChange: (newPairs: Record<string, string>) => void;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
	className?: string;
}

export function KeyValuePairInput({
	pairs,
	onChange,
	keyPlaceholder = "键",
	valuePlaceholder = "值",
	className = "",
}: KeyValuePairProps) {
	const [items, setItems] = useState<
		{ key: string; value: string; id: string }[]
	>(
		Object.entries(pairs).map(([key, value]) => ({
			key,
			value,
			id: nanoid(),
		})),
	);

	const handleAddItem = () => {
		setItems([...items, { key: "", value: "", id: nanoid() }]);
	};

	const handleRemoveItem = (idToRemove: string) => {
		const newItems = items.filter((item) => item.id !== idToRemove);
		setItems(newItems);
		// 更新父组件的值
		updateParentValue(newItems);
	};

	const handleItemChange = (
		id: string,
		field: "key" | "value",
		newValue: string,
	) => {
		const newItems = items.map((item) =>
			item.id === id ? { ...item, [field]: newValue } : item,
		);
		setItems(newItems);
		// 更新父组件的值
		updateParentValue(newItems);
	};

	// 将键值对数组转换回对象并通知父组件
	const updateParentValue = (
		newItems: { key: string; value: string; id: string }[],
	) => {
		const newPairs: Record<string, string> = {};
		for (const item of newItems) {
			if (item.key.trim()) {
				// 只包含有效键的项
				newPairs[item.key] = item.value;
			}
		}
		onChange(newPairs);
	};

	return (
		<div className={`space-y-2 ${className}`}>
			{items.map((item) => (
				<div key={item.id} className="flex items-center gap-2">
					<Input
						placeholder={keyPlaceholder}
						value={item.key}
						onChange={(e) => handleItemChange(item.id, "key", e.target.value)}
						className="flex-1"
					/>
					<Input
						placeholder={valuePlaceholder}
						value={item.value}
						onChange={(e) => handleItemChange(item.id, "value", e.target.value)}
						className="flex-1"
					/>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => handleRemoveItem(item.id)}
						className="h-10 w-10 flex-shrink-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={handleAddItem}
				className="mt-2"
			>
				<Plus className="mr-2 h-4 w-4" />
				添加项
			</Button>
		</div>
	);
}
