// components/artifact/ReactAppViewer.tsx
"use client";

import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactAppContent, UIArtifact } from "@/lib/artifact-types";
import {
	Download,
	ExternalLink,
	FileCode,
	FolderOpen,
	Loader2,
	Play,
} from "lucide-react";
import React, { useState, useEffect } from "react";

interface ReactAppViewerProps {
	artifact: UIArtifact;
	onPreview?: (artifactId: string) => Promise<void>;
}

export function ReactAppViewer({ artifact, onPreview }: ReactAppViewerProps) {
	const [content, setContent] = useState<ReactAppContent | null>(null);
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [isPreviewing, setIsPreviewing] = useState(false);

	useEffect(() => {
		try {
			const parsed = JSON.parse(artifact.content) as ReactAppContent;
			setContent(parsed);

			// Select the first file by default
			if (parsed.files && parsed.files.length > 0 && parsed.files[0]) {
				setSelectedFile(parsed.files[0].path);
			}
		} catch (error) {
			console.error("Failed to parse React app content:", error);
		}
	}, [artifact.content]);

	const handlePreview = async () => {
		if (!onPreview) return;

		setIsPreviewing(true);
		try {
			await onPreview(artifact.documentId);
		} catch (error) {
			console.error("Failed to start preview:", error);
		} finally {
			setIsPreviewing(false);
		}
	};

	const handleDownload = () => {
		if (!content) return;

		// Create a zip file in memory
		const zip = require("jszip")();

		// Add all files to zip
		content.files.forEach((file) => {
			zip.file(file.path, file.content);
		});

		// Generate and download zip
		zip.generateAsync({ type: "blob" }).then((blob: Blob) => {
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${artifact.title}.zip`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		});
	};

	const selectedFileContent = content?.files.find(
		(f) => f.path === selectedFile,
	);

	if (!content) {
		return (
			<Card className="w-full">
				<CardContent className="p-6">
					<div className="flex items-center justify-center">
						<Loader2 className="h-6 w-6 animate-spin" />
						<span className="ml-2">Loading React app...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<FileCode className="h-5 w-5" />
						{artifact.title}
					</CardTitle>
					<div className="flex items-center gap-2">
						{content.config?.typescript && (
							<Badge variant="secondary">TypeScript</Badge>
						)}
						{content.config?.tailwind && (
							<Badge variant="secondary">Tailwind</Badge>
						)}
						{content.config?.router && (
							<Badge variant="secondary">Router</Badge>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					{onPreview && (
						<Button onClick={handlePreview} disabled={isPreviewing} size="sm">
							{isPreviewing ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Starting...
								</>
							) : (
								<>
									<Play className="h-4 w-4 mr-2" />
									Preview
								</>
							)}
						</Button>
					)}
					<Button onClick={handleDownload} variant="outline" size="sm">
						<Download className="h-4 w-4 mr-2" />
						Download
					</Button>
					{content.previewUrl && (
						<Button asChild size="sm">
							<a
								href={content.previewUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Open Preview
							</a>
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="files" className="w-full">
					<TabsList>
						<TabsTrigger value="files" className="flex items-center gap-2">
							<FolderOpen className="h-4 w-4" />
							Files
						</TabsTrigger>
						{content.previewUrl && (
							<TabsTrigger value="preview">Preview</TabsTrigger>
						)}
					</TabsList>

					<TabsContent value="files" className="mt-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
							{/* File Tree */}
							<Card className="md:col-span-1">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm">Project Files</CardTitle>
								</CardHeader>
								<CardContent className="p-0">
									<ScrollArea className="h-[520px]">
										<div className="space-y-1 p-3">
											{content.files
												.sort((a, b) => a.path.localeCompare(b.path))
												.map((file) => (
													<button
														key={file.path}
														onClick={() => setSelectedFile(file.path)}
														className={`w-full text-left p-2 rounded hover:bg-accent text-sm ${
															selectedFile === file.path
																? "bg-accent text-accent-foreground"
																: ""
														}`}
													>
														{file.path}
													</button>
												))}
										</div>
									</ScrollArea>
								</CardContent>
							</Card>

							{/* Code Editor */}
							<Card className="md:col-span-2">
								<CardContent className="p-0 h-full">
									{selectedFileContent ? (
										<CodeEditor
											value={selectedFileContent.content}
											language={selectedFileContent.language}
											editable={false}
											className="h-full"
										/>
									) : (
										<div className="flex items-center justify-center h-full">
											<span className="text-muted-foreground">
												Select a file to view
											</span>
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					{content.previewUrl && (
						<TabsContent value="preview" className="mt-4">
							<Card>
								<CardContent className="p-0">
									<div className="h-[600px] w-full">
										<iframe
											src={content.previewUrl}
											className="w-full h-full border-0"
											title={`${artifact.title} Preview`}
										/>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					)}
				</Tabs>
			</CardContent>
		</Card>
	);
}
