"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImagePreviewDialogProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
	imageName?: string;
}

export function ImagePreviewDialog({
	isOpen,
	onClose,
	imageUrl,
	imageName,
}: ImagePreviewDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-4xl w-fit p-0 bg-transparent border-none shadow-none [&>button]:hidden">
				<DialogTitle className="sr-only">{imageName || "图片预览"}</DialogTitle>
				<div>
					{imageUrl ? (
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
								src={imageUrl}
								alt={imageName || "图片预览"}
								className="max-h-[90vh] max-w-[90vw] object-contain"
								onClick={(e) => e.stopPropagation()}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.stopPropagation();
									}
								}}
							/>
						</button>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
