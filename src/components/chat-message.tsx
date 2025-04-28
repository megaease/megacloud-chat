import type { Message } from "ai";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageProps {
	message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
	const isUser = message.role === "user";
	return (
		<div
			className={cn(
				"flex items-start gap-4 text-sm",
				isUser ? "flex-row-reverse" : "",
			)}
		>
			<Avatar className={cn("mt-0.5", isUser ? "bg-primary" : "bg-muted")}>
				<AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
				{/* {!isUser && <AvatarImage src="/ai-avatar.png" alt="AI" />} */}
			</Avatar>
			<div
				className={cn(
					"rounded-lg px-4 py-2 max-w-[80%]",
					isUser ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				<p className="whitespace-pre-wrap">{message.content}</p>
			</div>
		</div>
	);
}
