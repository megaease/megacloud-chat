"use client";

import { Loader2 } from "lucide-react";
import { ChatContainer } from "./chat-container";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// Fetch chat messages hook
function useChatMessages(chatId: string | undefined) {
	const query = useQuery({
		queryKey: ["chats", "user-id", chatId],
		queryFn: async () => {
			const res = await fetch(`/api/chats/${chatId}`, {
				headers: {
					userId: "user-id",
				},
			});
			const data = await res.json();
			return data.chat.messages;
		},
		staleTime: 1000 * 60 * 2,
		enabled: !!chatId,
	});
	return query;
}

// Entry component for the chat page
export function Chat() {
	const { id } = useParams();
	const chatId = id as string | undefined;

	// Load message data
	const { isLoading } = useChatMessages(chatId);

	// Show loading state
	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-primary" />
			</div>
		);
	}

	// Render chat container component
	return <ChatContainer />;
}
