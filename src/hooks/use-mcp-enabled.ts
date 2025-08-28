"use client";

import { useEffect, useState } from "react";

const MCP_ENABLED_KEY = "mcpEnabled";

// 安全读取 localStorage
function getStoredValue(): boolean {
	const isClient = typeof window !== "undefined";
	if (!isClient) return false;

	try {
		const value = localStorage.getItem(MCP_ENABLED_KEY);
		return value === "true";
	} catch {
		return false;
	}
}

// 安全写入 localStorage
function setStoredValue(value: boolean): void {
	const isClient = typeof window !== "undefined";
	if (!isClient) return;

	try {
		localStorage.setItem(MCP_ENABLED_KEY, String(value));
	} catch {
		// 静默失败，不影响功能
	}
}

export function useMcpEnabled() {
	const [enabled, setEnabled] = useState<boolean>(getStoredValue);

	// 状态变化时同步到 localStorage
	useEffect(() => {
		setStoredValue(enabled);
	}, [enabled]);

	const setMcpEnabled = (value: boolean): boolean => {
		setEnabled(value);
		return value;
	};

	const toggleMcpEnabled = (): boolean => {
		const newValue = !enabled;
		setEnabled(newValue);
		return newValue;
	};

	return { mcpEnabled: enabled, setMcpEnabled, toggleMcpEnabled };
}
