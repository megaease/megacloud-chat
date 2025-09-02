"use client";

import type { StreamDelta } from "@/types/stream-delta";
import { type ReactNode, createContext, useContext, useState } from "react";

interface DataStreamContext {
	dataStream: StreamDelta[];
	setDataStream: React.Dispatch<React.SetStateAction<StreamDelta[]>>;
}

const DataStreamContext = createContext<DataStreamContext | null>(null);

export function DataStreamProvider({ children }: { children: ReactNode }) {
	const [dataStream, setDataStream] = useState<StreamDelta[]>([]);

	const value = { dataStream, setDataStream };

	return (
		<DataStreamContext.Provider value={value}>
			{children}
		</DataStreamContext.Provider>
	);
}

export function useDataStream() {
	const context = useContext(DataStreamContext);
	if (!context) {
		throw new Error("useDataStream must be used within DataStreamProvider");
	}
	return context;
}
