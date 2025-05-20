"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useApiSettings } from "@/context/api-settings-context";

export function ApiSettingsButton() {
	const { setIsOpen } = useApiSettings();

	return (
		<Button
			variant="secondary"
			onClick={() => setIsOpen(true)}
			title="API Settings"
		>
			<Settings className="h-4 w-4" />
			<span>API Settings</span>
		</Button>
	);
}
