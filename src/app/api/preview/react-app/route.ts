import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getArtifactById } from "@/server/db/queries/artifacts";
import type { ReactAppContent } from "@/lib/artifact-types";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { artifactId, userId } = body;

		if (!artifactId || !userId) {
			return NextResponse.json(
				{ error: "Artifact ID and user ID are required" },
				{ status: 400 }
			);
		}

		// 获取 artifact 数据
		const artifact = await getArtifactById(artifactId);
		if (!artifact) {
			return NextResponse.json(
				{ error: "Artifact not found" },
				{ status: 404 }
			);
		}

		// 解析 React App 内容
		let reactAppContent: ReactAppContent;
		try {
			reactAppContent = JSON.parse(artifact.content) as ReactAppContent;
		} catch (error) {
			return NextResponse.json(
				{ error: "Invalid React app content format" },
				{ status: 400 }
			);
		}

		// 如果已经有预览 URL，直接返回
		if (reactAppContent.previewUrl) {
			return NextResponse.json({
				success: true,
				url: reactAppContent.previewUrl,
				cached: true,
			});
		}

		// 调用现有的 React App 服务来创建预览
		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/react-app/generate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: artifact.title,
					userId,
					chatId: artifact.chatId,
					autoStart: true,
				}),
			});

			const result = await response.json();

			if (result.success) {
				return NextResponse.json({
					success: true,
					url: result.previewUrl,
					sandboxId: result.sandboxId,
				});
			} else {
				return NextResponse.json(
					{ error: result.error || "Failed to create preview" },
					{ status: 500 }
				);
			}
		} catch (error) {
			console.error("Preview creation error:", error);
			return NextResponse.json(
				{ error: "Failed to create preview" },
				{ status: 500 }
			);
		}

	} catch (error) {
		console.error("Preview API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
