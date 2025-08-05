"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArtifactCard } from "./ArtifactCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/spinner";
import { Grid, List, RefreshCw } from "lucide-react";
import type { Artifact } from "@/server/db/schema";

interface ArtifactListProps {
	artifacts: Artifact[];
	loading?: boolean;
	onRefresh?: (silent?: boolean) => void;
	onCreateArtifact?: () => void;
}

type ViewMode = "grid" | "list";

export function ArtifactList({
	artifacts,
	loading = false,
	onRefresh,
	onCreateArtifact,
}: ArtifactListProps) {
	const t = useTranslations("ArtifactManager");
	const [viewMode, setViewMode] = useState<ViewMode>("grid");

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12 w-full h-full">
				<Spinner />
			</div>
		);
	}

	if (artifacts.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
					<Grid className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-medium mb-2">{t("noArtifacts")}</h3>
				<p className="text-muted-foreground mb-4">
					{t("noArtifactsDesc")}
				</p>
				<Button onClick={onCreateArtifact}>{t("createFirst")}</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* 工具栏 */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Badge variant="secondary">{artifacts.length} {t("versions")}</Badge>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center border rounded-md">
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className="rounded-r-none"
						>
							<Grid className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("list")}
							className="rounded-l-none"
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
					{onRefresh && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onRefresh()}
							disabled={loading}
						>
							<RefreshCw className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			{/* Artifacts 网格/列表 */}
			<div
				className={
					viewMode === "grid"
						? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
						: "space-y-2"
				}
			>
				{artifacts.map((artifact) => (
					<ArtifactCard
						key={`${artifact.id}-${artifact.version}`}
						artifact={artifact}
						viewMode={viewMode}
						onUpdate={onRefresh}
					/>
				))}
			</div>
		</div>
	);
}
