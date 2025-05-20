"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModelSelector } from "./chat/model-selector";
import { ApiSettingsButton } from "./api-settings-button";
import { ModeToggle } from "./mode-toggle";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function HeaderNav() {
	return (
		<header className="relative flex shrink-0 items-center border-b px-4 justify-between py-2.5 h-14">
			<div className="flex items-center gap-3">
				<SidebarTrigger />
				<ModelSelector />
			</div>
			<div className="flex items-center gap-3">
				<ApiSettingsButton />
				<ModeToggle />
				<Button
					variant="ghost"
					size="sm"
					asChild
					className="h-9 w-9 rounded-md text-foreground hover:bg-accent/70 transition-all"
				>
					<a
						href="https://github.com/megaease/megacloud-mcp-client"
						target="_blank"
						rel="noopener noreferrer"
						title="View on GitHub"
					>
						<Github className="h-5 w-5" />
						<span className="sr-only">GitHub</span>
					</a>
				</Button>
			</div>
		</header>
	);
}
