import { useChat } from "@ai-sdk/react";

// Test to see what useChat actually returns
const chatHooks = useChat();
console.log("chatHooks keys:", Object.keys(chatHooks));

// This will show us the actual available properties
type ChatHooksType = typeof chatHooks;
