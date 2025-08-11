"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/prompt-kit/loader";
import {
	FileText,
	Code,
	Table,
	Image,
	ArrowLeft,
	Edit,
	Copy,
	Trash2,
	ExternalLink,
	Clock,
	User,
	Tag,
	Globe,
	Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/server/db/schema";

interface ArtifactDetailProps {
	artifactId: string;
}

const kindIcons = {
	text: FileText,
	code: Code,
	sheet: Table,
	image: Image,
};

// 简单的时间格式化函数
function formatDate(date: Date): string {
	return new Intl.DateTimeFormat("zh-CN", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
}

export function ArtifactDetail({ artifactId }: ArtifactDetailProps) {
	const router = useRouter();
	const [artifact, setArtifact] = useState<Artifact | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchArtifact = async () => {
			try {
				setLoading(true);
				const response = await fetch(`/api/artifacts/${artifactId}`);

				if (!response.ok) {
					throw new Error("Artifact not found");
				}

				const data = await response.json();
				setArtifact(data.artifact);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to load artifact",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchArtifact();
	}, [artifactId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
			<Loader />
			</div>
		);
	}

	if (error || !artifact) {
		return (
			<div className="text-center py-12">
				<div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
					<FileText className="h-8 w-8 text-muted-foreground" />
				</div>
				<h3 className="text-lg font-medium mb-2">Artifact 未找到</h3>
				<p className="text-muted-foreground mb-4">
					{error || "请检查 URL 是否正确"}
				</p>
				<Button onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					返回
				</Button>
			</div>
		);
	}

	const Icon = kindIcons[artifact.kind as keyof typeof kindIcons] || FileText;

	return (
		<div className="space-y-6">
			{/* 头部导航 */}
			<div className="flex items-center justify-between">
				<Button variant="ghost" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					返回
				</Button>
				<div className="flex items-center gap-2">
					<Button variant="outline">
						<Edit className="h-4 w-4 mr-2" />
						编辑
					</Button>
					<Button variant="outline">
						<Copy className="h-4 w-4 mr-2" />
						复制
					</Button>
					<Button variant="outline">
						<ExternalLink className="h-4 w-4 mr-2" />
						打开
					</Button>
					<Button variant="outline" className="text-destructive">
						<Trash2 className="h-4 w-4 mr-2" />
						删除
					</Button>
				</div>
			</div>

			{/* 主要信息 */}
			<Card>
				<CardHeader>
					<div className="flex items-start gap-4">
						<div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
							<Icon className="h-8 w-8" />
						</div>
						<div className="flex-1">
							<CardTitle className="text-2xl mb-2">{artifact.title}</CardTitle>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<div className="flex items-center gap-1">
									<Clock className="h-4 w-4" />
									<span>创建于 {formatDate(artifact.createdAt)}</span>
								</div>
								<div className="flex items-center gap-1">
									<User className="h-4 w-4" />
									<span>版本 {artifact.version}</span>
								</div>
								{artifact.isPublic ? (
									<div className="flex items-center gap-1">
										<Globe className="h-4 w-4" />
										<span>公开</span>
									</div>
								) : (
									<div className="flex items-center gap-1">
										<Lock className="h-4 w-4" />
										<span>私有</span>
									</div>
								)}
							</div>
							<div className="flex items-center gap-2 mt-3">
								<Badge variant="secondary">{artifact.kind}</Badge>
								{artifact.language && (
									<Badge variant="outline">{artifact.language}</Badge>
								)}
								{artifact.tags && artifact.tags.length > 0 && (
									<div className="flex items-center gap-1">
										<Tag className="h-4 w-4" />
										{artifact.tags.map((tag) => (
											<Badge key={tag} variant="outline" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</CardHeader>
			</Card>

			{/* 内容预览 */}
			<Card>
				<CardHeader>
					<CardTitle>内容预览</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="border rounded-lg p-4 bg-muted/50">
						<pre className="whitespace-pre-wrap text-sm max-h-96 overflow-auto">
							{artifact.content}
						</pre>
					</div>
				</CardContent>
			</Card>

			{/* 元数据 */}
			<Card>
				<CardHeader>
					<CardTitle>详细信息</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								Artifact ID
							</div>
							<div className="mt-1 font-mono text-sm">{artifact.id}</div>
						</div>
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								Chat ID
							</div>
							<div className="mt-1 font-mono text-sm">{artifact.chatId}</div>
						</div>
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								最后更新
							</div>
							<div className="mt-1 text-sm">
								{formatDate(artifact.updatedAt)}
							</div>
						</div>
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								用户 ID
							</div>
							<div className="mt-1 font-mono text-sm">{artifact.userId}</div>
						</div>
					</div>
					{artifact.changeDescription && (
						<div>
							<div className="text-sm font-medium text-muted-foreground">
								变更说明
							</div>
							<div className="mt-1 text-sm">{artifact.changeDescription}</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
