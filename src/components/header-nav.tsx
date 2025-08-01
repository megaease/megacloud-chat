"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UnifiedProviderModelSelector } from "./provider/unified-provider-model-selector";
import { ApiProviderSettingsButton } from "./provider/api-provider-settings-button";
import { ModeToggle } from "./mode-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { IconBrandGithub } from "@tabler/icons-react";

export function HeaderNav() {
  return (
    <header className="relative flex shrink-0 items-center px-4 justify-between py-2.5 h-14">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <UnifiedProviderModelSelector />
      </div>
      <div className="flex items-center gap-3">
        <ApiProviderSettingsButton />
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-9 w-9 rounded-md text-foreground hover:bg-accent/70 transition-all"
        >
          <a
            href="https://github.com/megaease/megacloud-chatmcp-client"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
          >
            <IconBrandGithub className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </a>
        </Button>
        <LanguageSwitcher />
        <ModeToggle />
      </div>
    </header>
  );
}
