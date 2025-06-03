"use client";

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useApiProvider } from "@/context/api-provider-context";

export function ApiProviderSettingsButton() {
	const { setProviderModalOpen } = useApiProvider();

	return (
		<Button
			variant={"ghost"}
			onClick={() => setProviderModalOpen(true)}
			size={"icon"}
			className="ml-auto"
		>
			<Settings className="h-4 w-4" />
		</Button>
	);
}
