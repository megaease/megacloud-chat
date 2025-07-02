// components/artifact/Artifact.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArtifact } from "@/context/artifact-provider-context";
import { ArtifactContent } from "./ArtifactContent";
import { ArtifactActions } from "./ArtifactActions";
import { ArtifactSkeleton } from "./ArtifactSkeleton";
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
import { useTranslations } from "next-intl";

// 根据文档类型生成简洁的默认标题（不包含状态信息）
function getDefaultTitle(
	kind: ArtifactKind,
	t: ReturnType<typeof useTranslations>,
): string {
	const kindTitles = {
		text: t("documentType"),
		code: t("codeType"),
		sheet: t("sheetType"),
		image: t("imageType"),
	};

	const baseTitle = kindTitles[kind] || t("documentType");

	// 不再在标题中包含状态信息，状态由右边的指示器显示
	return t("newType", { type: baseTitle });
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
	const { artifact, hideArtifact } = useArtifact();
	const tArtifact = useTranslations("Artifact");
	
	const [windowDimensions, setWindowDimensions] = useState({
		width: 0,
		height: 0,
	});
	const [isMobile, setIsMobile] = useState(false);
	const [showChat, setShowChat] = useState(false);
	const [viewMode, setViewMode] = useState<"code" | "preview">("preview");

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
		hideArtifact();
		onClose?.();
	};

	// 简化的显示数据：直接使用 artifact context 中的数据
	const displayData = {
		title: artifact.title || getDefaultTitle(artifact.kind, tArtifact),
		status: artifact.status,
		kind: artifact.kind,
		content: artifact.content,
		language: artifact.language,
	};

	// 检测是否支持预览：基于 artifact 状态
	const canPreview = useMemo(() => {
		// 只有 code 类型才支持预览
		if (displayData.kind !== "code") return false;
		// 只有在非流式状态下才能预览
		return displayData.status !== "streaming";
	}, [displayData.kind, displayData.status]);

	// 判断是否应该显示骨架屏：基于状态驱动的显示逻辑
	const shouldShowSkeleton = useMemo(() => {
		// 创建或更新状态：只显示骨架屏
		if (displayData.status === "creating" || displayData.status === "updating") {
			return true;
		}

		// 流式状态且没有内容时显示骨架屏
		if (displayData.status === "streaming" && (!displayData.content || displayData.content.trim() === "")) {
			return true;
		}

		// loading 状态且没有内容时显示骨架屏
		if (displayData.status === "loading" && (!displayData.content || displayData.content.trim() === "")) {
			return true;
		}

		// 聊天系统刚提交请求，但 artifact 还未开始更新时显示骨架屏
		if (status === "submitted" && displayData.status === "idle") {
			return true;
		}

		return false;
	}, [displayData.status, displayData.content, status]);

	// 根据状态确定实际的视图模式：主要基于 artifact 状态
	const effectiveViewMode = useMemo(() => {
		// streaming 状态强制使用代码视图以显示实时内容
		if (displayData.status === "streaming") {
			return "code";
		}
		// 其他状态使用用户选择的视图模式
		return viewMode;
	}, [displayData.status, viewMode]);

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
									onViewModeChange={
										displayData.status === "idle" ? setViewMode : undefined
									}
									canPreview={canPreview}
								/>

								{/* Artifact 内容区域 */}
								<div className="flex-1 overflow-hidden relative">
									{shouldShowSkeleton ? (
										<ArtifactSkeleton
											title={displayData.title}
											showTitle={
												!!displayData.title &&
												displayData.title !== "Loading..."
											}
										/>
									) : displayData.status === "streaming" && displayData.content ? (
										/* 流式状态下有部分内容时：显示内容 + 加载指示器 */
										<>
											<ArtifactContent viewMode={effectiveViewMode} />
											<div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
												<div className="flex items-center gap-2 text-sm text-muted-foreground">
													<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
													<span>Generating...</span>
												</div>
											</div>
										</>
									) : (
										<ArtifactContent viewMode={effectiveViewMode} />
									)}
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
							onViewModeChange={displayData.status === "idle" ? setViewMode : undefined}
							canPreview={canPreview}
						/>

						{/* Artifact 内容区域 */}
						<div className="flex-1 overflow-hidden relative">
							{shouldShowSkeleton ? (
								<ArtifactSkeleton
									title={displayData.title}
									showTitle={
										!!displayData.title && displayData.title !== "Loading..."
									}
								/>
							) : displayData.status === "streaming" && displayData.content ? (
								/* 流式状态下有部分内容时：显示内容 + 加载指示器 */
								<>
									<ArtifactContent viewMode={effectiveViewMode} />
									<div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
											<span>Generating...</span>
										</div>
									</div>
								</>
							) : (
								<ArtifactContent viewMode={effectiveViewMode} />
							)}
						</div>
					</motion.div>
				)}
			</motion.div>
		</AnimatePresence>
	);
}
