import { Suspense } from "react";
import { ArtifactDetail } from "@/components/artifacts/ArtifactDetail";
import { Spinner } from "@/components/spinner";

interface ArtifactDetailPageProps {
	params: {
		id: string;
	};
}

export default function ArtifactDetailPage({
	params,
}: ArtifactDetailPageProps) {
	return (
		<div className="space-y-6">
			<Suspense fallback={<Spinner />}>
				<ArtifactDetail artifactId={params.id} />
			</Suspense>
		</div>
	);
}
