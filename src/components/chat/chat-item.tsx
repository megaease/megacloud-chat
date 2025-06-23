import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function ChatItem({
	children,
	isUser,
	isCompact = false,
}: {
	children: React.ReactNode;
	isUser: boolean;
	isCompact?: boolean;
}) {
	return (
		<div
			className={cn(
				"flex gap-4 text-sm py-4",
				isUser ? "flex-row-reverse pr-1" : "pl-1",
				isCompact && isUser && "gap-0 pr-0",
			)}
		>
			{!isUser ? (
				<Avatar
					className={cn(
						"mt-0.5 h-8 w-8 flex-shrink-0 shadow-[var(--shadow-xs)]",
						// 在紧凑模式下隐藏用户头像
						isCompact && isUser && "hidden",
					)}
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
			) : null}
			<div
				className={cn(
					"flex-1 space-y-2 min-w-0", // 添加 min-w-0 防止内容溢出
					isUser ? "text-right" : "text-left",
					// 在紧凑模式下优化宽度处理
					isCompact ? (isUser ? "max-w-full" : "max-w-full") : "max-w-[89%]",
				)}
			>
				<div
					className={cn(
						"rounded-[var(--radius)] px-4 py-3 text-left min-w-0", // 添加 min-w-0
						// 在紧凑模式下优化显示
						isCompact
							? isUser
								? "inline-block bg-primary text-primary-foreground shadow-[var(--shadow-xs)] max-w-full break-words"
								: "block bg-transparent text-card-foreground w-full overflow-hidden"
							: isUser
								? "inline-block bg-primary text-primary-foreground shadow-[var(--shadow-xs)] w-auto"
								: "inline-block bg-transparent text-card-foreground w-full",
						// 添加链接样式修复
						"[&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-2",
						// 为用户消息中的链接使用对比色
						isUser
							? "[&_a]:text-primary-foreground/90 [&_a:hover]:text-primary-foreground"
							: "[&_a]:text-blue-600 [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300",
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
