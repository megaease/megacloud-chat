"use client";

import { useState } from "react";
import { ArtifactList } from "./ArtifactList";
import { ArtifactSearch } from "./ArtifactSearch";
import { ArtifactFilters } from "./ArtifactFilters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Artifact } from "@/server/db/schema";

interface ArtifactManagerProps {
	initialArtifacts: Artifact[];
}

export function ArtifactManager({ initialArtifacts }: ArtifactManagerProps) {
	console.log("initialArtifacts", initialArtifacts);
	const [searchQuery, setSearchQuery] = useState("");
	const [filters, setFilters] = useState({
		kind: "",
		language: "",
	});

	// Filter artifacts based on search and filters
	const filteredArtifacts = initialArtifacts.filter((artifact) => {
		const searchLower = searchQuery.toLowerCase();
		const titleMatch = artifact.title.toLowerCase().includes(searchLower);
		const contentMatch = artifact.content.toLowerCase().includes(searchLower);
		const kindMatch = !filters.kind || artifact.kind === filters.kind;
		const languageMatch =
			!filters.language || artifact.language === filters.language;

		return (titleMatch || contentMatch) && kindMatch && languageMatch;
	});

	return (
		<div className="space-y-6">
			{/* 搜索和筛选栏 */}
			<div className="flex flex-col lg:flex-row gap-4">
				<div className="flex-1">
					<ArtifactSearch
						value={searchQuery}
						onChange={setSearchQuery}
						onSearch={() => {}} // No-op, filtering is client-side
					/>
				</div>
				<div className="flex items-center gap-2">
					<ArtifactFilters filters={filters} onChange={setFilters} />
					<Button>
						<Plus className="h-4 w-4 mr-2" />
						新建 Artifact
					</Button>
				</div>
			</div>

			{/* Artifact 列表 */}
			<ArtifactList
				artifacts={filteredArtifacts}
				loading={false} // Data is pre-loaded
				onRefresh={() => window.location.reload()} // Simple refresh
			/>
		</div>
	);
}
