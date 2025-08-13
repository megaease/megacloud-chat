"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const languages = [
	{ code: "en", name: "English", flag: "🇺🇸" },
	{ code: "zh", name: "中文", flag: "🇨🇳" },
];

export function LanguageSwitcher() {
	const t = useTranslations("Common");
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const getCurrentLanguage = () => {
		if (typeof document === "undefined")
			return languages[0] as (typeof languages)[0];

		const cookies = document.cookie.split(";");
		const localeCookie = cookies.find((c) => c.trim().startsWith("locale="));
		const currentLocale = localeCookie?.split("=")[1] || "en";
		return (
			languages.find((lang) => lang.code === currentLocale) ??
			(languages[0] as (typeof languages)[0])
		);
	};

	const handleLanguageChange = async (locale: string) => {
		// Set locale in cookies
		document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year

		// Refresh the page to apply new locale
		router.refresh();
	};

	if (!mounted) {
		return null;
	}

	const currentLang = getCurrentLanguage();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-2">
					<Globe className="h-4 w-4" />
					<span className="text-sm">{currentLang.flag}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{languages.map((language) => (
					<DropdownMenuItem
						key={language.code}
						onClick={() => handleLanguageChange(language.code)}
						className="gap-2"
					>
						<span>{language.flag}</span>
						<span>{language.name}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
