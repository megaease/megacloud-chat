"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

interface EditMessageState {
	isLoading: boolean;
	error: string | null;
}

interface UseEditMessageReturn {
	editMessage: (messageId: string, content: string) => Promise<void>;
	isLoading: boolean;
	error: string | null;
	clearError: () => void;
}

export function useEditMessage(): UseEditMessageReturn {
	const t = useTranslations("Common");
	const [state, setState] = useState<EditMessageState>({
		isLoading: false,
		error: null,
	});

	const editMessage = async (
		messageId: string,
		content: string,
	): Promise<void> => {
		if (!messageId || !content.trim()) {
			const errorMessage = "Message ID and content are required";
			setState((prev) => ({ ...prev, error: errorMessage }));
			throw new Error(errorMessage);
		}

		setState((prev) => ({ ...prev, isLoading: true, error: null }));

		try {
			const response = await fetch(`/api/messages/${messageId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					userId: "user-id", // TODO: Get actual user ID from auth context
				},
				body: JSON.stringify({
					content: content.trim(),
					userId: "user-id", // TODO: Get actual user ID from auth context
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				// Handle specific error cases
				if (response.status === 404) {
					throw new Error("Message not found");
				} else if (response.status === 403) {
					throw new Error("You don't have permission to edit this message");
				} else if (response.status === 400) {
					throw new Error(errorData.error || "Invalid message content");
				} else {
					throw new Error(
						errorData.error || `Failed to update message (${response.status})`,
					);
				}
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Failed to update message");
			}

			// Show success message
			toast.success("Message updated successfully");

			setState((prev) => ({ ...prev, isLoading: false, error: null }));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";

			setState((prev) => ({
				...prev,
				isLoading: false,
				error: errorMessage,
			}));

			// Show error toast
			toast.error("Failed to update message", {
				description: errorMessage,
			});

			// Re-throw the error so the calling component can handle it
			throw error;
		}
	};

	const clearError = () => {
		setState((prev) => ({ ...prev, error: null }));
	};

	return {
		editMessage,
		isLoading: state.isLoading,
		error: state.error,
		clearError,
	};
}
