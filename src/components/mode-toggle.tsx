"use client";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-9 w-9 rounded-md text-foreground hover:text-foreground hover:bg-accent/50 transition-all"
				>
					<Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="p-2 rounded-md">
				<DropdownMenuItem
					onClick={() => setTheme("light")}
					className="flex items-center gap-2 rounded-md py-2 my-0.5 focus:bg-accent hover:bg-accent/80 cursor-pointer"
				>
					<Sun className="h-4 w-4 mr-2" />
					Light
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("dark")}
					className="flex items-center gap-2 rounded-md py-2 my-0.5 focus:bg-accent hover:bg-accent/80 cursor-pointer"
				>
					<Moon className="h-4 w-4 mr-2" />
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme("system")}
					className="flex items-center gap-2 rounded-md py-2 my-0.5 focus:bg-accent hover:bg-accent/80 cursor-pointer"
				>
					<span className="h-4 w-4 mr-2 flex items-center justify-center">
						💻
					</span>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
