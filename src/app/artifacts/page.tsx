import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ArtifactManager } from "@/components/artifacts/ArtifactManager";
import { Spinner } from "@/components/spinner";
import { getArtifacts } from "@/lib/artifact-actions";

export default async function ArtifactsPage() {
	const t = await getTranslations("ArtifactManager");
	const { data: initialArtifacts, error } = await getArtifacts();

	return (    
		<div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">{t("title")}</h1>
			</div>
			<Suspense fallback={<div className="flex justify-center items-center min-h-64"><Spinner /></div>}>
				{error ? (
					<div className="text-destructive text-center p-8">{error}</div>
				) : (
					<ArtifactManager initialArtifacts={initialArtifacts || []} />
				)}
			</Suspense>
		</div>
	);
}
