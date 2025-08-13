import type { ArtifactKind, ArtifactLanguage } from "@/lib/artifact-types";
// hooks/use-artifact-versions.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface ArtifactVersion {
	id: string;
	version: number;
	title: string;
	content: string;
	kind: ArtifactKind;
	language?: ArtifactLanguage;
	updatedAt: string;
}

export function useArtifactVersions(
	documentId: string | undefined,
	forceRefresh = false,
) {
	const queryClient = useQueryClient();

	// 如果需要强制刷新，先清除缓存
	if (forceRefresh && documentId) {
		queryClient.invalidateQueries({
			queryKey: ["artifact-versions", documentId],
		});
	}

	return useQuery<ArtifactVersion[]>({
		queryKey: ["artifact-versions", documentId],
		queryFn: async () => {
			if (!documentId) {
				throw new Error("Document ID is required");
			}

			const response = await fetch(
				`/api/artifacts/${documentId}?versions=true&userId=user-id`,
			);

			if (!response.ok) {
				throw new Error(`Failed to fetch versions: ${response.status}`);
			}

			const data = await response.json();
			return data.versions || [];
		},
		enabled: !!documentId, // Only execute query when documentId exists
		staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // Force fresh data if needed
		gcTime: 10 * 60 * 1000, // Cache for 10 minutes
	});
}
