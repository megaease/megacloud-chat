import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

// Supported file types
const SUPPORTED_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
] as const;

const SUPPORTED_DOCUMENT_TYPES = ["application/pdf"] as const;

const ALL_SUPPORTED_TYPES: readonly string[] = [
	...SUPPORTED_IMAGE_TYPES,
	...SUPPORTED_DOCUMENT_TYPES,
];

// File size limits
const FILE_SIZE_LIMITS = {
	IMAGE: 5 * 1024 * 1024, // 5MB
	DOCUMENT: 10 * 1024 * 1024, // 10MB
} as const;

// Helper function to get file size limit based on type
const getFileSizeLimit = (fileType: string): number => {
	if (fileType === "application/pdf") {
		return FILE_SIZE_LIMITS.DOCUMENT;
	}
	return FILE_SIZE_LIMITS.IMAGE;
};

// Helper function to validate file extension matches MIME type
const validateFileExtension = (filename: string, mimeType: string): boolean => {
	const extension = filename.split(".").pop()?.toLowerCase();
	const mimeTypeMap: Record<string, string[]> = {
		"image/jpeg": ["jpg", "jpeg"],
		"image/png": ["png"],
		"image/webp": ["webp"],
		"image/gif": ["gif"],
		"application/pdf": ["pdf"],
	};

	return mimeTypeMap[mimeType]?.includes(extension || "") || false;
};

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z
	.object({
		file: z
			.instanceof(Blob)
			.refine(
				(file) => {
					const maxSize = getFileSizeLimit(file.type);
					return file.size <= maxSize;
				},
				{
					message:
						"File size should be less than 5MB for images or 10MB for PDF",
				},
			)
			.refine((file) => ALL_SUPPORTED_TYPES.includes(file.type), {
				message: "File type should be JPEG, PNG, WebP, GIF, or PDF",
			}),
		filename: z.string().optional(),
	})
	.refine(
		(data) => {
			// Additional validation to ensure file extension matches MIME type
			if (data.filename) {
				return validateFileExtension(data.filename, data.file.type);
			}
			return true;
		},
		{
			message: "File extension does not match the file type",
		},
	);

export async function POST(request: Request) {
	if (request.body === null) {
		return new Response("Request body is empty", { status: 400 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get("file") as Blob;

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		// Get filename from formData since Blob doesn't have name property
		const filename = (formData.get("file") as File).name;

		const validatedFile = FileSchema.safeParse({
			file,
			filename,
		});

		if (!validatedFile.success) {
			const errorMessage = validatedFile.error.errors
				.map((error) => error.message)
				.join(", ");

			return NextResponse.json({ error: errorMessage }, { status: 400 });
		}
		const fileBuffer = await file.arrayBuffer();

		// Generate a unique filename with timestamp to avoid conflicts
		const timestamp = Date.now();
		const fileExtension = filename.split(".").pop();
		const uniqueFilename = `${timestamp}_${filename}`;

		try {
			const data = await put(uniqueFilename, fileBuffer, {
				access: "public",
				allowOverwrite: false, // Changed to false since we're using unique names
			});

			// Return additional metadata about the uploaded file
			const response = {
				...data,
				originalName: filename,
				fileType: file.type,
				fileSize: file.size,
				isImage: file.type.startsWith("image/"),
				isPDF: file.type === "application/pdf",
			};

			return NextResponse.json(response);
		} catch (error) {
			console.error("Upload error:", error);
			return NextResponse.json({ error: "Upload failed" }, { status: 500 });
		}
	} catch (error) {
		console.error("Request processing error:", error);
		return NextResponse.json(
			{ error: "Failed to process request" },
			{ status: 500 },
		);
	}
}
