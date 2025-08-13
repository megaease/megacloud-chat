"use client";

import { Button } from "@/components/ui/button";
import {
	IconFile,
	IconFileText,
	IconLoader2,
	IconPhoto,
	IconX,
} from "@tabler/icons-react";
import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";

export type UploadedFile = { name: string; url: string; contentType: string };

type UploadingInfo = { name: string; contentType: string; previewUrl?: string };

type FileUploadContextValue = {
	inputRef: React.RefObject<HTMLInputElement | null>;
	accept?: string;
	multiple?: boolean;
	uploading: Map<string, UploadingInfo>;
	uploaded: UploadedFile[];
	remove: (predicate: (f: UploadedFile) => boolean) => void;
	open: () => void;
	handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

function useFileUploadContext() {
	const ctx = useContext(FileUploadContext);
	if (!ctx)
		throw new Error("FileUpload components must be used within <FileUpload>");
	return ctx;
}

export interface FileUploadProps {
	accept?: string;
	multiple?: boolean;
	uploadUrl?: string;
	value?: UploadedFile[]; // controlled uploaded files
	onChange?: (files: UploadedFile[]) => void;
	onSelectedFilesChange?: (files: File[]) => void;
	className?: string;
	children?: React.ReactNode;
}

export function FileUpload({
	accept = "image/*,.pdf",
	multiple = true,
	uploadUrl = "/api/files/upload",
	value,
	onChange,
	onSelectedFilesChange,
	className,
	children,
}: FileUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [internalUploaded, setInternalUploaded] = useState<UploadedFile[]>([]);
	const [uploading, setUploading] = useState<Map<string, UploadingInfo>>(
		new Map(),
	);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const uploaded = value ?? internalUploaded;
	const setUploaded = onChange ?? setInternalUploaded;

	const open = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const remove = useCallback(
		(predicate: (f: UploadedFile) => boolean) => {
			const next = uploaded.filter((f) => !predicate(f));
			setUploaded(next);
		},
		[uploaded, setUploaded],
	);

	const handleFileChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			if (!e.target.files || e.target.files.length === 0) return;
			const selectedFiles = Array.from(e.target.files);

			// Only images and PDFs for now
			const supportedFiles = selectedFiles.filter((file) => {
				const isImage = file.type.startsWith("image/");
				const isPDF = file.type === "application/pdf";
				return isImage || isPDF;
			});

			// update selected files state and notify upstream
			setSelectedFiles((prev) => {
				const next = multiple
					? [...prev, ...supportedFiles]
					: supportedFiles.slice(0, 1);
				onSelectedFilesChange?.(next);
				return next;
			});

			for (const file of supportedFiles) {
				const fileName = file.name;
				const previewUrl = file.type.startsWith("image/")
					? URL.createObjectURL(file)
					: undefined;

				setUploading(
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

					const response = await fetch(uploadUrl, {
						method: "POST",
						body: formData,
					});
					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}));
						throw new Error(errorData.error || `Failed to upload ${file.name}`);
					}
					const data = await response.json();
					setUploaded([
						...uploaded,
						{
							name: data.pathname,
							url: data.url,
							contentType: data.contentType,
						},
					]);
				} catch (err) {
					console.error("Upload failed:", err);
				} finally {
					setUploading((prev) => {
						const next = new Map(prev);
						const info = next.get(fileName);
						if (info?.previewUrl) URL.revokeObjectURL(info.previewUrl);
						next.delete(fileName);
						return next;
					});
				}
			}

			// reset input so same file can be selected again
			e.target.value = "";
		},
		[setUploaded, uploaded, uploadUrl, multiple, onSelectedFilesChange],
	);

	const ctx = useMemo<FileUploadContextValue>(
		() => ({
			inputRef,
			accept,
			multiple,
			uploading,
			uploaded,
			remove,
			open,
			handleFileChange,
		}),
		[accept, multiple, uploading, uploaded, remove, open, handleFileChange],
	);

	return (
		<FileUploadContext.Provider value={ctx}>
			<div className={className}>
				<input
					ref={inputRef}
					type="file"
					className="hidden"
					onChange={handleFileChange}
					multiple={multiple}
					accept={accept}
					aria-label="Upload files"
					title="Upload files"
				/>
				{children}
			</div>
		</FileUploadContext.Provider>
	);
}

export function FileUploadTrigger({
	asChild = false,
	children,
}: {
	asChild?: boolean;
	children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
}) {
	const { open } = useFileUploadContext();
	if (asChild) {
		return React.cloneElement(children, {
			onClick: (e: React.MouseEvent) => {
				children.props.onClick?.(e);
				if (!e.defaultPrevented) open();
			},
		});
	}
	return (
		<Button type="button" size="icon" variant="ghost" onClick={open}>
			{children}
		</Button>
	);
}

export function FileUploadPreviewBar({
	onPreview,
	onRemove,
	className,
}: {
	onPreview?: (file: UploadedFile) => void;
	onRemove?: (file: UploadedFile) => void;
	className?: string;
}) {
	const { uploading, uploaded, remove } = useFileUploadContext();

	const isImageFile = (contentType: string) => contentType.startsWith("image/");
	const getFileTypeIcon = (contentType: string) => {
		if (contentType.startsWith("image/"))
			return <IconPhoto className="h-4 w-4" />;
		if (contentType === "application/pdf")
			return <IconFileText className="h-4 w-4" />;
		if (contentType.includes("text/"))
			return <IconFileText className="h-4 w-4" />;
		return <IconFile className="h-4 w-4" />;
	};

	if (uploaded.length === 0 && uploading.size === 0) return null;

	return (
		<div
			className={`px-4 py-3 flex flex-wrap gap-2 border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/50 ${
				className ?? ""
			}`}
		>
			{Array.from(uploading).map(([fileName, fileInfo]) => (
				<div
					key={`uploading-${fileName}`}
					className={`relative group ${
						isImageFile(fileInfo.contentType)
							? "rounded-lg overflow-hidden"
							: "flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-lg text-sm shadow-sm"
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
								<IconLoader2 className="h-6 w-6 animate-spin text-white" />
							</div>
						</div>
					) : (
						<>
							{getFileTypeIcon(fileInfo.contentType)}
							<IconLoader2 className="h-3 w-3 animate-spin" />
							<span className="truncate max-w-32">{fileInfo.name}</span>
						</>
					)}
				</div>
			))}

			{uploaded.map((file) => (
				<div
					key={file.url}
					className={`relative group ${
						isImageFile(file.contentType)
							? "rounded-lg overflow-hidden shadow-md"
							: "flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-lg text-sm shadow-sm"
					}`}
				>
					{isImageFile(file.contentType) ? (
						<>
							<button
								type="button"
								className="cursor-pointer"
								onClick={() => onPreview?.(file)}
								aria-label={`Open ${file.name}`}
							>
								<img
									src={file.url}
									alt={file.name}
									className="h-20 w-20 rounded-lg object-cover hover:opacity-80 transition-opacity"
								/>
							</button>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60"
								onClick={() => {
									onRemove?.(file);
									remove((f) => f.url === file.url);
								}}
							>
								<IconX className="h-3 w-3" />
							</Button>
						</>
					) : (
						<>
							<button
								type="button"
								className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-1 transition-colors"
								onClick={() => onPreview?.(file)}
								aria-label={`预览 ${file.name}`}
							>
								{getFileTypeIcon(file.contentType)}
								<span className="truncate max-w-32">{file.name}</span>
							</button>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="h-5 w-5 p-0 rounded-full bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-xs hover:shadow-sm transition-all duration-200"
								onClick={() => {
									onRemove?.(file);
									remove((f) => f.url === file.url);
								}}
							>
								<IconX className="h-3 w-3" />
							</Button>
						</>
					)}
				</div>
			))}
		</div>
	);
}

export const FileUploadCompound = Object.assign(FileUpload, {
	Trigger: FileUploadTrigger,
	PreviewBar: FileUploadPreviewBar,
});

export default FileUploadCompound;
