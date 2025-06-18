import { useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
import type React from "react";
import {
	uploadFile,
	uploadFiles,
	validateFile,
	getFilePreviewInfo,
	isSupportedFileType,
} from "@/lib/file-upload";
import type { UploadResponse } from "@/types/file-upload";

interface FileUploadProps {
	multiple?: boolean;
	onUploadComplete?: (results: UploadResponse[]) => void;
	onUploadError?: (error: string) => void;
	className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
	multiple = false,
	onUploadComplete,
	onUploadError,
	className = "",
}) => {
	const tCommon = useTranslations('Common');
	const [uploading, setUploading] = useState(false);
	const [dragOver, setDragOver] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const handleFileSelect = useCallback(
		(files: FileList | null) => {
			if (!files) return;

			const fileArray = Array.from(files);
			const supportedFiles = fileArray.filter((file) => {
				const validation = validateFile(file);
				if (!validation.valid) {
					onUploadError?.(validation.error || "文件验证失败");
					return false;
				}
				return true;
			});

			if (multiple) {
				setSelectedFiles((prev) => [...prev, ...supportedFiles]);
			} else {
				setSelectedFiles(supportedFiles.slice(0, 1));
			}
		},
		[multiple, onUploadError],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);
			handleFileSelect(e.dataTransfer.files);
		},
		[handleFileSelect],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleFileSelect(e.target.files);
		},
		[handleFileSelect],
	);

	const handleUpload = useCallback(async () => {
		if (selectedFiles.length === 0) return;

		setUploading(true);
		try {
			const results = await uploadFiles(selectedFiles);
			onUploadComplete?.(results);
			setSelectedFiles([]);
		} catch (error) {
			onUploadError?.(error instanceof Error ? error.message : "上传失败");
		} finally {
			setUploading(false);
		}
	}, [selectedFiles, onUploadComplete, onUploadError]);

	const removeFile = useCallback((index: number) => {
		setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
	}, []);

	return (
		<div className={`file-upload ${className}`}>
			{/* 拖拽区域 */}
			<div
				className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 border-[1px] border-solid hover:border-gray-400"}
        `}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => document.getElementById("file-input")?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						document.getElementById("file-input")?.click();
					}
				}}
				role="button"
				tabIndex={0}
				aria-label="点击或拖拽文件到此处上传"
			>
				<div className="space-y-4">
					<div className="text-4xl">📁</div>
					<div>
						<p className="text-lg font-medium">
							{dragOver ? "放开以上传文件" : "点击或拖拽文件到此处"}
						</p>
						<p className="text-sm text-gray-500 mt-2">
							支持 JPEG、PNG、WebP、GIF 图片（最大 5MB）和 PDF 文档（最大 10MB）
						</p>
					</div>
				</div>
			</div>

			{/* 隐藏的文件输入 */}
			<input
				id="file-input"
				type="file"
				multiple={multiple}
				accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
				onChange={handleInputChange}
				className="hidden"
				aria-label="选择文件上传"
			/>

			{/* 选中的文件列表 */}
			{selectedFiles.length > 0 && (
				<div className="mt-4 space-y-2">
					<h3 className="font-medium">选中的文件：</h3>
					{selectedFiles.map((file, index) => {
						const preview = getFilePreviewInfo(file);
						return (
							<div
								key={`${file.name}-${file.size}-${index}`}
								className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
							>
								<div className="flex items-center space-x-3">
									<div className="text-2xl">
										{preview.isImage ? "🖼️" : preview.isPDF ? "📄" : "📁"}
									</div>
									<div>
										<p className="font-medium">{preview.name}</p>
										<p className="text-sm text-gray-500">
											{preview.sizeFormatted} • {preview.type}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => removeFile(index)}
									className="text-red-500 hover:text-red-700 text-sm"
								>
									移除
								</button>
							</div>
						);
					})}

					{/* 上传按钮 */}
					<button
						type="button"
						onClick={handleUpload}
						disabled={uploading}
						className={`
              w-full py-2 px-4 rounded-lg font-medium transition-colors
              ${
								uploading
									? "bg-gray-300 cursor-not-allowed"
									: "bg-blue-500 hover:bg-blue-600 text-white"
							}
            `}
					>
						{uploading ? "上传中..." : `上传 ${selectedFiles.length} 个文件`}
					</button>
				</div>
			)}
		</div>
	);
};

export default FileUpload;
