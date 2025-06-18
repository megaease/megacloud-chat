import { getTranslations } from "next-intl/server";

export default async function TestServerPage() {
	const t = await getTranslations("HomePage");
	const tCommon = await getTranslations("Common");

	return (
		<div className="p-8 space-y-6">
			<div className="border-b pb-4">
				<h1 className="text-3xl font-bold text-primary">{t("title")}</h1>
				<p className="text-lg text-muted-foreground mt-2">{t("description")}</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-3">
					<h2 className="text-xl font-semibold">
						Server Component Translations:
					</h2>
					<div className="bg-card p-4 border rounded-lg space-y-2">
						<p>
							<strong>Loading:</strong> {tCommon("loading")}
						</p>
						<p>
							<strong>Error:</strong> {tCommon("error")}
						</p>
						<p>
							<strong>Save:</strong> {tCommon("save")}
						</p>
						<p>
							<strong>Cancel:</strong> {tCommon("cancel")}
						</p>
						<p>
							<strong>Language:</strong> {tCommon("language")}
						</p>
					</div>
				</div>

				<div className="space-y-3">
					<h2 className="text-xl font-semibold">Test Information:</h2>
					<div className="bg-muted p-4 rounded-lg space-y-2">
						<p>
							This page demonstrates server-side translation with{" "}
							<code>getTranslations</code>
						</p>
						<p>
							Try switching languages using the language switcher in the header
						</p>
						<p>The content should update after page refresh</p>
					</div>
				</div>
			</div>

			<div className="mt-8 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
				<h3 className="text-lg font-medium text-green-800 dark:text-green-400">
					✅ next-intl Configuration Complete
				</h3>
				<p className="text-green-700 dark:text-green-300 mt-1">
					Your project is now configured with next-intl for internationalization
					support.
				</p>
			</div>
		</div>
	);
}
