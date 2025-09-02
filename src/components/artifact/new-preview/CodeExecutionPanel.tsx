"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { ArtifactLanguage } from "@/lib/artifact-types";
import {
	AlertCircle,
	CheckCircle,
	Copy,
	Download,
	Loader2,
	Play,
	RotateCcw,
	Square,
	XCircle,
} from "lucide-react";
import React, { useState, useCallback, useEffect } from "react";
import { useExecution } from "./ExecutionContext";
import type { ExecutionResult } from "./types";

interface CodeExecutionPanelProps {
	code: string;
	language: ArtifactLanguage;
	className?: string;
}

export function CodeExecutionPanel({
	code,
	language,
	className = "",
}: CodeExecutionPanelProps) {
	const [inputCode, setInputCode] = useState(code);
	const [output, setOutput] = useState<ExecutionResult | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);
	const [executionHistory, setExecutionHistory] = useState<
		Array<ExecutionResult & { timestamp: number }>
	>([]);
	const [autoExecute, setAutoExecute] = useState(false);

	const { executeCode, initializeEngine, isEngineReady } = useExecution();

	// Initialize engine when component mounts
	useEffect(() => {
		if (!isEngineReady(language)) {
			initializeEngine(language).catch((err) => {
				console.error(`Failed to initialize ${language} engine:`, err);
			});
		}
	}, [language, initializeEngine, isEngineReady]);

	// Auto-execute when code changes if enabled
	useEffect(() => {
		if (autoExecute && isEngineReady(language) && inputCode.trim()) {
			const timer = setTimeout(() => {
				handleExecute();
			}, 1000); // Debounce execution
			return () => clearTimeout(timer);
		}
	}, [inputCode, autoExecute, language, isEngineReady]);

	const handleExecute = useCallback(async () => {
		if (!isEngineReady(language) || isExecuting) return;

		setIsExecuting(true);
		try {
			const result = await executeCode(language, inputCode);
			const resultWithTimestamp = { ...result, timestamp: Date.now() };
			setOutput(resultWithTimestamp);
			setExecutionHistory((prev) => [resultWithTimestamp, ...prev.slice(0, 9)]); // Keep last 10 results
		} catch (error) {
			const errorResult: ExecutionResult = {
				output: "",
				error: error instanceof Error ? error.message : "Execution failed",
				success: false,
			};
			const errorResultWithTimestamp = {
				...errorResult,
				timestamp: Date.now(),
			};
			setOutput(errorResultWithTimestamp);
			setExecutionHistory((prev) => [
				errorResultWithTimestamp,
				...prev.slice(0, 9),
			]);
		} finally {
			setIsExecuting(false);
		}
	}, [inputCode, language, executeCode, isEngineReady, isExecuting]);

	const handleReset = useCallback(() => {
		setInputCode(code);
		setOutput(null);
		setExecutionHistory([]);
	}, [code]);

	const handleCopyCode = useCallback(() => {
		navigator.clipboard.writeText(inputCode).catch((err) => {
			console.error("Failed to copy code:", err);
		});
	}, [inputCode]);

	const handleCopyOutput = useCallback(() => {
		if (output?.output) {
			navigator.clipboard.writeText(output.output).catch((err) => {
				console.error("Failed to copy output:", err);
			});
		}
	}, [output]);

	const handleDownloadCode = useCallback(() => {
		const extensions: Record<string, string> = {
			javascript: "js",
			python: "py",
		};
		const extension = extensions[language] || "txt";
		const blob = new Blob([inputCode], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `code.${extension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [inputCode, language]);

	const formatExecutionTime = (timestamp?: number) => {
		if (!timestamp) return "";
		return new Date(timestamp).toLocaleTimeString();
	};

	const getStatusIcon = (result: ExecutionResult) => {
		if (result.success) {
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		}
		return <XCircle className="h-4 w-4 text-red-500" />;
	};

	return (
		<div className={`space-y-4 ${className}`}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="capitalize">
						{language}
					</Badge>
					{!isEngineReady(language) && (
						<Badge variant="secondary" className="text-orange-600">
							<Loader2 className="h-3 w-3 animate-spin mr-1" />
							Initializing...
						</Badge>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setAutoExecute(!autoExecute)}
						className={autoExecute ? "bg-blue-50 border-blue-200" : ""}
					>
						Auto Run {autoExecute ? "On" : "Off"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleReset}
						disabled={isExecuting}
					>
						<RotateCcw className="h-4 w-4 mr-1" />
						Reset
					</Button>
				</div>
			</div>

			{/* Code Editor */}
			<Card className="p-4">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-medium">Code Editor</h3>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopyCode}
							className="h-8 w-8 p-0"
						>
							<Copy className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDownloadCode}
							className="h-8 w-8 p-0"
						>
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<Textarea
					value={inputCode}
					onChange={(e) => setInputCode(e.target.value)}
					className="font-mono text-sm min-h-[200px] resize-none"
					placeholder={`Enter your ${language} code here...`}
					disabled={isExecuting}
				/>
				<div className="flex items-center justify-between mt-2">
					<div className="text-xs text-muted-foreground">
						{inputCode.split("\n").length} lines • {inputCode.length} characters
					</div>
					<Button
						onClick={handleExecute}
						disabled={
							!isEngineReady(language) || isExecuting || !inputCode.trim()
						}
						size="sm"
					>
						{isExecuting ? (
							<>
								<Square className="h-4 w-4 mr-1" />
								Running...
							</>
						) : (
							<>
								<Play className="h-4 w-4 mr-1" />
								Run Code
							</>
						)}
					</Button>
				</div>
			</Card>

			{/* Current Output */}
			{output && (
				<Card className="p-4">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-medium">Output</h3>
							{getStatusIcon(output)}
							{output.error && (
								<Badge variant="destructive" className="text-xs">
									Error
								</Badge>
							)}
						</div>
						{output.output && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleCopyOutput}
								className="h-8 w-8 p-0"
							>
								<Copy className="h-4 w-4" />
							</Button>
						)}
					</div>
					<ScrollArea className="h-[200px] w-full">
						{output.error ? (
							<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md font-mono">
								{output.error}
							</div>
						) : (
							<pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
								{output.output || "No output"}
							</pre>
						)}
					</ScrollArea>
				</Card>
			)}

			{/* Execution History */}
			{executionHistory.length > 0 && (
				<Card className="p-4">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-sm font-medium">Execution History</h3>
						<Badge variant="outline" className="text-xs">
							{executionHistory.length} runs
						</Badge>
					</div>
					<div className="space-y-2">
						{executionHistory.map((result, index) => (
							<div
								key={`execution-${result.timestamp}-${index}`}
								className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
							>
								{getStatusIcon(result)}
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<span className="text-xs font-medium">
											Run {executionHistory.length - index}
										</span>
										<span className="text-xs text-muted-foreground">
											{formatExecutionTime(result.timestamp)}
										</span>
									</div>
									{result.error ? (
										<p className="text-xs text-red-600 truncate">
											{result.error}
										</p>
									) : (
										<p className="text-xs text-muted-foreground truncate">
											{result.output || "No output"}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				</Card>
			)}

			{/* Help Section */}
			<Card className="p-4 bg-blue-50 border-blue-200">
				<div className="flex items-start gap-2">
					<AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
					<div className="text-sm text-blue-800">
						<h4 className="font-medium mb-1">Tips for {language} execution:</h4>
						<ul className="space-y-1 text-xs">
							{language === "python" ? (
								<>
									<li>
										• Use{" "}
										<code className="bg-blue-100 px-1 rounded">print()</code>{" "}
										for output
									</li>
									<li>• Popular packages like numpy, pandas are available</li>
									<li>
										• Use pyodide.loadPackage() to import additional packages
									</li>
								</>
							) : (
								<>
									<li>
										• Use{" "}
										<code className="bg-blue-100 px-1 rounded">
											console.log()
										</code>{" "}
										for output
									</li>
									<li>• Modern JavaScript features are supported</li>
									<li>• Return values will be displayed automatically</li>
								</>
							)}
							<li>
								• Enable "Auto Run" to execute code automatically as you type
							</li>
							<li>• Execution history keeps your last 10 results</li>
						</ul>
					</div>
				</div>
			</Card>
		</div>
	);
}
