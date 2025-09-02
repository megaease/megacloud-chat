"use client";

import {
	getLanguage,
	getPreviewType,
} from "@/components/artifact/utils/language-detector";
import { CodeEditor } from "@/components/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ArtifactLanguage } from "@/lib/artifact-types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
	CheckCircle,
	Code2,
	Copy,
	Download,
	Eye,
	Loader2,
	Monitor,
	Package,
	Play,
	Smartphone,
	Tablet,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { CodeExecutionPanel } from "./CodeExecutionPanel";
import { HtmlPreviewRenderer } from "./renderers/HtmlPreviewRenderer";
import { ReactPreviewRenderer } from "./renderers/ReactPreviewRenderer";

// Pyodide 类型定义
interface PyodideInterface {
	runPython: (code: string) => unknown;
	loadPackage: (packages: string[]) => Promise<void>;
}

declare global {
	interface Window {
		loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
		pyodide: PyodideInterface;
	}
}

interface NewCodePreviewProps {
	content: string;
	language: ArtifactLanguage;
	className?: string;
	initialViewMode?: "code" | "preview" | "split";
	showToolbar?: boolean;
	showViewModeSelector?: boolean;
	canExecute?: boolean;
	canPreview?: boolean;
	canResize?: boolean;
	defaultHeight?: string;
}

export function NewCodePreview({
	content,
	language,
	className = "",
	initialViewMode = "code",
	showToolbar = true,
	showViewModeSelector = true,
	canExecute = false,
	canPreview = true,
	canResize = true,
	defaultHeight = "600px",
}: NewCodePreviewProps) {
	const tArtifact = useTranslations("Artifact");
	const tCommon = useTranslations("Common");

	const [viewMode, setViewMode] = useState<"code" | "preview">(
		initialViewMode === "split" ? "code" : initialViewMode,
	);
	const [previewSize, setPreviewSize] = useState<
		"desktop" | "tablet" | "mobile"
	>("desktop");
	const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

	// Python 特定状态
	const [pyodideReady, setPyodideReady] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [preloadProgress, setPreloadProgress] = useState(0);
	const [isExecuting, setIsExecuting] = useState(false);
	const [consoleOutput, setConsoleOutput] = useState<string>("");
	const [consoleError, setConsoleError] = useState<string>("");
	const pyodideRef = useRef<PyodideInterface | null>(null);

	const finalLanguage = getLanguage(language, content);
	const previewType = getPreviewType(finalLanguage);

	// Python Pyodide 懒加载 - 不自动预加载
	useEffect(() => {
		if (previewType !== "python") return;

		// 只检查是否已经存在现成的 Pyodide 实例
		if (window.pyodide || pyodideRef.current) {
			setPyodideReady(true);
		}
	}, [previewType]);

	// 初始化 Pyodide
	const initializePyodide = useCallback(async () => {
		if (pyodideRef.current || isInitializing) return;

		setIsInitializing(true);
		setPreloadProgress(20);
		setConsoleError("");

		try {
			// 检查是否已经加载了 Pyodide
			if (typeof window.loadPyodide !== "function") {
				console.log("Pyodide script not loaded yet, loading...");
				const script = document.createElement("script");
				script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
				script.async = true;
				document.head.appendChild(script);

				// 等待脚本加载完成
				await new Promise((resolve, reject) => {
					script.onload = resolve;
					script.onerror = reject;
				});
			}

			setPreloadProgress(50);

			console.log("Initializing Pyodide...");
			// 使用更小的内存配置来避免内存分配问题
			pyodideRef.current = await window.loadPyodide({
				indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
			});

			setPreloadProgress(80);

			// 重定向 stdout 和 stderr
			pyodideRef.current.runPython(`
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

			setPreloadProgress(100);
			setPyodideReady(true);
			console.log("Pyodide initialized successfully!");
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);
			console.error("Pyodide initialization failed:", err);

			// 提供更具体的错误信息
			if (
				errorMessage.includes("WebAssembly.Memory") &&
				errorMessage.includes("could not allocate memory")
			) {
				setConsoleError(
					`${tArtifact("pyodideInitFailed")}: ${tArtifact(
						"memoryAllocationFailed",
					)}. ${tArtifact("tryRefreshPage")}`,
				);
			} else {
				setConsoleError(`${tArtifact("pyodideInitFailed")}: ${errorMessage}`);
			}
		} finally {
			setIsInitializing(false);
		}
	}, [isInitializing, tArtifact]);

	// 安装包
	const installPackage = async (packageName: string) => {
		if (!pyodideRef.current) {
			await initializePyodide();
			if (!pyodideRef.current) return;
		}

		setIsExecuting(true);
		try {
			await pyodideRef.current.loadPackage([packageName]);
			setConsoleOutput(
				(prev) =>
					`${prev ? `${prev}\n` : ""}✅ ${tArtifact(
						"packageInstalled",
					)}: ${packageName}`,
			);
		} catch (err) {
			setConsoleError(
				`${tArtifact("packageInstallFailed")}: ${
					err instanceof Error ? err.message : String(err)
				}`,
			);
		} finally {
			setIsExecuting(false);
		}
	};

	// 执行代码
	const handleExecute = async () => {
		if (previewType === "python" || previewType === "javascript") {
			setIsExecuting(true);
			setConsoleOutput("");
			setConsoleError("");

			try {
				if (previewType === "javascript") {
					// JavaScript 执行逻辑
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

					// eslint-disable-next-line no-new-func
					const func = new Function(content);
					const result = func();
					console.log = originalLog;

					if (result !== undefined) {
						logs.push(
							`${tArtifact("returnValue")}: ${
								typeof result === "object"
									? JSON.stringify(result, null, 2)
									: String(result)
							}`,
						);
					}

					setConsoleOutput(
						logs.join("\n") || tArtifact("codeExecutionComplete"),
					);
				} else if (previewType === "python") {
					// Python 执行逻辑 - 先检查环境是否准备好
					if (!pyodideReady || !pyodideRef.current) {
						setConsoleError(tArtifact("pythonEnvironmentNotReady"));
						// 自动开始初始化
						await initializePyodide();
						if (!pyodideRef.current) {
							setConsoleError(tArtifact("pyodideInitFailed"));
							return;
						}
					}

					// 清空之前的输出
					pyodideRef.current.runPython("_output_capture.clear()");

					// 执行用户代码
					const result = pyodideRef.current.runPython(content);

					// 获取输出
					const capturedOutput = pyodideRef.current.runPython(
						"_output_capture.get_output()",
					) as string;

					let finalOutput = capturedOutput || "";

					// 如果有返回值且不是 None，添加到输出
					if (result !== undefined && result !== null) {
						const resultStr = String(result);
						if (resultStr !== "None") {
							finalOutput = `${finalOutput}${
								finalOutput ? "\n" : ""
							}${tArtifact("output")}: ${resultStr}`;
						}
					}

					setConsoleOutput(finalOutput || tArtifact("codeExecutionComplete"));
				}
			} catch (error) {
				setConsoleError(
					`${tArtifact("executionError")}: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			} finally {
				setIsExecuting(false);
			}
		}
	};

	const handleToggleViewMode = () => {
		setViewMode((prev) => (prev === "code" ? "preview" : "code"));
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(content);
			setCopyStatus("copied");
			setTimeout(() => setCopyStatus("idle"), 2000);
		} catch (error) {
			console.error("Failed to copy content:", error);
		}
	};

	const handleDownload = () => {
		const extensions: Record<string, string> = {
			html: "html",
			css: "css",
			javascript: "js",
			typescript: "ts",
			python: "py",
			jsx: "jsx",
			tsx: "tsx",
			react: "js",
			json: "json",
			markdown: "md",
			sql: "sql",
			text: "txt",
		};

		const extension = extensions[language] || "txt";
		const blob = new Blob([content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `code.${extension}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const renderPreview = () => {
		// Cast language to string to handle additional types like jsx, tsx
		const lang = language as string;

		switch (lang) {
			case "html":
				return <HtmlPreviewRenderer code={content} className="w-full h-full" />;
			case "react":
			case "jsx":
			case "tsx":
				return (
					<ReactPreviewRenderer code={content} className="w-full h-full" />
				);
			default:
				return (
					<Card className="p-8 h-full flex items-center justify-center">
						<div className="text-center text-muted-foreground">
							<p className="text-lg font-medium mb-2">Preview Not Available</p>
							<p className="text-sm">
								Preview is not supported for {language} files.
								{canExecute && " Try executing the code instead."}
							</p>
						</div>
					</Card>
				);
		}
	};

	const renderCodeEditor = () => {
		return (
			<ScrollArea className="h-full w-full">
				<pre className="p-4 text-sm font-mono whitespace-pre-wrap">
					{content}
				</pre>
			</ScrollArea>
		);
	};

	const renderExecutionPanel = () => {
		if (!canExecute) return null;

		return (
			<CodeExecutionPanel
				code={content}
				language={language}
				className="w-full h-full"
			/>
		);
	};

	const getPreviewSizeClasses = () => {
		switch (previewSize) {
			case "mobile":
				return "max-w-sm mx-auto";
			case "tablet":
				return "max-w-2xl mx-auto";
			default:
				return "";
		}
	};

	const renderModernCodeEditor = () => {
		return (
			<div className="h-full flex flex-col bg-slate-900 dark:bg-slate-950">
				{/* Code editor header */}
				<div className="flex items-center justify-between px-4 py-3 bg-slate-800 dark:bg-slate-900 border-b border-slate-700">
					<div className="flex items-center gap-3">
						<Code2 className="w-4 h-4 text-blue-400" />
						<span className="text-sm font-medium text-slate-200">
							{language.toUpperCase()}
						</span>
						<Badge variant="secondary" className="text-xs">
							{content.split("\n").length} lines
						</Badge>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleCopy}
							className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
						>
							<Copy className="w-3.5 h-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleDownload}
							className="h-7 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
						>
							<Download className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>

				{/* Code content */}
				<ScrollArea className="flex-1 overflow-auto">
					<div className="p-4">
						<pre className="text-sm font-mono text-slate-100 leading-relaxed whitespace-pre-wrap overflow-x-auto">
							{content}
						</pre>
					</div>
				</ScrollArea>
			</div>
		);
	};

	const renderModernPreview = () => {
		return (
			<div className="h-full overflow-auto bg-white dark:bg-slate-900">
				{renderPreview()}
			</div>
		);
	};

	const renderModernExecutionPanel = () => {
		if (!canExecute) return null;

		// 对于 Python 和 JavaScript，显示更大的执行面板，类似老系统的布局
		const panelHeight =
			language === "python" || language === "javascript" ? "h-96" : "h-48";

		return (
			<div
				className={`${panelHeight} bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800`}
			>
				<CodeExecutionPanel
					code={content}
					language={language}
					className="w-full h-full"
				/>
			</div>
		);
	};

	// 为 Python 和 JavaScript 提供专门的布局，类似老系统
	const renderPythonLayout = () => {
		return (
			<motion.div
				className="h-full flex flex-col"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
			>
				<ResizablePanelGroup direction="vertical" className="h-full">
					<ResizablePanel defaultSize={70} minSize={30}>
						<div className="h-full overflow-hidden">
							<CodeEditor
								value={content}
								language={finalLanguage}
								showHeader={false}
								showCopyButton={true}
								height="100%"
								className="h-full"
							/>
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel defaultSize={30} minSize={20}>
						<div className="h-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col border-t border-slate-200 dark:border-slate-800">
							{/* Console 头部 */}
							<div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950">
								<div className="flex items-center gap-2">
									<div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
										<div className="w-2 h-2 rounded-full bg-blue-500" />
										<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
											{tArtifact("console")}
										</span>
									</div>
									{(consoleOutput || consoleError) && (
										<div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
											<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
											<span className="text-xs text-green-700 dark:text-green-400 font-medium">
												{tArtifact("active")}
											</span>
										</div>
									)}

									{/* Python 特定状态 */}
									{previewType === "python" && !pyodideReady && (
										<div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
											<div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
											<span className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
												{isInitializing
													? `${tArtifact("initializing")} ${preloadProgress}%`
													: tArtifact("notReady")}
											</span>
										</div>
									)}
								</div>
								<div className="flex items-center gap-1">
									{/* Python 包安装按钮 */}
									{previewType === "python" && pyodideReady && (
										<div className="flex items-center gap-1 mr-2">
											{["numpy", "pandas", "matplotlib"].map((pkg) => (
												<Button
													key={pkg}
													variant="outline"
													size="sm"
													onClick={() => installPackage(pkg)}
													disabled={isExecuting}
													className="h-6 px-2 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
													title={`${tArtifact("install")} ${pkg}`}
												>
													<Package className="w-2.5 h-2.5 mr-1" />
													{pkg}
												</Button>
											))}
										</div>
									)}

									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setConsoleOutput("");
											setConsoleError("");
										}}
										className="h-7 px-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
										title={tArtifact("clearOutput")}
									>
										{tArtifact("clear")}
									</Button>
								</div>
							</div>

							{/* Console 内容 */}
							<div className="flex-1 p-4 overflow-auto bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-950/50 dark:to-slate-900/50">
								{consoleError && (
									<div className="mb-3 p-3 bg-gradient-to-r from-red-50 to-red-25 dark:from-red-950/50 dark:to-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400 text-sm shadow-sm">
										<div className="flex items-start gap-2">
											<div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0 mt-0.5 flex items-center justify-center">
												<span className="text-white text-xs font-bold">!</span>
											</div>
											<div className="flex-1">
												<div className="text-xs font-semibold mb-1 text-red-800 dark:text-red-300">
													{tArtifact("executionError")}
												</div>
												<pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
													{consoleError}
												</pre>
											</div>
										</div>
									</div>
								)}
								{consoleOutput && (
									<div className="p-3 bg-gray-900 text-green-400 rounded-lg shadow-lg border border-gray-700">
										<div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
											<div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
												<div className="w-1 h-1 rounded-full bg-white" />
											</div>
											<span className="text-xs text-gray-400 font-mono font-semibold tracking-wide">
												OUTPUT
											</span>
										</div>
										<pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
											{consoleOutput}
										</pre>
									</div>
								)}
								{!consoleOutput && !consoleError && (
									<div className="flex items-center justify-center h-full text-muted-foreground">
										<div className="text-center p-8">
											{previewType === "python" ? (
												<>
													<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
														<div className="text-2xl">🐍</div>
													</div>
													<p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
														{pyodideReady
															? tArtifact("pythonEnvironmentReady")
															: tArtifact("pythonEnvironment")}
													</p>
													<p className="text-xs text-slate-500 dark:text-slate-500">
														{pyodideReady
															? tArtifact("clickExecuteToRun")
															: isInitializing
																? `${tArtifact(
																		"initializing",
																	)}... ${preloadProgress}%`
																: tArtifact("clickInitializeToStart")}
													</p>
												</>
											) : (
												<>
													<div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center">
														<div className="text-2xl">⚡</div>
													</div>
													<p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
														{tArtifact("ready")}
													</p>
													<p className="text-xs text-slate-500 dark:text-slate-500">
														{tArtifact("clickExecuteToViewOutput")}
													</p>
												</>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			</motion.div>
		);
	};

	return (
		<div
			className={`overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-full flex flex-col ${className}`}
		>
			{/* Modern header */}
			<div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
						<Code2 className="w-4 h-4 text-blue-600" />
						<span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
							{language.toUpperCase()}
						</span>
					</div>

					{/* View mode selector */}
					{showViewModeSelector && canPreview && (
						<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
							<Button
								variant={viewMode === "code" ? "default" : "ghost"}
								size="sm"
								onClick={() => setViewMode("code")}
								className="h-7 px-3 text-xs"
							>
								<Code2 className="w-3 h-3 mr-1" />
								Code
							</Button>
							<Button
								variant={viewMode === "preview" ? "default" : "ghost"}
								size="sm"
								onClick={() => setViewMode("preview")}
								className="h-7 px-3 text-xs"
								disabled={!canPreview}
							>
								<Eye className="w-3 h-3 mr-1" />
								Preview
							</Button>
						</div>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Preview size selector */}
					{viewMode === "preview" && canPreview && (
						<div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
							<Button
								variant={previewSize === "desktop" ? "default" : "ghost"}
								size="sm"
								onClick={() => setPreviewSize("desktop")}
								className="h-7 px-2 text-xs"
								title="Desktop view"
							>
								<Monitor className="w-3 h-3" />
							</Button>
							<Button
								variant={previewSize === "tablet" ? "default" : "ghost"}
								size="sm"
								onClick={() => setPreviewSize("tablet")}
								className="h-7 px-2 text-xs"
								title="Tablet view"
							>
								<Tablet className="w-3 h-3" />
							</Button>
							<Button
								variant={previewSize === "mobile" ? "default" : "ghost"}
								size="sm"
								onClick={() => setPreviewSize("mobile")}
								className="h-7 px-2 text-xs"
								title="Mobile view"
							>
								<Smartphone className="w-3 h-3" />
							</Button>
						</div>
					)}

					{/* 执行按钮 - 只对 Python/JavaScript 显示 */}
					{(previewType === "python" || previewType === "javascript") && (
						<Button
							variant="outline"
							size="sm"
							onClick={
								previewType === "python" && !pyodideReady
									? initializePyodide
									: handleExecute
							}
							disabled={
								isExecuting || (previewType === "python" && isInitializing)
							}
							className="h-8 px-3 text-sm font-medium gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
							title={
								previewType === "python" && !pyodideReady
									? tArtifact("initializePythonEnvironment")
									: tArtifact("executeCode")
							}
						>
							{isExecuting || isInitializing ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Play className="h-4 w-4" />
							)}
							<span className="hidden sm:inline">
								{isExecuting
									? tArtifact("executing")
									: isInitializing
										? tArtifact("initializing")
										: previewType === "python" && !pyodideReady
											? tArtifact("initialize")
											: tArtifact("execute")}
							</span>
						</Button>
					)}

					{/* Action buttons */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopy}
						className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
					>
						<Copy className="w-3 h-3" />
						{copyStatus === "copied" ? "Copied!" : "Copy"}
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={handleDownload}
						className="h-8 px-3 text-xs font-medium gap-1.5 border-slate-300 dark:border-slate-600"
					>
						<Download className="w-3 h-3" />
						Download
					</Button>
				</div>
			</div>

			{/* Main content area */}
			<div className="h-[calc(100%-64px)]">
				{viewMode === "code" && (
					<>
						{/* 对于 Python 和 JavaScript，使用专门的布局 */}
						{language === "python" || language === "javascript" ? (
							renderPythonLayout()
						) : (
							<div className="h-full flex flex-col">
								{renderModernCodeEditor()}
								{renderModernExecutionPanel()}
							</div>
						)}
					</>
				)}

				{viewMode === "preview" && (
					<div
						className={`h-full bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 ${getPreviewSizeClasses()}`}
					>
						{renderModernPreview()}
					</div>
				)}
			</div>

			{/* Modern status bar */}
			<div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 rounded-full bg-green-500" />
						<span>Ready</span>
					</div>
					<span>{content.split("\n").length} lines</span>
					<span>{content.length.toLocaleString()} characters</span>
				</div>
				<div className="flex items-center gap-3">
					{copyStatus === "copied" && (
						<Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
							✓ Copied to clipboard
						</Badge>
					)}
				</div>
			</div>
		</div>
	);
}
