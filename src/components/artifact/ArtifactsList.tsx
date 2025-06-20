// components/artifact/ArtifactsList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Search,
	Filter,
	MoreVertical,
	Eye,
	Edit,
	Trash2,
	Share,
	Download,
	Calendar,
	Code,
	FileText,
	Table,
	Image,
} from "lucide-react";
import type { Artifact } from "@/server/db/schema";

interface ArtifactsListProps {
	userId: string;
	onSelectArtifact?: (artifact: Artifact) => void;
}

const kindIcons = {
	text: FileText,
	code: Code,
	sheet: Table,
	image: Image,
};

const kindLabels = {
	text: "Text",
	code: "Code",
	sheet: "Sheet",
	image: "Image",
};

export function ArtifactsList({
	userId,
	onSelectArtifact,
}: ArtifactsListProps) {
	const t = useTranslations();
	const [artifacts, setArtifacts] = useState<Artifact[]>([]);
	const [filteredArtifacts, setFilteredArtifacts] = useState<Artifact[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [kindFilter, setKindFilter] = useState<string>("all");
	const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
		null,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Fetch artifacts
	useEffect(() => {
		fetchArtifacts();
	}, [userId]);

	// Filter artifacts based on search and kind
	useEffect(() => {
		let filtered = artifacts;

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(artifact) =>
					artifact.title.toLowerCase().includes(query) ||
					artifact.content.toLowerCase().includes(query),
			);
		}

		if (kindFilter !== "all") {
			filtered = filtered.filter((artifact) => artifact.kind === kindFilter);
		}

		setFilteredArtifacts(filtered);
	}, [artifacts, searchQuery, kindFilter]);

	const fetchArtifacts = async () => {
		try {
			const response = await fetch(
				`/api/artifacts?userId=${encodeURIComponent(userId)}&limit=100`,
			);
			if (response.ok) {
				const data = await response.json();
				setArtifacts(data.artifacts);
			} else {
				console.error("Failed to fetch artifacts");
			}
		} catch (error) {
			console.error("Error fetching artifacts:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteArtifact = async (artifactId: string) => {
		if (!confirm("Are you sure you want to delete this artifact?")) {
			return;
		}

		try {
			const response = await fetch(
				`/api/artifacts/${artifactId}?userId=${encodeURIComponent(userId)}`,
				{ method: "DELETE" },
			);

			if (response.ok) {
				setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
			} else {
				console.error("Failed to delete artifact");
			}
		} catch (error) {
			console.error("Error deleting artifact:", error);
		}
	};

	const handleShareArtifact = async (artifact: Artifact) => {
		try {
			// Toggle public status
			const response = await fetch(`/api/artifacts/${artifact.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					isPublic: !artifact.isPublic,
				}),
			});

			if (response.ok) {
				const { artifact: updatedArtifact } = await response.json();
				setArtifacts((prev) =>
					prev.map((a) => (a.id === artifact.id ? updatedArtifact : a)),
				);
			}
		} catch (error) {
			console.error("Error updating artifact:", error);
		}
	};

	const handleDownloadArtifact = (artifact: Artifact) => {
		const fileExtension = getFileExtension(artifact.kind);
		const filename = `${artifact.title}.${fileExtension}`;
		const blob = new Blob([artifact.content], {
			type: getContentType(artifact.kind),
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const viewArtifact = (artifact: Artifact) => {
		setSelectedArtifact(artifact);
		setIsDialogOpen(true);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header and Controls */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-2xl font-bold">Artifacts</h2>
					<p className="text-muted-foreground">
						Manage your created documents and code snippets
					</p>
				</div>

				<div className="flex items-center gap-2">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search artifacts..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 w-[300px]"
						/>
					</div>

					<Select value={kindFilter} onValueChange={setKindFilter}>
						<SelectTrigger className="w-[120px]">
							<Filter className="h-4 w-4 mr-2" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="text">Text</SelectItem>
							<SelectItem value="code">Code</SelectItem>
							<SelectItem value="sheet">Sheet</SelectItem>
							<SelectItem value="image">Image</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Artifacts Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{filteredArtifacts.map((artifact) => {
					const IconComponent =
						kindIcons[artifact.kind as keyof typeof kindIcons];
					return (
						<Card
							key={artifact.id}
							className="group hover:shadow-md transition-shadow"
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										<IconComponent className="h-4 w-4 text-muted-foreground" />
										<Badge variant="secondary">
											{kindLabels[artifact.kind as keyof typeof kindLabels]}
										</Badge>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
											>
												<MoreVertical className="h-3 w-3" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => viewArtifact(artifact)}>
												<Eye className="h-4 w-4 mr-2" />
												View
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onSelectArtifact?.(artifact)}
											>
												<Edit className="h-4 w-4 mr-2" />
												Open
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleShareArtifact(artifact)}
											>
												<Share className="h-4 w-4 mr-2" />
												{artifact.isPublic ? "Make Private" : "Make Public"}
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleDownloadArtifact(artifact)}
											>
												<Download className="h-4 w-4 mr-2" />
												Download
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleDeleteArtifact(artifact.id)}
												className="text-destructive"
											>
												<Trash2 className="h-4 w-4 mr-2" />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								<CardTitle className="text-lg truncate">
									{artifact.title}
								</CardTitle>
								<CardDescription className="flex items-center gap-2 text-xs">
									<Calendar className="h-3 w-3" />
									{formatDistanceToNow(new Date(artifact.updatedAt), {
										addSuffix: true,
									})}
									{artifact.isPublic && (
										<Badge variant="outline" className="text-xs">
											Public
										</Badge>
									)}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground line-clamp-3">
									{artifact.content}
								</p>
								<div className="flex items-center justify-between mt-3">
									<Badge variant="outline" className="text-xs">
										v{artifact.version}
									</Badge>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onSelectArtifact?.(artifact)}
										className="text-xs"
									>
										Open
									</Button>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{filteredArtifacts.length === 0 && (
				<div className="text-center py-12">
					<FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
					<h3 className="text-lg font-semibold mb-2">No artifacts found</h3>
					<p className="text-muted-foreground">
						{searchQuery || kindFilter !== "all"
							? "Try adjusting your search or filters"
							: "Start creating documents and code to see them here"}
					</p>
				</div>
			)}

			{/* View Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{selectedArtifact && (
								<>
									{React.createElement(
										kindIcons[selectedArtifact.kind as keyof typeof kindIcons],
										{ className: "h-5 w-5" },
									)}
									{selectedArtifact.title}
								</>
							)}
						</DialogTitle>
						<DialogDescription>
							{selectedArtifact && (
								<div className="flex items-center gap-4 text-sm">
									<Badge>
										{
											kindLabels[
												selectedArtifact.kind as keyof typeof kindLabels
											]
										}
									</Badge>
									<span>Version {selectedArtifact.version}</span>
									<span>
										Updated{" "}
										{formatDistanceToNow(new Date(selectedArtifact.updatedAt), {
											addSuffix: true,
										})}
									</span>
								</div>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="overflow-auto max-h-[60vh]">
						{selectedArtifact && (
							<pre className="whitespace-pre-wrap text-sm p-4 bg-muted rounded-lg">
								{selectedArtifact.content}
							</pre>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Helper functions
function getFileExtension(kind: string): string {
	switch (kind) {
		case "code":
			return "js";
		case "text":
			return "md";
		case "sheet":
			return "csv";
		case "image":
			return "png";
		default:
			return "txt";
	}
}

function getContentType(kind: string): string {
	switch (kind) {
		case "code":
			return "text/javascript";
		case "text":
			return "text/markdown";
		case "sheet":
			return "text/csv";
		case "image":
			return "image/png";
		default:
			return "text/plain";
	}
}
