import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function ChatItem({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="py-4 px-4">
			<div className="flex gap-4 text-sm pl-1">
				<Avatar
					className={cn(
						"mt-0.5 h-8 w-8 flex-shrink-0 shadow-[var(--shadow-xs)]",
					)}
				>
					<AvatarFallback
						className={cn(
							"rounded-[var(--radius)]",
							"bg-secondary text-secondary-foreground",
						)}
					>
						AI
					</AvatarFallback>
				</Avatar>

				<div className="flex-1 space-y-2 text-left max-w-[85%]">
					<div className="inline-block rounded-[var(--radius)] px-4 py-3 text-left bg-card text-card-foreground border border-border shadow-[var(--shadow-xs)] w-full">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
