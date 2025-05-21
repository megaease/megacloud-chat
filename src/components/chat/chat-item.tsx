import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function ChatItem({
	children,
	isUser,
}: {
	children: React.ReactNode;
	isUser: boolean;
}) {
	return (
		<div
			className={cn(
				"flex gap-4 text-sm py-4",
				isUser ? "flex-row-reverse pr-1" : "pl-1",
			)}
		>
			<Avatar
				className={cn("mt-0.5 h-8 w-8 flex-shrink-0 shadow-[var(--shadow-xs)]")}
			>
				<AvatarFallback
					className={cn(
						"rounded-[var(--radius)]",
						isUser
							? "bg-primary text-primary-foreground"
							: "bg-secondary text-secondary-foreground",
					)}
				>
					{isUser ? "U" : "AI"}
				</AvatarFallback>
			</Avatar>
			<div
				className={cn(
					"flex-1 space-y-2",
					isUser ? "text-right" : "text-left",
					"max-w-[89%]", // Limit maximum width
				)}
			>
				<div
					className={cn(
						"inline-block rounded-[var(--radius)] px-4 py-3 overflow-hidden text-left",
						isUser
							? "bg-primary text-primary-foreground shadow-[var(--shadow-xs)] w-auto"
							: "bg-card text-card-foreground border border-border shadow-[var(--shadow-xs)] w-full",
					)}
				>
					{children}
				</div>
				{/* {message.createdAt && (
				<div className="text-xs text-muted-foreground px-2 mt-2">
					{new Date(message.createdAt).toLocaleTimeString()}
				</div>
			)} */}
			</div>
		</div>
	);
}
