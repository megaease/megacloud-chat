"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconX, IconExternalLink } from "@tabler/icons-react";

interface FilePreviewDialogProps {
	isOpen: boolean;
	onClose: () => void;
	fileUrl: string;
	fileName?: string;
	fileType: string;
	showCloseButton?: boolean;
}

export function FilePreviewDialog({
	isOpen,
	onClose,
	fileUrl,
	fileName,
	fileType,
	showCloseButton = false,
}: FilePreviewDialogProps) {
	const isImage = fileType.startsWith("image/");
	const isPDF = fileType === "application/pdf";

	const handleExternalOpen = () => {
		window.open(fileUrl, "_blank");
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className={`p-0 border-none shadow-none ${
					isImage
						? "max-w-4xl w-fit bg-transparent"
						: "max-w-6xl w-[90vw] bg-transparent"
				}`}
				showCloseButton={showCloseButton}
			>
				<DialogTitle className="sr-only">
					{fileName || (isImage ? "图片预览" : isPDF ? "PDF 预览" : "文件预览")}
				</DialogTitle>
				<div
					className={`relative ${isPDF ? "flex justify-center items-center" : ""}`}
				>
					{isImage ? (
						<button
							className="relative max-h-[90vh] max-w-[90vw] bg-black/80 rounded-lg overflow-hidden"
							onClick={onClose}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									onClose();
								}
							}}
							type="button"
							aria-label="关闭图片预览"
						>
							<img
								src={fileUrl}
								alt={fileName || "图片预览"}
								className="max-h-[90vh] max-w-[90vw] object-contain"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.stopPropagation();
									}
								}}
							/>
						</button>
					) : isPDF ? (
						<div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl mx-auto max-w-5xl">
							{/* PDF 预览头部 */}
							<div className="flex items-center justify-between p-4 border-b border-gray-200 border-solid dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
										📄 {fileName || "PDF 文档"}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={handleExternalOpen}
										className="flex items-center gap-1"
									>
										<IconExternalLink className="h-4 w-4" />
										在新窗口打开
									</Button>
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={onClose}
									>
										<IconX className="h-4 w-4" />
									</Button>
								</div>
							</div>
							{/* PDF 内容 */}
							<div className="relative flex justify-center">
								<iframe
									src={fileUrl}
									className="w-full h-[75vh] border-0"
									title={fileName || "PDF预览"}
								/>
							</div>
						</div>
					) : (
						<div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-2xl mx-auto max-w-md">
							<div className="text-center">
								<div className="text-4xl mb-4">📄</div>
								<p className="text-lg font-medium mb-2">{fileName || "文件"}</p>
								<p className="text-sm text-gray-500 mb-4">
									暂不支持预览此文件类型
								</p>
								<Button onClick={handleExternalOpen}>
									<IconExternalLink className="h-4 w-4 mr-2" />
									在新窗口打开
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
