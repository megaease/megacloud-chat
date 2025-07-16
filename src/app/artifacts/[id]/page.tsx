import { Suspense } from "react";
import { ArtifactDetail } from "@/components/artifacts/ArtifactDetail";
import { Spinner } from "@/components/spinner";

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
			<Suspense fallback={<Spinner />}>
				<ArtifactDetail artifactId={id} />
			</Suspense>
		</div>
	);
}
