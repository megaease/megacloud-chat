"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Loader2,
	Send,
	Square,
	Paperclip,
	X,
	FileText,
	Image,
	Film,
	Music,
	File,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";

interface ChatInputProps {
	input: string;
	handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
	handleSubmit: (
		e: React.FormEvent<HTMLFormElement>,
		options?: { experimental_attachments?: FileList },
	) => void;
	handleStopGeneration: () => void;
	mcpEnabled: boolean;
	toggleMcpEnabled: () => boolean;
	status: "error" | "submitted" | "streaming" | "ready";
	isUploading?: boolean;
	className?: string;
}

export function ChatInput({
	input,
	handleInputChange,
	handleSubmit,
	handleStopGeneration,
	mcpEnabled,
	toggleMcpEnabled,
	status,
	isUploading = false,
	className = "",
}: ChatInputProps) {
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadedFiles, setUploadedFiles] = useState<
		Array<{ name: string; url: string; contentType: string }>
	>([]);
	const [uploadingFiles, setUploadingFiles] = useState<
		Map<string, { name: string; contentType: string; previewUrl?: string }>
	>(new Map());
	const [previewImage, setPreviewImage] = useState<{
		url: string;
		name: string;
	} | null>(null);

	// 获取文件类型图标
	const getFileTypeIcon = (contentType: string) => {
		if (contentType.startsWith("image/")) {
			return <Image className="h-4 w-4" />;
		}
		if (
			contentType.includes("text/") ||
			contentType.includes("application/pdf")
		) {
			return <FileText className="h-4 w-4" />;
		}
		return <File className="h-4 w-4" />;
	};

	// 判断是否为图片文件
	const isImageFile = (contentType: string) => {
		return contentType.startsWith("image/");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			if (input.trim() || uploadedFiles.length > 0) {
				const event = new Event("submit", {
					cancelable: true,
					bubbles: true,
				}) as unknown as React.FormEvent<HTMLFormElement>;

				// 将已上传的文件转换为附件格式
				const attachments = uploadedFiles;
				handleSubmit(event, {
					experimental_attachments: attachments as unknown as FileList,
				});

				// 清空已上传的文件
				setUploadedFiles([]);
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			}
		}
	};

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFiles = Array.from(e.target.files); // 立即上传文件
			for (const file of selectedFiles) {
				const fileName = file.name;
				const previewUrl = file.type.startsWith("image/")
					? URL.createObjectURL(file)
					: undefined;

				setUploadingFiles(
					(prev) =>
						new Map([
							...prev,
							[
								fileName,
								{ name: fileName, contentType: file.type, previewUrl },
							],
						]),
				);

				try {
					const formData = new FormData();
					formData.append("file", file);

					const response = await fetch("/api/files/upload", {
						method: "POST",
						body: formData,
					});

					if (!response.ok) {
						const errorData = await response.json();
						throw new Error(errorData.error || "Upload failed");
					}

					const data = await response.json();

					setUploadedFiles((prev) => [
						...prev,
						{
							name: data.pathname,
							url: data.url,
							contentType: data.contentType,
						},
					]);
				} catch (error) {
					console.error("Upload failed:", error);
				} finally {
					setUploadingFiles((prev) => {
						const newMap = new Map(prev);
						const fileInfo = newMap.get(fileName);
						if (fileInfo?.previewUrl) {
							URL.revokeObjectURL(fileInfo.previewUrl);
						}
						newMap.delete(fileName);
						return newMap;
					});
				}
			}
		}
	};

	return (
		<div
			className={`p-4 relative max-w-4xl text-center w-full mx-auto ${className}`}
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();

					const attachments = uploadedFiles.map((file) => ({
						url: file.url,
						contentType: file.contentType,
						name: file.name,
					}));

					handleSubmit(e, {
						experimental_attachments:
							attachments.length > 0
								? (attachments as unknown as FileList)
								: undefined,
					});

					// 清空已上传的文件
					setUploadedFiles([]);
					if (fileInputRef.current) {
						fileInputRef.current.value = "";
					}
				}}
				className="relative"
			>
				<div className="relative rounded-2xl border border-border/50 bg-background/95 shadow-md transition-all duration-300 ease-in-out focus-within:shadow-lg focus-within:border-primary/60 hover:shadow-lg group">
					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						onChange={handleFileUpload}
						multiple
						aria-label="Upload files"
						title="Upload files"
					/>
					{uploadedFiles.length > 0 || uploadingFiles.size > 0 ? (
						<div className="px-4 py-2 flex flex-wrap gap-2 border-t border-border/50">
							{/* 显示正在上传的文件 */}
							{Array.from(uploadingFiles).map(([fileName, fileInfo]) => (
								<div
									key={`uploading-${fileName}`}
									className={`relative group ${
										isImageFile(fileInfo.contentType)
											? "rounded-lg overflow-hidden"
											: "flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-sm"
									}`}
								>
									{isImageFile(fileInfo.contentType) && fileInfo.previewUrl ? (
										<div className="relative">
											<img
												src={fileInfo.previewUrl}
												alt={fileInfo.name}
												className="h-20 w-20 rounded-lg object-cover"
											/>
											<div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
												<Loader2 className="h-6 w-6 animate-spin text-white" />
											</div>
										</div>
									) : (
										<>
											{getFileTypeIcon(fileInfo.contentType)}
											<Loader2 className="h-3 w-3 animate-spin" />
											<span className="truncate max-w-32">{fileInfo.name}</span>
										</>
									)}
								</div>
							))}

							{/* 显示已上传的文件 */}
							{uploadedFiles.map((file) => (
								<div
									key={file.url}
									className={`relative group ${
										isImageFile(file.contentType)
											? "rounded-lg overflow-hidden"
											: "flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-sm"
									}`}
								>
									{isImageFile(file.contentType) ? (
										<>
											<div
												className="cursor-pointer"
												onClick={() => {
													setPreviewImage({ url: file.url, name: file.name });
												}}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														setPreviewImage({ url: file.url, name: file.name });
													}
												}}
												aria-label={`Open ${file.name}`}
											>
												<img
													src={file.url}
													alt={file.name}
													className="h-20 w-20 rounded-lg object-cover hover:opacity-80 transition-opacity"
												/>
											</div>
											<Button
												type="button"
												size="icon"
												variant="ghost"
												className="absolute top-1 right-1 h-5 w-5 p-0 rounded-full  shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/80 hover:bg-white/90"
												onClick={() => {
													setUploadedFiles((prev) =>
														prev.filter((f) => f.url !== file.url),
													);
												}}
											>
												<X className="h-3 w-3" />
											</Button>
										</>
									) : (
										<>
											{getFileTypeIcon(file.contentType)}
											<span className="truncate max-w-32">{file.name}</span>
											<Button
												type="button"
												size="icon"
												variant="ghost"
												className="h-4 w-4 p-0"
												onClick={() => {
													setUploadedFiles((prev) =>
														prev.filter((f) => f.url !== file.url),
													);
												}}
											>
												<X className="h-3 w-3" />
											</Button>
										</>
									)}
								</div>
							))}
						</div>
					) : null}
					<Textarea
						ref={inputRef}
						value={input}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						placeholder="Type your message..."
						className="min-h-30 w-full resize-none border-0 bg-transparent px-4 py-3 pr-14 focus-visible:ring-0 
						focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 selection:bg-primary/20 pb-12"
						rows={2}
						autoFocus
					/>

					{/* MCP Toggle switch */}
					<div className="absolute bottom-2 left-2 flex items-center gap-2">
						<TooltipProvider>
							<Tooltip delayDuration={300}>
								<TooltipTrigger asChild>
									<div className="flex items-center rounded px-4 py-2 border border-border/50 transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 group">
										<span className="text-xs font-medium mr-2 text-muted-foreground group-hover:text-foreground/80">
											MCP
										</span>
										<Switch
											checked={mcpEnabled}
											onCheckedChange={() => toggleMcpEnabled()}
										/>
									</div>
								</TooltipTrigger>
								<TooltipContent side="top" className="text-xs font-medium">
									<p>{mcpEnabled ? "MCP Enabled" : "MCP Disabled"}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<div className="absolute bottom-2 right-2 flex items-center gap-2">
						{/* Upload button */}
						<TooltipProvider>
							<Tooltip delayDuration={300}>
								<TooltipTrigger asChild>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										className="h-9 w-9 rounded-full text-muted-foreground/80 hover:text-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all duration-200"
										onClick={() => fileInputRef.current?.click()}
									>
										<Paperclip className="h-4 w-4 transition-transform group-hover:rotate-12" />
									</Button>
								</TooltipTrigger>
								<TooltipContent side="top" className="text-xs font-medium">
									<p>Upload file</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						{status === "submitted" || status === "streaming" ? (
							<TooltipProvider>
								<Tooltip delayDuration={300}>
									<TooltipTrigger asChild>
										<Button
											size="icon"
											onClick={handleStopGeneration}
											variant="ghost"
											className="h-9 w-9 rounded-full bg-primary text-primary-foreground 
											hover:text-primary-foreground
											shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-primary disabled:hover:shadow-md active:scale-95"
											type="button"
										>
											<Square className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top" className="text-xs font-medium">
										<p>Stop generation</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						) : (
							<TooltipProvider>
								<Tooltip delayDuration={300}>
									<TooltipTrigger asChild>
										<Button
											type="submit"
											size="icon"
											disabled={!input.trim() || isUploading}
											className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-primary disabled:hover:shadow-md active:scale-95"
										>
											{isUploading ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Send className="h-4 w-4" />
											)}
										</Button>
									</TooltipTrigger>
									<TooltipContent side="top" className="text-xs font-medium">
										<p>{isUploading ? "Uploading..." : "Send message"}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
					</div>
				</div>
			</form>

			{/* 图片预览对话框 */}
			<ImagePreviewDialog
				isOpen={!!previewImage}
				onClose={() => setPreviewImage(null)}
				imageUrl={previewImage?.url || ""}
				imageName={previewImage?.name}
				variant="simple"
			/>
		</div>
	);
}
