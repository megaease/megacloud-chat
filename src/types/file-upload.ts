export interface UploadResponse {
	url: string;
	pathname: string;
	contentType: string;
	contentDisposition: string;
	originalName: string;
	fileType: string;
	fileSize: number;
	isImage: boolean;
	isPDF: boolean;
}

export interface UploadError {
	error: string;
}

export const SUPPORTED_FILE_TYPES = {
	IMAGES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
	DOCUMENTS: ["application/pdf"],
} as const;

export const FILE_SIZE_LIMITS = {
	IMAGE: 5 * 1024 * 1024, // 5MB
	DOCUMENT: 10 * 1024 * 1024, // 10MB
} as const;

export type SupportedImageType = (typeof SUPPORTED_FILE_TYPES.IMAGES)[number];
export type SupportedDocumentType =
	(typeof SUPPORTED_FILE_TYPES.DOCUMENTS)[number];
export type SupportedFileType = SupportedImageType | SupportedDocumentType;
