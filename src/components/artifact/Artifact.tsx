// components/artifact/Artifact.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArtifact } from "@/context/artifact-provider-context";
import { ArtifactContent } from "./ArtifactContent";
import { ArtifactActions } from "./ArtifactActions";
import { Button } from "@/components/ui/button";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";
import { X, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { ArtifactChat } from "./ArtifactChat";
import type { Message } from "@ai-sdk/react";
import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";

interface ArtifactVersion {
	id: string;
	version: number;
	title: string;
	content: string;
	kind: ArtifactKind;
	language?: ArtifactLanguage;
	updatedAt: string;
}

interface ArtifactProps {
	chatId: string;
	onClose?: () => void;
	// Chat state from parent component
	messages: Message[];
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => void;
	status: "error" | "submitted" | "streaming" | "ready";
	stop: () => void;
	error: Error | undefined;
	reload: () => void;
	isUploading: boolean;
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
}

export function Artifact({
	chatId,
	onClose,
	messages,
	input,
	handleInputChange,
	handleSubmit,
	status,
	stop,
	error,
	reload,
	isUploading,
	mcpEnabled,
	toggleMcpEnabled,
}: ArtifactProps) {
	const { artifact, setArtifact } = useArtifact();
	const [windowDimensions, setWindowDimensions] = useState({
		width: 0,
		height: 0,
	});
	const [isMobile, setIsMobile] = useState(false);
	const [showChat, setShowChat] = useState(false); // Mobile chat display state
	const [viewMode, setViewMode] = useState<"code" | "preview">("code"); // View mode state
	const [versions, setVersions] = useState<ArtifactVersion[]>([]);
	const [selectedVersion, setSelectedVersion] = useState<number | undefined>();

	// 检测是否支持预览：基于类型和流式状态
	const canPreview = useMemo(() => {
		if (artifact.kind !== "code") return false;
		// 只有在非流式状态下才能预览
		return artifact.status !== "streaming";
	}, [artifact.kind, artifact.status]);

	useEffect(() => {
		const updateDimensions = () => {
			setWindowDimensions({
				width: window.innerWidth,
				height: window.innerHeight,
			});
			setIsMobile(window.innerWidth < 768);
		};

		updateDimensions();
		window.addEventListener("resize", updateDimensions);
		return () => window.removeEventListener("resize", updateDimensions);
	}, []);

	const handleClose = () => {
		setArtifact((prev) => ({ ...prev, isVisible: false }));
		onClose?.();
	};

	const handleVersionsLoaded = (loadedVersions: ArtifactVersion[]) => {
		setVersions(loadedVersions);
		// Set current version if not already set
		if (!selectedVersion && loadedVersions.length > 0 && loadedVersions[0]) {
			setSelectedVersion(loadedVersions[0].version);
		}
	};

	const handleVersionChange = (version: number) => {
		setSelectedVersion(version);
	};

	// Auto-switch to latest version when versions are loaded/refreshed
	useEffect(() => {
		if (versions.length > 0 && versions[0]) {
			const latestVersion = versions[0].version;
			// Only switch if we don't have a selected version or if the latest version is newer
			if (!selectedVersion || latestVersion > selectedVersion) {
				console.log(`Switching to latest version: ${latestVersion}`);
				setSelectedVersion(latestVersion);
			}
		}
	}, [versions, selectedVersion]);

	// 重新设计的逻辑：更清晰的状态判断
	const isStreaming = artifact.status === "streaming";
	const hasVersions = versions.length > 0;
	const hasDocumentId = !!artifact.documentId;

	// 版本切换功能的启用条件：非流式状态 && 有文档 ID（有版本数据是自然结果）
	const canSwitchVersions = !isStreaming && hasDocumentId;

	// 获取选中版本的数据
	const selectedVersionData = useMemo(() => {
		if (!selectedVersion || !hasVersions) return null;
		return versions.find((v) => v.version === selectedVersion) || null;
	}, [selectedVersion, versions, hasVersions]);

	// 数据来源选择：简化逻辑
	const displayData = useMemo(() => {
		// 1. 如果正在流式传输，优先使用流式数据
		if (isStreaming) {
			return {
				title: artifact.title,
				status: artifact.status,
				kind: artifact.kind,
				content: artifact.content,
				language: artifact.language,
			};
		}

		// 2. 如果有选中的版本数据，使用版本数据
		if (selectedVersionData) {
			return {
				title: selectedVersionData.title,
				status: "idle" as const,
				kind: selectedVersionData.kind,
				content: selectedVersionData.content,
				language: selectedVersionData.language,
			};
		}

		// 3. 后备方案：使用 artifact 数据
		return {
			title: artifact.title,
			status: "idle" as const, // 非流式状态下显示为 idle
			kind: artifact.kind,
			content: artifact.content,
			language: artifact.language,
		};
	}, [isStreaming, artifact, selectedVersionData]);

	if (!artifact.isVisible) return null;

	return (
		<AnimatePresence>
			<motion.div
				data-testid="artifact"
				className="fixed inset-0 z-50 bg-background"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0, transition: { delay: 0.4 } }}
			>
				{/* 移动端聊天面板覆盖层 */}
				{isMobile && showChat && (
					<motion.div
						className="absolute inset-0 bg-background z-10"
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ type: "tween", duration: 0.3 }}
					>
						<div className="h-full flex flex-col">
							<div className="p-4 border-b">
								<div className="flex items-center justify-between">
									<h2 className="font-semibold">Chat</h2>
									<div className="flex items-center gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => setShowChat(false)}
											className="h-8 w-8 p-0"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
							<div className="flex-1 overflow-hidden">
								<ArtifactChat
									chatId={chatId}
									messages={messages}
									input={input}
									handleInputChange={handleInputChange}
									handleSubmit={handleSubmit}
									status={status}
									stop={stop}
									error={error}
									reload={reload}
									isUploading={isUploading}
									mcpEnabled={mcpEnabled}
									toggleMcpEnabled={toggleMcpEnabled}
								/>
							</div>
						</div>
					</motion.div>
				)}

				{/* 桌面端：可调整大小的面板布局 */}
				{!isMobile ? (
					<ResizablePanelGroup direction="horizontal" className="h-full">
						{/* 左侧聊天面板 */}
						<ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
							<motion.div
								className="h-full bg-muted dark:bg-background border-r"
								initial={{ opacity: 0, x: -20 }}
								animate={{
									opacity: 1,
									x: 0,
									transition: {
										delay: 0.2,
										type: "spring",
										stiffness: 200,
										damping: 30,
									},
								}}
								exit={{
									opacity: 0,
									x: -20,
									transition: { duration: 0.2 },
								}}
							>
								<div className="h-full flex flex-col">
									<div className="flex-1 overflow-hidden">
										<ArtifactChat
											chatId={chatId}
											messages={messages}
											input={input}
											handleInputChange={handleInputChange}
											handleSubmit={handleSubmit}
											status={status}
											stop={stop}
											error={error}
											reload={reload}
											isUploading={isUploading}
											mcpEnabled={mcpEnabled}
											toggleMcpEnabled={toggleMcpEnabled}
										/>
									</div>
								</div>
							</motion.div>
						</ResizablePanel>

						{/* 可拖动的分隔条 */}
						<ResizableHandle withHandle />

						{/* 右侧 Artifact 内容面板 */}
						<ResizablePanel defaultSize={70} minSize={50}>
							<motion.div
								className="h-full bg-background flex flex-col"
								initial={{
									opacity: 1,
									x: artifact.boundingBox.left,
									y: artifact.boundingBox.top,
									width: artifact.boundingBox.width,
									height: artifact.boundingBox.height,
									borderRadius: 12,
								}}
								animate={{
									opacity: 1,
									x: 0,
									y: 0,
									width: "100%",
									height: "100%",
									borderRadius: 0,
									transition: {
										type: "spring",
										stiffness: 200,
										damping: 30,
										duration: 0.6,
									},
								}}
								exit={{
									opacity: 0,
									scale: 0.5,
									transition: {
										delay: 0.1,
										type: "spring",
										stiffness: 600,
										damping: 30,
									},
								}}
							>
								{/* Artifact 头部工具栏 */}
								<ArtifactActions
									title={displayData.title}
									status={displayData.status}
									kind={displayData.kind}
									content={displayData.content}
									onClose={handleClose}
									isMobile={false}
									viewMode={viewMode}
									onViewModeChange={setViewMode}
									canPreview={canPreview}
									// 版本控制props：根据canSwitchVersions决定是否传递
									versions={canSwitchVersions ? versions : undefined}
									currentVersion={
										canSwitchVersions ? selectedVersion : undefined
									}
									onVersionChange={
										canSwitchVersions ? handleVersionChange : undefined
									}
									documentId={artifact.documentId}
								/>

								{/* Artifact 内容区域 */}
								<div className="flex-1 overflow-hidden">
									<ArtifactContent
										// Always pass streaming props for real-time updates
										kind={artifact.kind}
										content={artifact.content}
										status={artifact.status}
										title={artifact.title}
										language={artifact.language}
										viewMode={viewMode}
										// Database mode props (for version control)
										{...(artifact.documentId && {
											documentId: artifact.documentId,
											onVersionsLoaded: handleVersionsLoaded,
											selectedVersion: selectedVersion,
										})}
									/>
								</div>
							</motion.div>
						</ResizablePanel>
					</ResizablePanelGroup>
				) : (
					/* 移动端：原有的布局 */
					<motion.div
						className="flex-1 bg-background flex flex-col"
						initial={{
							opacity: 1,
							x: artifact.boundingBox.left,
							y: artifact.boundingBox.top,
							width: artifact.boundingBox.width,
							height: artifact.boundingBox.height,
							borderRadius: 12,
						}}
						animate={{
							opacity: 1,
							x: 0,
							y: 0,
							width: windowDimensions.width,
							height: windowDimensions.height,
							borderRadius: 0,
							transition: {
								type: "spring",
								stiffness: 200,
								damping: 30,
								duration: 0.6,
							},
						}}
						exit={{
							opacity: 0,
							scale: 0.5,
							transition: {
								delay: 0.1,
								type: "spring",
								stiffness: 600,
								damping: 30,
							},
						}}
					>
						{/* Artifact 头部工具栏 */}
						<ArtifactActions
							title={displayData.title}
							status={displayData.status}
							kind={displayData.kind}
							content={displayData.content}
							onClose={handleClose}
							onChatToggle={() => setShowChat(!showChat)}
							showChatButton={true}
							isMobile={true}
							viewMode={viewMode}
							onViewModeChange={setViewMode}
							canPreview={canPreview}
							// 版本控制 props：根据 canSwitchVersions 决定是否传递
							versions={canSwitchVersions ? versions : undefined}
							currentVersion={canSwitchVersions ? selectedVersion : undefined}
							onVersionChange={
								canSwitchVersions ? handleVersionChange : undefined
							}
							documentId={artifact.documentId}
						/>

						{/* Artifact 内容区域 */}
						<div className="flex-1 overflow-hidden">
							<ArtifactContent
								// Always pass streaming props for real-time updates
								kind={artifact.kind}
								content={artifact.content}
								status={artifact.status}
								title={artifact.title}
								language={artifact.language}
								viewMode={viewMode}
								// Database mode props (for version control)
								{...(artifact.documentId && {
									documentId: artifact.documentId,
									onVersionsLoaded: handleVersionsLoaded,
									selectedVersion: selectedVersion,
								})}
							/>
						</div>
					</motion.div>
				)}
			</motion.div>
		</AnimatePresence>
	);
}
