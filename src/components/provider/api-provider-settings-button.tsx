"use client";

import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { IconSettings } from "@tabler/icons-react";
import { useApiProvider } from "@/context/api-provider-context";

export function ApiProviderSettingsButton() {
	const t = useTranslations('Settings');
	const { setProviderModalOpen } = useApiProvider();

	return (
		<Button
			variant={"ghost"}
			onClick={() => setProviderModalOpen(true)}
			size={"icon"}
			className="ml-auto"
			title={t('title')}
		>
			<IconSettings className="h-4 w-4" />
		</Button>
	);
}
