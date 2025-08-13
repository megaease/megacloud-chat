"use client";

import { Button } from "@/components/ui/button";
import { getArtifacts } from "@/lib/artifact-actions";
import type { Artifact } from "@/server/db/schema";
import { Plus } from "lucide-react";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArtifactFilters, type Filters } from "./ArtifactFilters";
import { ArtifactList } from "./ArtifactList";
import { ArtifactSearch } from "./ArtifactSearch";

interface ArtifactManagerProps {
	initialArtifacts: Artifact[];
}

export function ArtifactManager({ initialArtifacts }: ArtifactManagerProps) {
	const t = useTranslations("ArtifactManager");
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [artifacts, setArtifacts] = useState(initialArtifacts);
	const [filters, setFilters] = useState<Filters>({
		kind: "",
	});

	// Filter artifacts based on search and filters
	const filteredArtifacts = artifacts.filter((artifact) => {
		const searchLower = searchQuery.toLowerCase();
		const titleMatch = artifact.title.toLowerCase().includes(searchLower);
		const contentMatch = artifact.content.toLowerCase().includes(searchLower);
		const kindMatch = !filters.kind || artifact.kind === filters.kind;

		return (titleMatch || contentMatch) && kindMatch;
	});

	const handleCreateArtifact = () => {
		// 创建新聊天并导航到聊天页面，带上创建 artifact 的意图
		const newChatId = nanoid(16);
		router.push(`/chat/${newChatId}?createArtifact=true`);
	};

	const handleRefresh = async (silent = false) => {
		startTransition(async () => {
			try {
				const result = await getArtifacts();
				if (result.success && result.data) {
					setArtifacts(result.data);
					if (!silent) {
						toast.success(t("refreshSuccess"));
					}
				} else {
					toast.error(result.error || t("refreshFailed"));
				}
			} catch (error) {
				console.error("刷新 artifacts 失败：", error);
				toast.error(t("refreshError"));
			}
		});
	};

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
					<Button onClick={handleCreateArtifact}>
						<Plus className="h-4 w-4 mr-1" />
						{t("newArtifact")}
					</Button>
				</div>
			</div>

			{/* Artifact 列表 */}
			<ArtifactList
				artifacts={filteredArtifacts}
				loading={isPending}
				onRefresh={handleRefresh}
				onCreateArtifact={handleCreateArtifact}
			/>
		</div>
	);
}
