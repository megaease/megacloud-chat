"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";

// Minimal shape matching useChat sendMessage input
export type PendingChatPayload = {
	text: string;
	files?: Array<{
		type: "file";
		name: string;
		mediaType: string;
		url: string;
	}>;
};

interface ChatFlowContextValue {
	setPendingMessage: (chatId: string, payload: PendingChatPayload) => void;
	consumePendingMessage: (chatId: string) => PendingChatPayload | undefined;
}

const ChatFlowContext = createContext<ChatFlowContextValue | null>(null);

export function ChatFlowProvider({ children }: { children: React.ReactNode }) {
	// store pending messages in a ref to persist across route transitions
	const pendingRef = useRef(new Map<string, PendingChatPayload>());

	const setPendingMessage = useCallback(
		(chatId: string, payload: PendingChatPayload) => {
			pendingRef.current.set(chatId, payload);
		},
		[],
	);

	const consumePendingMessage = useCallback((chatId: string) => {
		const val = pendingRef.current.get(chatId);
		if (val) pendingRef.current.delete(chatId);
		return val;
	}, []);

	const value = useMemo(
		() => ({ setPendingMessage, consumePendingMessage }),
		[setPendingMessage, consumePendingMessage],
	);

	return (
		<ChatFlowContext.Provider value={value}>
			{children}
		</ChatFlowContext.Provider>
	);
}

export function useChatFlow() {
	const ctx = useContext(ChatFlowContext);
	if (!ctx) throw new Error("useChatFlow must be used within ChatFlowProvider");
	return ctx;
}
