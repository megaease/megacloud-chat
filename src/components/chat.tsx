"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { ScrollArea } from "./ui/scroll-area";
import { Textarea } from "./ui/textarea";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function Chat() {
	const [chatId, setChatId] = useState<string | null>(null);
	const queryClient = useQueryClient();
	useEffect(() => {
		if (!chatId) {
			const newChatId = nanoid(16);
			setChatId(newChatId);
		}
	}, [chatId]);

	const { messages, input, handleInputChange, handleSubmit, status } = useChat({
		id: chatId || nanoid(), // Unique ID for the chat session
		maxSteps: 10,
		body: {
			chatId: chatId,
			userId: "user-id", // Replace with actual user ID
		},
		onFinish: (message) => {
			console.log("Message finished:", message);
			queryClient.invalidateQueries({
				queryKey: ["chats", "user-id"], // Replace with actual user ID
			});
		},
	});
	console.log("messages", messages, status);
	const isLoading = status === "streaming" || status === "submitted";
	return (
		<div className="mx-auto flex h-full w-full max-w-3xl flex-col px-4 sm:px-6 md:py-4">
			<div className="h-full">
				{messages.length === 0 ? (
					<div className="flex h-full items-center justify-center">
						<p className="text-muted-foreground">Start a conversation</p>
					</div>
				) : (
					<ScrollArea className="h-full flex-1 overflow-y-auto">
						<div className="mb-4 h-full space-y-4">
							{messages.map((message) => (
								<ChatMessage key={message.id} message={message} />
							))}
						</div>
					</ScrollArea>
				)}
			</div>
			<div className="mx-auto flex w-full flex-col px-4 sm:px-6 md:py-4 ">
				{/* Chat messages */}

				{/* Chat input */}
				<div className="border-t p-4 text-center">
					<form onSubmit={handleSubmit} className="relative">
						<Textarea
							value={input}
							onChange={handleInputChange}
							placeholder="Type your message..."
							className="w-full resize-none rounded-2xl border-2 pr-12 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							disabled={isLoading}
						/>
						<Button
							type="submit"
							size="icon"
							disabled={isLoading || !input.trim()}
							className="absolute right-2 bottom-2 h-8 w-8"
						>
							{isLoading ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
