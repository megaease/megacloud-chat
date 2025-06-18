"use client";

import * as React from "react";
import { useTranslations } from 'next-intl';
import { IconBrightness } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
	const t = useTranslations('Settings');
	const { setTheme, resolvedTheme } = useTheme();

	const toggleTheme = React.useCallback(() => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	}, [resolvedTheme, setTheme]);

	return (
		<Button
			variant="secondary"
			size="icon"
			className="group/toggle size-8"
			onClick={toggleTheme}
		>
			<IconBrightness />
			<span className="sr-only">{t('theme')}</span>
		</Button>
	);
}
