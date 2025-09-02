"use client";

import type { ArtifactLanguage } from "@/lib/artifact-types";
import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import type { ExecutionContext, ExecutionResult } from "./types";

// Pyodide type definitions
interface PyodideInterface {
	runPython: (code: string) => unknown;
	loadPackage: (packages: string[]) => Promise<void>;
}

// Extended Window interface for Pyodide
interface WindowWithPyodide {
	loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
	pyodide: PyodideInterface | null;
}

interface ExecutionContextType {
	contexts: Record<string, ExecutionContext>;
	initializeEngine: (language: ArtifactLanguage) => Promise<void>;
	executeCode: (
		language: ArtifactLanguage,
		code: string,
	) => Promise<ExecutionResult>;
	isEngineReady: (language: ArtifactLanguage) => boolean;
}

const ExecutionCtx = createContext<ExecutionContextType | undefined>(undefined);

export function ExecutionProvider({ children }: { children: React.ReactNode }) {
	const [contexts, setContexts] = useState<Record<string, ExecutionContext>>(
		{},
	);

	const initializeEngine = useCallback(async (language: ArtifactLanguage) => {
		setContexts((prev) => ({
			...prev,
			[language]: {
				isReady: false,
				isInitializing: true,
				progress: 0,
				error: null,
			},
		}));

		try {
			// Simulate initialization progress
			for (let progress = 20; progress <= 80; progress += 20) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				setContexts((prev) => ({
					...prev,
					[language]: {
						...(prev[language] || {
							isReady: false,
							isInitializing: true,
							progress: 0,
							error: null,
						}),
						progress,
					},
				}));
			}

			// Language-specific initialization
			switch (language) {
				case "python":
					// Initialize Pyodide
					if (typeof window !== "undefined") {
						await initializePythonEngine();
					}
					break;
				case "javascript":
					// JavaScript engine is always ready
					break;
				default:
					throw new Error(`Unsupported language: ${language}`);
			}

			setContexts((prev) => ({
				...prev,
				[language]: {
					...(prev[language] || {
						isReady: false,
						isInitializing: true,
						progress: 0,
						error: null,
					}),
					isReady: true,
					isInitializing: false,
					progress: 100,
					error: null,
				},
			}));
		} catch (error) {
			setContexts((prev) => ({
				...prev,
				[language]: {
					...(prev[language] || {
						isReady: false,
						isInitializing: true,
						progress: 0,
						error: null,
					}),
					isReady: false,
					isInitializing: false,
					progress: 0,
					error: error instanceof Error ? error.message : String(error),
				},
			}));
		}
	}, []);

	const executeCode = useCallback(
		async (
			language: ArtifactLanguage,
			code: string,
		): Promise<ExecutionResult> => {
			const context = contexts[language];
			if (!context?.isReady) {
				return {
					output: "",
					error: "Engine not initialized",
					success: false,
				};
			}

			try {
				switch (language) {
					case "python":
						return await executePythonCode(code);
					case "javascript":
						return await executeJavaScriptCode(code);
					default:
						return {
							output: "",
							error: `Unsupported language: ${language}`,
							success: false,
						};
				}
			} catch (error) {
				return {
					output: "",
					error: error instanceof Error ? error.message : String(error),
					success: false,
				};
			}
		},
		[contexts],
	);

	const isEngineReady = useCallback(
		(language: ArtifactLanguage) => {
			return contexts[language]?.isReady || false;
		},
		[contexts],
	);

	return (
		<ExecutionCtx.Provider
			value={{
				contexts,
				initializeEngine,
				executeCode,
				isEngineReady,
			}}
		>
			{children}
		</ExecutionCtx.Provider>
	);
}

export function useExecution() {
	const context = useContext(ExecutionCtx);
	if (context === undefined) {
		throw new Error("useExecution must be used within an ExecutionProvider");
	}
	return context;
}

// Python engine initialization
async function initializePythonEngine(): Promise<void> {
	if (typeof window === "undefined") return;

	const win = window as unknown as WindowWithPyodide;

	if (win.pyodide) return;

	if (win.loadPyodide && typeof win.loadPyodide !== "function") {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
		script.async = true;
		document.head.appendChild(script);

		await new Promise((resolve, reject) => {
			script.onload = resolve;
			script.onerror = reject;
		});
	}

	win.pyodide = await win.loadPyodide({
		indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
	});

	// Setup output capture
	win.pyodide.runPython(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.output = StringIO()
        
    def write(self, text):
        self.output.write(text)
        
    def flush(self):
        pass
        
    def get_output(self):
        return self.output.getvalue()
        
    def clear(self):
        self.output = StringIO()

_output_capture = OutputCapture()
sys.stdout = _output_capture
sys.stderr = _output_capture
  `);
}

// Python code execution
async function executePythonCode(code: string): Promise<ExecutionResult> {
	const win = window as unknown as WindowWithPyodide;
	if (typeof window === "undefined" || !win.pyodide) {
		return {
			output: "",
			error: "Python engine not available",
			success: false,
		};
	}

	try {
		// Clear previous output
		win.pyodide.runPython("_output_capture.clear()");

		// Execute code
		const result = win.pyodide.runPython(code);

		// Get captured output
		const capturedOutput = win.pyodide.runPython(
			"_output_capture.get_output()",
		) as string;

		let finalOutput = capturedOutput || "";

		// Add return value if any
		if (result !== undefined && result !== null) {
			const resultStr = String(result);
			if (resultStr !== "None") {
				finalOutput = `${finalOutput}${
					finalOutput ? "\n" : ""
				}Output: ${resultStr}`;
			}
		}

		return {
			output: finalOutput || "Code execution completed",
			error: null,
			success: true,
		};
	} catch (error) {
		return {
			output: "",
			error: error instanceof Error ? error.message : String(error),
			success: false,
		};
	}
}

// JavaScript code execution
async function executeJavaScriptCode(code: string): Promise<ExecutionResult> {
	try {
		const logs: string[] = [];
		const originalLog = console.log;
		console.log = (...args) => {
			logs.push(
				args
					.map((arg) =>
						typeof arg === "object"
							? JSON.stringify(arg, null, 2)
							: String(arg),
					)
					.join(" "),
			);
		};

		// Execute code
		// eslint-disable-next-line no-new-func
		const func = new Function(code);
		const result = func();
		console.log = originalLog;

		// Add result if any
		if (result !== undefined) {
			logs.push(
				`Return value: ${
					typeof result === "object"
						? JSON.stringify(result, null, 2)
						: String(result)
				}`,
			);
		}

		return {
			output: logs.join("\n") || "Code execution completed",
			error: null,
			success: true,
		};
	} catch (error) {
		return {
			output: "",
			error: error instanceof Error ? error.message : String(error),
			success: false,
		};
	}
}
