// components/artifact/Artifact.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArtifact } from "@/context/artifact-provider-context";
import { ArtifactContent } from "./ArtifactContent";
import { Button } from "@/components/ui/button";
import {
	X,
	ChevronLeft,
	ChevronRight,
	MessageSquare,
	History,
	MessageCircle,
} from "lucide-react";
import { ArtifactChatList } from "./ArtifactChatList";
import { ArtifactChat } from "./ArtifactChat";

interface ArtifactProps {
	chatId: string;
	onClose?: () => void;
}

export function Artifact({ chatId, onClose }: ArtifactProps) {
	const { artifact, setArtifact } = useArtifact();
	const [windowDimensions, setWindowDimensions] = useState({
		width: 0,
		height: 0,
	});
	const [isMobile, setIsMobile] = useState(false);
	const [showChat, setShowChat] = useState(false); // 移动端聊天显示状态
	const [chatMode, setChatMode] = useState<"history" | "live">("history"); // 聊天模式

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

	if (!artifact.isVisible) return null;

	return (
		<AnimatePresence>
			<motion.div
				data-testid="artifact"
				className="fixed inset-0 z-50 flex bg-background"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0, transition: { delay: 0.4 } }}
			>
				{/* 左侧聊天面板 - 仅桌面端 */}
				{!isMobile && (
					<motion.div
						className="w-[400px] bg-muted dark:bg-background h-full shrink-0 border-r"
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
							<div className="p-4 border-b">
								<div className="flex items-center justify-between">
									<h2 className="font-semibold">Chat</h2>
									<div className="flex items-center gap-1 bg-muted rounded-md p-1">
										<button
											type="button"
											onClick={() => setChatMode("history")}
											className={`p-1.5 rounded text-xs transition-all ${
												chatMode === "history"
													? "bg-background shadow-sm"
													: "hover:bg-background/50"
											}`}
											title="查看历史消息"
										>
											<History className="h-3 w-3" />
										</button>
										<button
											type="button"
											onClick={() => setChatMode("live")}
											className={`p-1.5 rounded text-xs transition-all ${
												chatMode === "live"
													? "bg-background shadow-sm"
													: "hover:bg-background/50"
											}`}
											title="实时聊天"
										>
											<MessageCircle className="h-3 w-3" />
										</button>
									</div>
								</div>
							</div>
							<div className="flex-1 overflow-hidden">
								{chatMode === "history" ? (
									<ArtifactChatList chatId={chatId} mode="history" />
								) : (
									<ArtifactChat chatId={chatId} />
								)}
							</div>
						</div>
					</motion.div>
				)}

				{/* 移动端聊天面板覆盖层 */}
				{isMobile && showChat && (
					<motion.div
						className={
							"flex flex-row lex gap-3 p-3 text-sm border-b border-border-/50 last:border-b-0"
						}
						initial={{ x: "-100%" }}
						exit={{ x: "-100%" }}
						transition={{ type: "tween", duration: 0.3 }}
					>
						<div className="h-full flex flex-col">
							<div className="p-4 border-b">
								<div className="flex items-center justify-between">
									<h2 className="font-semibold">Chat</h2>
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-1 bg-muted rounded-md p-1">
											<button
												type="button"
												onClick={() => setChatMode("history")}
												className={`p-1.5 rounded text-xs transition-all ${
													chatMode === "history"
														? "bg-background shadow-sm"
														: "hover:bg-background/50"
												}`}
												title="查看历史消息"
											>
												<History className="h-3 w-3" />
											</button>
											<button
												type="button"
												onClick={() => setChatMode("live")}
												className={`p-1.5 rounded text-xs transition-all ${
													chatMode === "live"
														? "bg-background shadow-sm"
														: "hover:bg-background/50"
												}`}
												title="实时聊天"
											>
												<MessageCircle className="h-3 w-3" />
											</button>
										</div>
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
								{chatMode === "history" ? (
									<ArtifactChatList chatId={chatId} mode="history" />
								) : (
									<ArtifactChat chatId={chatId} />
								)}
							</div>
						</div>
					</motion.div>
				)}

				{/* 右侧 Artifact 内容区域 */}
				<motion.div
					className="flex-1 bg-background flex flex-col border-l dark:border-zinc-700 border-zinc-200 border-solid"
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
						width: isMobile
							? windowDimensions.width
							: windowDimensions.width - 400,
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
					<div className="flex items-center justify-between p-4 border-b bg-background">
						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleClose}
								className="h-8 w-8 p-0"
							>
								<X className="h-4 w-4" />
							</Button>

							{/* 移动端聊天切换按钮 */}
							{isMobile && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowChat(!showChat)}
									className="h-8 w-8 p-0"
								>
									<MessageSquare className="h-4 w-4" />
								</Button>
							)}

							<div>
								<h3 className="font-semibold text-lg">{artifact.title}</h3>
								<p className="text-sm text-muted-foreground">
									{artifact.status === "streaming" ? "Generating..." : "Ready"}
								</p>
							</div>
						</div>
					</div>

					{/* Artifact 内容区域 */}
					<div className="flex-1 overflow-hidden">
						<ArtifactContent
							kind={artifact.kind}
							content={artifact.content}
							status={artifact.status}
							title={artifact.title}
						/>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
}
