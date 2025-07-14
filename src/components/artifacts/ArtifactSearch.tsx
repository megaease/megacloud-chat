"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface ArtifactSearchProps {
	value: string;
	onChange: (value: string) => void;
	onSearch: () => void;
}

export function ArtifactSearch({
	value,
	onChange,
	onSearch,
}: ArtifactSearchProps) {
	const [localValue, setLocalValue] = useState(value);

	// 防抖搜索
	useEffect(() => {
		const timer = setTimeout(() => {
			if (localValue !== value) {
				onChange(localValue);
			}
		}, 300);

		return () => clearTimeout(timer);
	}, [localValue, value, onChange]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onChange(localValue);
		onSearch();
	};

	const handleClear = () => {
		setLocalValue("");
		onChange("");
	};

	return (
		<form onSubmit={handleSubmit} className="relative">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="搜索标题、内容或标签..."
					value={localValue}
					onChange={(e) => setLocalValue(e.target.value)}
					className="pl-10 pr-10"
				/>
				{localValue && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleClear}
						className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</div>
		</form>
	);
}
