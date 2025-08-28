"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface MCPDrawerContextType {
	isOpen: boolean;
	openDrawer: () => void;
	closeDrawer: () => void;
	toggleDrawer: () => void;
}

const MCPDrawerContext = createContext<MCPDrawerContextType | undefined>(
	undefined,
);

export function MCPDrawerProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	const openDrawer = useCallback(() => setIsOpen(true), []);
	const closeDrawer = useCallback(() => setIsOpen(false), []);
	const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), []);

	return (
		<MCPDrawerContext.Provider
			value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}
		>
			{children}
		</MCPDrawerContext.Provider>
	);
}

export function useMCPDrawer() {
	const context = useContext(MCPDrawerContext);
	if (context === undefined) {
		throw new Error("useMCPDrawer must be used within a MCPDrawerProvider");
	}
	return context;
}
