import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Artifact 管理",
	description: "管理您的所有 Artifacts",
};

export default function ArtifactsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div className="container mx-auto py-6">{children}</div>;
}
