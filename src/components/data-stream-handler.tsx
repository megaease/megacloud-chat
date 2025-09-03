"use client";

import { useArtifact } from "@/context/artifact-provider-context";
import type { ArtifactLanguage } from "@/lib/artifact-types";
import type { StreamDelta } from "@/types/stream-delta";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
	const { dataStream } = useDataStream();

	const { artifact, setArtifact, userIntentToHide, setUserIntentToHide } =
		useArtifact();
	const queryClient = useQueryClient();
	const lastProcessedIndex = useRef(-1);

	useEffect(() => {
		if (!dataStream?.length) return;

		const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
		lastProcessedIndex.current = dataStream.length - 1;

		for (const delta of newDeltas) {
			// 直接处理数据流，不使用 artifactDefinitions
			setArtifact((draftArtifact) => {
				switch (delta.type) {
					case "data-id":
						// 新内容开始时，重置用户隐藏意图
						setUserIntentToHide(false);
						return {
							...draftArtifact,
							documentId: delta.data as string,
							status: "streaming" as const,
						};

					case "data-title":
						return {
							...draftArtifact,
							title: delta.data as string,
							status: "streaming" as const,
						};

					case "data-kind":
						return {
							...draftArtifact,
							kind: delta.data as "text" | "code" | "sheet" | "image" | "react-app",
							status: "streaming" as const,
						};

					case "data-language":
						return {
							...draftArtifact,
							language: delta.data as ArtifactLanguage,
							status: "streaming" as const,
						};

					case "data-clear":
						return {
							...draftArtifact,
							content: "",
							status: "streaming" as const,
						};

					case "data-finish":
						// 当新版本生成完成后，刷新版本列表缓存
						if (draftArtifact.documentId) {
							queryClient.invalidateQueries({
								queryKey: ["artifact-versions", draftArtifact.documentId],
							});
						}
						return {
							...draftArtifact,
							status: "idle" as const,
						};

					default:
						// 处理内容增量
						if (
							delta.type === "data-textDelta" ||
							delta.type === "data-codeDelta" ||
							delta.type === "data-sheetDelta" ||
							delta.type === "data-imageDelta" ||
							delta.type === "data-reactAppDelta"
						) {
							const newContent = draftArtifact.content + (delta.data as string);
							const isFirstContent = draftArtifact.content.length === 0;

							// 智能判断显示时机 - 只有在用户没有主动隐藏时才自动显示
							let shouldShow = draftArtifact.isVisible; // 保持当前状态

							// 只有在用户没有主动隐藏时，才考虑自动显示
							if (!userIntentToHide) {
								if (draftArtifact.kind === "text") {
									// 文本类型：在 stream 过程中尽早显示
									shouldShow = newContent.length > 0;
								} else if (draftArtifact.kind === "code") {
									// 代码类型：有内容就显示
									shouldShow = newContent.length > 0;
								} else if (draftArtifact.kind === "sheet") {
									// 表格类型：有内容就显示
									shouldShow = newContent.length > 0;
								} else if (draftArtifact.kind === "image") {
									// 图片类型：有内容就显示
									shouldShow = newContent.length > 0;
								} else if (draftArtifact.kind === "react-app") {
									// React App 类型：当有完整的文件结构时显示
									try {
										const parsed = JSON.parse(newContent);
										shouldShow = parsed.files && parsed.files.length > 0;
									} catch {
										// JSON 解析失败时保持隐藏
										shouldShow = false;
									}
								}
							}

							return {
								...draftArtifact,
								content: newContent,
								isVisible: shouldShow,
							};
						}

						return draftArtifact;
				}
			});
		}
	}, [dataStream, setArtifact, queryClient]);

	return null;
}
