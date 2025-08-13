import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function useLanguageSwitcher() {
	const router = useRouter();
	const currentLocale = useLocale();

	const switchLanguage = (locale: string) => {
		// Set locale in cookies
		document.cookie = `locale=${locale}; path=/; max-age=31536000`; // 1 year

		// Refresh the page to apply new locale
		router.refresh();
	};

	return {
		currentLocale,
		switchLanguage,
	};
}
