"use client";

import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Code, FileText, Filter, Image, Table, X } from "lucide-react";
import { useTranslations } from "next-intl";

export interface Filters {
	kind: string;
}

interface ArtifactFiltersProps {
	filters: Filters;
	onChange: (filters: Filters) => void;
}

export function ArtifactFilters({ filters, onChange }: ArtifactFiltersProps) {
	const t = useTranslations("ArtifactManager");
	const hasActiveFilters = filters.kind !== "";

	const kindOptions = [
		{
			value: "text",
			label: t("text"),
			icon: FileText,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
		},
		{
			value: "code",
			label: t("code"),
			icon: Code,
			color: "text-green-600",
			bgColor: "bg-green-50",
		},
		{
			value: "sheet",
			label: t("sheet"),
			icon: Table,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
		},
		{
			value: "image",
			label: t("image"),
			icon: Image,
			color: "text-purple-600",
			bgColor: "bg-purple-50",
		},
	];

	const clearFilters = () => {
		onChange({
			kind: "",
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
					<Filter className="h-4 w-4 mr-1" />
					{t("filter")}
					{hasActiveFilters && (
						<div className="absolute top-0 right-0 h-2 w-2 bg-primary rounded-full" />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end">
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium">{t("filterCriteria")}</h4>
						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
								className="h-auto text-muted-foreground hover:text-foreground p-1"
							>
								<X className="h-4 w-4 mr-1" />
								{t("clear")}
							</Button>
						)}
					</div>

					<div>
						{/* 类型筛选 */}
						<div>
							<div className="text-sm font-medium mb-3">{t("typeFilter")}</div>
							<div className="grid grid-cols-2 gap-2">
								<button
									type="button"
									onClick={() => updateFilter("kind", "")}
									className={`p-3 rounded-lg border-2 transition-all text-left ${
										!filters.kind
											? "border-primary bg-primary/5 shadow-sm"
											: "border-border hover:border-muted-foreground/30"
									}`}
								>
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
											<Filter className="h-4 w-4 text-muted-foreground" />
										</div>
										<div>
											<div className="font-medium text-sm">{t("allTypes")}</div>
											<div className="text-xs text-muted-foreground">
												{t("allTypes")}
											</div>
										</div>
									</div>
									{!filters.kind && <div className="opacity-0" />}
								</button>

								{kindOptions.map((option) => {
									const Icon = option.icon;
									const isSelected = filters.kind === option.value;
									return (
										<button
											type="button"
											key={option.value}
											onClick={() => updateFilter("kind", option.value)}
											className={`p-3 rounded-lg border-2 transition-all text-left relative ${
												isSelected
													? "border-primary bg-primary/5 shadow-sm"
													: "border-border hover:border-muted-foreground/30"
											}`}
										>
											<div className="flex items-center gap-2">
												<div
													className={`w-8 h-8 rounded-md ${option.bgColor} flex items-center justify-center`}
												>
													<Icon className={`h-4 w-4 ${option.color}`} />
												</div>
												<div>
													<div className="font-medium text-sm">
														{option.label}
													</div>
													<div className="text-xs text-muted-foreground">
														Artifact
													</div>
												</div>
											</div>
											{isSelected && <div className="opacity-0" />}
										</button>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
