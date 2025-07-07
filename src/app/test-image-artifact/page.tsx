"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArtifactProvider, useArtifact } from "@/context/artifact-provider-context";
import { ArtifactContent } from "@/components/artifact/ArtifactContent";
import type { UIArtifact } from "@/lib/artifact-types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function TestImageArtifactContent() {
	const { setArtifact, artifact } = useArtifact();
	const [imageUrl, setImageUrl] = useState("https://picsum.photos/800/600");
	const [base64Data, setBase64Data] = useState("");
	const [title, setTitle] = useState("Test Image");

	const testUrlImage = () => {
		const artifactData: UIArtifact = {
			documentId: "test-image-url",
			title: title,
			kind: "image",
			content: imageUrl,
			isVisible: true,
			status: "idle",
			boundingBox: {
				top: 0,
				left: 0,
				width: 600,
				height: 400,
			},
		};
		setArtifact(artifactData);
	};

	const testBase64Image = () => {
		if (!base64Data) {
			alert("请输入 base64 数据");
			return;
		}
		
		const artifactData: UIArtifact = {
			documentId: "test-image-base64",
			title: title,
			kind: "image",
			content: base64Data,
			isVisible: true,
			status: "idle",
			boundingBox: {
				top: 0,
				left: 0,
				width: 600,
				height: 400,
			},
		};
		setArtifact(artifactData);
	};

	const testSampleImage = () => {
		// 一个简单的 1x1 红色像素的 base64 图片
		const redPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
		
		const artifactData: UIArtifact = {
			documentId: "test-image-sample",
			title: "Sample Red Pixel",
			kind: "image",
			content: redPixel,
			isVisible: true,
			status: "idle",
			boundingBox: {
				top: 0,
				left: 0,
				width: 600,
				height: 400,
			},
		};
		setArtifact(artifactData);
	};

	return (
		<div className="container mx-auto p-6 max-w-6xl">
			<h1 className="text-3xl font-bold mb-6">图片 Artifact 测试</h1>
			
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 控制面板 */}
				<div className="space-y-6">
					<div className="p-4 border rounded-lg">
						<h2 className="text-xl font-semibold mb-4">测试控制</h2>
						
						<div className="space-y-4">
							<div>
								<Label htmlFor="title">标题</Label>
								<Input
									id="title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="输入图片标题"
								/>
							</div>
							
							<div>
								<Label htmlFor="imageUrl">图片 URL</Label>
								<Input
									id="imageUrl"
									value={imageUrl}
									onChange={(e) => setImageUrl(e.target.value)}
									placeholder="输入图片 URL"
								/>
								<Button 
									onClick={testUrlImage} 
									className="mt-2"
									variant="outline"
								>
									测试 URL 图片
								</Button>
							</div>
							
							<div>
								<Label htmlFor="base64">Base64 数据</Label>
								<Textarea
									id="base64"
									value={base64Data}
									onChange={(e) => setBase64Data(e.target.value)}
									placeholder="输入 base64 图片数据 (可包含或不包含 data:image 前缀)"
									rows={4}
								/>
								<Button 
									onClick={testBase64Image} 
									className="mt-2"
									variant="outline"
								>
									测试 Base64 图片
								</Button>
							</div>
							
							<div className="pt-4 border-t">
								<Button 
									onClick={testSampleImage} 
									className="w-full"
									variant="default"
								>
									测试示例图片 (红色像素)
								</Button>
							</div>
						</div>
					</div>
					
					<div className="p-4 border rounded-lg">
						<h3 className="text-lg font-semibold mb-2">使用说明</h3>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>• URL 图片：支持 http/https 链接</li>
							<li>• Base64：支持带前缀或不带前缀的格式</li>
							<li>• 示例图片：测试基本功能</li>
							<li>• 右侧会显示 artifact 预览</li>
						</ul>
					</div>

					<div className="p-4 border rounded-lg">
						<h3 className="text-lg font-semibold mb-2">当前状态</h3>
						<div className="text-sm space-y-1">
							<p><strong>ID:</strong> {artifact.documentId || "无"}</p>
							<p><strong>标题:</strong> {artifact.title || "无"}</p>
							<p><strong>类型:</strong> {artifact.kind}</p>
							<p><strong>状态:</strong> {artifact.status}</p>
						</div>
					</div>
				</div>
				
				{/* Artifact 预览 */}
				<div className="border rounded-lg overflow-hidden h-[600px]">
					{artifact.kind === "image" && artifact.content ? (
						<ArtifactContent />
					) : (
						<div className="h-full flex items-center justify-center text-muted-foreground">
							点击左侧按钮测试图片显示
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function TestImageArtifactPage() {
	return (
		<QueryClientProvider client={queryClient}>
			<ArtifactProvider>
				<TestImageArtifactContent />
			</ArtifactProvider>
		</QueryClientProvider>
	);
}
