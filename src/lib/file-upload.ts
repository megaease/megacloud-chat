import {
	FILE_SIZE_LIMITS,
	SUPPORTED_FILE_TYPES,
	type SupportedFileType,
	type UploadError,
	type UploadResponse,
} from "@/types/file-upload";

const UPLOAD_ENDPOINT = "/api/files/upload";

/**
 * 验证文件是否符合上传要求
 */
export const validateFile = (
	file: File,
): { valid: boolean; error?: string } => {
	// 检查文件类型
	const allSupportedTypes: readonly string[] = [
		...SUPPORTED_FILE_TYPES.IMAGES,
		...SUPPORTED_FILE_TYPES.DOCUMENTS,
	];

	if (!allSupportedTypes.includes(file.type)) {
		return {
			valid: false,
			error: "不支持的文件类型。请上传 JPEG、PNG、WebP、GIF 图片或 PDF 文档。",
		};
	}

	// 检查文件大小
	const maxSize =
		file.type === "application/pdf"
			? FILE_SIZE_LIMITS.DOCUMENT
			: FILE_SIZE_LIMITS.IMAGE;

	if (file.size > maxSize) {
		const maxSizeMB = maxSize / (1024 * 1024);
		return {
			valid: false,
			error: `文件大小超过限制。${file.type === "application/pdf" ? "PDF" : "图片"}文件最大支持 ${maxSizeMB}MB。`,
		};
	}

	return { valid: true };
};

/**
 * 上传文件
 */
export const uploadFile = async (file: File): Promise<UploadResponse> => {
	// 先验证文件
	const validation = validateFile(file);
	if (!validation.valid) {
		throw new Error(validation.error);
	}

	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch(UPLOAD_ENDPOINT, {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		const errorData: UploadError = await response.json();
		throw new Error(errorData.error || "上传失败");
	}

	return await response.json();
};

/**
 * 批量上传文件
 */
export const uploadFiles = async (files: File[]): Promise<UploadResponse[]> => {
	const uploadPromises = files.map((file) => uploadFile(file));
	return Promise.all(uploadPromises);
};

/**
 * 获取文件预览信息
 */
export const getFilePreviewInfo = (file: File) => {
	return {
		name: file.name,
		size: file.size,
		type: file.type,
		isImage: file.type.startsWith("image/"),
		isPDF: file.type === "application/pdf",
		sizeFormatted: formatFileSize(file.size),
	};
};

/**
 * 格式化文件大小显示
 */
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * 检查是否为支持的文件类型
 */
export const isSupportedFileType = (file: File): boolean => {
	const allSupportedTypes: readonly string[] = [
		...SUPPORTED_FILE_TYPES.IMAGES,
		...SUPPORTED_FILE_TYPES.DOCUMENTS,
	];
	return allSupportedTypes.includes(file.type);
};

/**
 * 文件拖拽上传 Hook
 */
export const useFileDrop = () => {
	const handleDrop = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		const files = Array.from(e.dataTransfer.files);
		return files.filter((file) => isSupportedFileType(file));
	};

	const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
	};

	return { handleDrop, handleDragOver };
};
