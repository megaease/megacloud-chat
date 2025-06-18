import { useTranslations } from "next-intl";

export default function TestPage() {
	const t = useTranslations("HomePage");
	const tCommon = useTranslations("Common");

	return (
		<div className="p-8 space-y-4">
			<h1 className="text-2xl font-bold">{t("title")}</h1>
			<p className="text-lg">{t("description")}</p>
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Common Translations:</h2>
				<p>Loading: {tCommon("loading")}</p>
				<p>Error: {tCommon("error")}</p>
				<p>Save: {tCommon("save")}</p>
				<p>Cancel: {tCommon("cancel")}</p>
			</div>
		</div>
	);
}
