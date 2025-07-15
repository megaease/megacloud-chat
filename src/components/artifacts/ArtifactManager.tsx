"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ArtifactList } from "./ArtifactList";
import { ArtifactSearch } from "./ArtifactSearch";
import { ArtifactFilters } from "./ArtifactFilters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getArtifacts } from "@/lib/artifact-actions";
import { toast } from "sonner";
import type { Artifact } from "@/server/db/schema";

interface ArtifactManagerProps {
	initialArtifacts: Artifact[];
}

export function ArtifactManager({ initialArtifacts }: ArtifactManagerProps) {
	console.log("initialArtifacts", initialArtifacts);
	const [searchQuery, setSearchQuery] = useState("");
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [artifacts, setArtifacts] = useState(initialArtifacts);
	const [filters, setFilters] = useState({
		kind: "",
		language: "",
		isPublic: "",
		tags: [] as string[],
	});

	// Filter artifacts based on search and filters
	const filteredArtifacts = artifacts.filter((artifact) => {
		const searchLower = searchQuery.toLowerCase();
		const titleMatch = artifact.title.toLowerCase().includes(searchLower);
		const contentMatch = artifact.content.toLowerCase().includes(searchLower);
		const kindMatch = !filters.kind || artifact.kind === filters.kind;
		const languageMatch =
			!filters.language || artifact.language === filters.language;
		const publicMatch = !filters.isPublic || 
			artifact.isPublic.toString() === filters.isPublic;
		// TODO: 实现标签搜索
		const tagsMatch = filters.tags.length === 0; // 暂时忽略标签过滤

		return (titleMatch || contentMatch) && kindMatch && languageMatch && publicMatch && tagsMatch;
	});

	const handleCreateArtifact = () => {
		// 创建新聊天并导航到聊天页面，带上创建artifact的意图
		const newChatId = nanoid(16);
		router.push(`/chat/${newChatId}?createArtifact=true`);
	};

	const handleRefresh = async () => {
		startTransition(async () => {
			try {
				const result = await getArtifacts();
				if (result.success && result.data) {
					setArtifacts(result.data);
					toast.success("刷新成功");
				} else {
					toast.error(result.error || "刷新失败");
				}
			} catch (error) {
				console.error("刷新 artifacts 失败:", error);
				toast.error("刷新失败，请重试");
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
						<Plus className="h-4 w-4 mr-2" />
						新建 Artifact
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
