"use client";

import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";

interface Filters {
	kind: string;
	language: string;
	isPublic: string;
	tags: string[];
}

interface ArtifactFiltersProps {
	filters: Filters;
	onChange: (filters: Filters) => void;
}

export function ArtifactFilters({ filters, onChange }: ArtifactFiltersProps) {
	const hasActiveFilters = Object.values(filters).some((value) =>
		Array.isArray(value) ? value.length > 0 : value !== "",
	);

	const clearFilters = () => {
		onChange({
			kind: "",
			language: "",
			isPublic: "",
			tags: [],
		});
	};

	const updateFilter = (key: keyof Filters, value: string) => {
		onChange({
			...filters,
			[key]: value,
		});
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" className="relative">
					<Filter className="h-4 w-4 mr-2" />
					筛选
					{hasActiveFilters && (
						<span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">筛选条件</h4>
						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
								className="h-auto p-0 text-muted-foreground hover:text-foreground"
							>
								<X className="h-4 w-4 mr-1" />
								清除
							</Button>
						)}
					</div>

					<div className="space-y-3">
						<div>
							<div className="text-sm font-medium mb-2">类型</div>
							<Select
								value={filters.kind}
								onValueChange={(value) => updateFilter("kind", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="选择类型" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">全部</SelectItem>
									<SelectItem value="text">文本</SelectItem>
									<SelectItem value="code">代码</SelectItem>
									<SelectItem value="sheet">表格</SelectItem>
									<SelectItem value="image">图片</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<div className="text-sm font-medium mb-2">编程语言</div>
							<Select
								value={filters.language}
								onValueChange={(value) => updateFilter("language", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="选择语言" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">全部</SelectItem>
									<SelectItem value="html">HTML</SelectItem>
									<SelectItem value="react">React</SelectItem>
									<SelectItem value="javascript">JavaScript</SelectItem>
									<SelectItem value="python">Python</SelectItem>
									<SelectItem value="css">CSS</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<div className="text-sm font-medium mb-2">可见性</div>
							<Select
								value={filters.isPublic}
								onValueChange={(value) => updateFilter("isPublic", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="选择可见性" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">全部</SelectItem>
									<SelectItem value="true">公开</SelectItem>
									<SelectItem value="false">私有</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
