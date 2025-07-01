// components/artifact/Artifact.tsx
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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

interface ArtifactVersion {
	id: string;
	version: number;
	title: string;
	content: string;
	kind: ArtifactKind;
	language?: ArtifactLanguage;
	updatedAt: string;
}

// 根据文档类型生成简洁的默认标题（不包含状态信息）
function getDefaultTitle(kind: ArtifactKind, t: any): string {
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
	const { artifact, setArtifact } = useArtifact();
	const tArtifact = useTranslations("Artifact");
	const [windowDimensions, setWindowDimensions] = useState({
		width: 0,
		height: 0,
	});
	const [isMobile, setIsMobile] = useState(false);
	const [showChat, setShowChat] = useState(false); // Mobile chat display state
	const [viewMode, setViewMode] = useState<"code" | "preview">("preview"); // 默认展示预览
	const [versions, setVersions] = useState<ArtifactVersion[]>([]);
	const [selectedVersion, setSelectedVersion] = useState<number | undefined>();
	const [isUserSelectedVersion, setIsUserSelectedVersion] = useState(false); // Track if user manually selected a version

	// 检测是否正在流式传输（综合判断）
	const isStreaming = useMemo(() => {
		return artifact.status === "streaming" || status === "streaming";
	}, [artifact.status, status]);

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
		// Set current version only if not already set AND user hasn't manually selected a version
		if (
			!selectedVersion &&
			!isUserSelectedVersion &&
			loadedVersions.length > 0 &&
			loadedVersions[0]
		) {
			setSelectedVersion(loadedVersions[0].version);
		}
	};

	const handleVersionChange = (version: number) => {
		setSelectedVersion(version);
		setIsUserSelectedVersion(true); // Mark as user-selected
	};

	// Auto-switch to latest version when versions are loaded/refreshed
	// Only auto-switch if no version has been manually selected by user
	useEffect(() => {
		if (versions.length > 0 && versions[0]) {
			const latestVersion = versions[0].version;
			// Only switch if:
			// 1. We don't have a selected version yet (initial load)
			// 2. User has NOT manually selected a version
			if (!selectedVersion && !isUserSelectedVersion) {
				setSelectedVersion(latestVersion);
			}
		}
	}, [versions, selectedVersion, isUserSelectedVersion]);

	// Auto-switch to latest version when status becomes ready
	useEffect(() => {
		if (
			status === "ready" &&
			versions.length > 0 &&
			versions[0] &&
			!isUserSelectedVersion
		) {
			const latestVersion = versions[0].version;
			// 当状态变为 ready 时，如果用户没有手动选择版本，则切换到最新版本
			if (selectedVersion !== latestVersion) {
				setSelectedVersion(latestVersion);
			}
		}
	}, [status, versions, selectedVersion, isUserSelectedVersion]);

	// Reset version selection state when artifact changes
	const documentId = artifact.documentId;
	const prevDocumentIdRef = useRef(documentId);

	useEffect(() => {
		// When documentId changes, reset user selection state to allow auto-switching
		if (prevDocumentIdRef.current !== documentId) {
			setIsUserSelectedVersion(false);
			setSelectedVersion(undefined);
			prevDocumentIdRef.current = documentId;
		}
	});

	// 版本切换功能的启用条件：只有 ready 状态且有文档 ID
	const canSwitchVersions = status === "ready" && !!documentId;

	// 获取选中版本的数据
	const selectedVersionData = useMemo(() => {
		if (!selectedVersion || versions.length === 0) return null;
		return versions.find((v) => v.version === selectedVersion) || null;
	}, [selectedVersion, versions]);

	// 数据来源选择：基于聊天状态的严格控制
	const displayData = useMemo(() => {
		// 1. streaming 状态：显示流式数据
		if (status === "streaming") {
			return {
				title: artifact.title || getDefaultTitle(artifact.kind, tArtifact),
				status: "streaming" as const, // 使用外部传入的状态
				kind: artifact.kind,
				content: artifact.content,
				language: artifact.language,
			};
		}

		// 2. ready 状态：显示版本内容
		if (status === "ready") {
			// 优先显示选中的版本数据
			if (selectedVersionData) {
				return {
					title: selectedVersionData.title,
					status: "idle" as const,
					kind: selectedVersionData.kind,
					content: selectedVersionData.content,
					language: selectedVersionData.language,
				};
			}
			// 后备方案：如果版本数据还没准备好，继续使用流式数据避免闪烁
			// 但标记状态为 idle，这样不会显示流式指示器
			return {
				title: artifact.title || getDefaultTitle(artifact.kind, tArtifact),
				status: "idle" as const,
				kind: artifact.kind,
				content: artifact.content,
				language: artifact.language,
			};
		}

		// 3. 其他状态（submitted, error）显示准备状态
		// 对于 update 场景，优先使用已有的版本标题，避免显示默认标题
		const fallbackTitle =
			selectedVersionData?.title ||
			(versions.length > 0 ? versions[0]?.title : undefined) ||
			artifact.title ||
			getDefaultTitle(artifact.kind, tArtifact);

		return {
			title: fallbackTitle,
			status: status as "submitted" | "error", // 使用外部传入的状态
			kind: artifact.kind,
			content: "", // 不显示内容，由骨架屏处理
			language: artifact.language,
		};
	}, [status, selectedVersionData, artifact, tArtifact, versions]);

	// 检测是否支持预览：基于当前显示数据的类型和状态
	const canPreview = useMemo(() => {
		// 只有 code 类型才支持预览
		if (displayData.kind !== "code") return false;
		// 只有在非流式状态下才能预览
		return status !== "streaming";
	}, [displayData.kind, status]);

	// 判断是否应该显示骨架屏
	const shouldShowSkeleton = useMemo(() => {
		// submitted 状态显示骨架屏
		if (status === "submitted") return true;

		// streaming 状态但没有内容时也显示骨架屏
		if (
			status === "streaming" &&
			(!displayData.content || displayData.content.trim() === "")
		) {
			return true;
		}

		return false;
	}, [status, displayData.content]);

	// 根据状态确定实际的视图模式
	const effectiveViewMode = useMemo(() => {
		// streaming 状态强制使用代码视图以显示实时内容
		if (status === "streaming") {
			return "code";
		}
		// 其他状态使用用户选择的视图模式
		return viewMode;
	}, [status, viewMode]);

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
									viewMode={viewMode} // 传递用户选择的视图模式
									onViewModeChange={
										status === "ready" ? setViewMode : undefined
									} // 只有 ready 状态才能切换视图
									canPreview={canPreview && status === "ready"} // 只有 ready 状态才能预览
									// 版本控制props：只有 ready 状态才传递
									versions={canSwitchVersions ? versions : undefined}
									currentVersion={
										canSwitchVersions ? selectedVersion : undefined
									}
									onVersionChange={handleVersionChange}
									documentId={documentId}
								/>

								{/* Artifact 内容区域 */}
								<div className="flex-1 overflow-hidden">
									{shouldShowSkeleton ? (
										<ArtifactSkeleton
											title={displayData.title}
											showTitle={
												!!displayData.title &&
												displayData.title !== "Loading..."
											}
										/>
									) : (
										<ArtifactContent
											// 根据状态传递不同的数据
											kind={displayData.kind}
											content={displayData.content}
											status={displayData.status}
											title={displayData.title}
											language={displayData.language}
											viewMode={effectiveViewMode} // 使用根据状态调整的视图模式
											// Database mode props (只有 ready 状态才启用版本控制)
											{...(status === "ready" &&
												documentId && {
													documentId: documentId,
													onVersionsLoaded: handleVersionsLoaded,
													selectedVersion: selectedVersion,
												})}
										/>
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
							onViewModeChange={status === "ready" ? setViewMode : undefined} // 只有 ready 状态才能切换视图
							canPreview={canPreview && status === "ready"} // 只有 ready 状态才能预览
							// 版本控制 props：只有 ready 状态才传递
							versions={canSwitchVersions ? versions : undefined}
							currentVersion={canSwitchVersions ? selectedVersion : undefined}
							onVersionChange={handleVersionChange}
							documentId={documentId}
						/>

						{/* Artifact 内容区域 */}
						<div className="flex-1 overflow-hidden">
							{shouldShowSkeleton ? (
								<ArtifactSkeleton
									title={displayData.title}
									showTitle={
										!!displayData.title && displayData.title !== "Loading..."
									}
								/>
							) : (
								<ArtifactContent
									// 根据状态传递不同的数据
									kind={displayData.kind}
									content={displayData.content}
									status={displayData.status}
									title={displayData.title}
									language={displayData.language}
									viewMode={effectiveViewMode} // 使用根据状态调整的视图模式
									// Database mode props (只有 ready 状态才启用版本控制)
									{...(status === "ready" &&
										documentId && {
											documentId: documentId,
											onVersionsLoaded: handleVersionsLoaded,
											selectedVersion: selectedVersion,
										})}
								/>
							)}
						</div>
					</motion.div>
				)}
			</motion.div>
		</AnimatePresence>
	);
}
