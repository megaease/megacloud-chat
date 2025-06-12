"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { UIArtifact } from "@/lib/artifact-types";

interface ArtifactContextType {
	artifact: UIArtifact;
	setArtifact: (
		artifact: UIArtifact | ((prev: UIArtifact) => UIArtifact),
	) => void;
}

const initialArtifact: UIArtifact = {
	documentId: "",
	title: "",
	kind: "text",
	content: "",
	isVisible: false,
	status: "idle",
	boundingBox: { top: 0, left: 0, width: 0, height: 0 },
};

const ArtifactContext = createContext<ArtifactContextType | undefined>(
	undefined,
);

export function ArtifactProvider({ children }: { children: ReactNode }) {
	const [artifact, setArtifact] = useState<UIArtifact>(initialArtifact);

	return (
		<ArtifactContext.Provider value={{ artifact, setArtifact }}>
			{children}
		</ArtifactContext.Provider>
	);
}

export function useArtifact() {
	const context = useContext(ArtifactContext);
	if (!context) {
		throw new Error("useArtifact must be used within ArtifactProvider");
	}
	return context;
}
