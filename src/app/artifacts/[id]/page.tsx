import { Suspense } from "react";
import { ArtifactDetail } from "@/components/artifacts/ArtifactDetail";
import { Loader } from "@/components/prompt-kit/loader";

interface ArtifactDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default async function ArtifactDetailPage({
	params,
}: ArtifactDetailPageProps) {
	const { id } = await params;
	
	return (
		<div className="space-y-6">
			<Suspense fallback={<Loader />}>
				<ArtifactDetail artifactId={id} />
			</Suspense>
		</div>
	);
}
