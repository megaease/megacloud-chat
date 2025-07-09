"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, AlertCircle, Package, Loader2, Code2 } from "lucide-react";
import { PreviewToolbar } from "../PreviewToolbar";

interface PythonPreviewProps {
	content: string;
	showToolbar?: boolean;
}

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

export const PythonPreview = ({
	content,
	showToolbar = true,
}: PythonPreviewProps) => {
	const tArtifact = useTranslations("Artifact");
	const [output, setOutput] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [pyodideReady, setPyodideReady] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [preloadProgress, setPreloadProgress] = useState(0);
	const pyodideRef = useRef<PyodideInterface | null>(null);

	// 组件挂载时开始预加载 Pyodide
	useEffect(() => {
		const preloadPyodide = async () => {
			// 检查是否已经加载过
			if (window.pyodide || pyodideRef.current) {
				setPyodideReady(true);
				return;
			}

			// 检查 script 是否已加载
			if (typeof window.loadPyodide === "function") {
				// 如果脚本已加载，直接初始化
				initializePyodide();
			} else {
				// 等待脚本加载完成
				const checkInterval = setInterval(() => {
					if (typeof window.loadPyodide === "function") {
						clearInterval(checkInterval);
						// 延迟一点再初始化，避免阻塞主线程
						setTimeout(() => initializePyodide(), 1000);
					}
				}, 100);

				// 10 秒后超时
				setTimeout(() => {
					clearInterval(checkInterval);
				}, 10000);
			}
		};

		preloadPyodide();
	}, []);

	// 初始化 Pyodide
	const initializePyodide = useCallback(async () => {
		if (pyodideRef.current || isInitializing) return;

		setIsInitializing(true);
		setPreloadProgress(20);

		try {
			// 如果 Pyodide 脚本还没加载，等待加载
			if (typeof window.loadPyodide !== "function") {
				console.log("Pyodide script not loaded yet, loading...");
				const script = document.createElement("script");
				script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
				script.async = true;
				document.head.appendChild(script);

				await new Promise((resolve, reject) => {
					script.onload = resolve;
					script.onerror = reject;
				});
			}

			setPreloadProgress(50);

			// 初始化 Pyodide
			console.log("Initializing Pyodide...");
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
			setError(
				`Pyodide 初始化失败：${err instanceof Error ? err.message : String(err)}`,
			);
			console.error("Pyodide initialization failed:", err);
		} finally {
			setIsInitializing(false);
		}
	}, [isInitializing]);

	// 执行 Python 代码
	const executeCode = async () => {
		if (!pyodideRef.current) {
			await initializePyodide();
			if (!pyodideRef.current) return;
		}

		setIsLoading(true);
		setError("");
		setOutput("");

		try {
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
					finalOutput = `${finalOutput}${finalOutput ? "\n" : ""}输出：${resultStr}`;
				}
			}

			setOutput(finalOutput || "代码执行完成，无输出");
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setIsLoading(false);
		}
	};

	// 安装包
	const installPackage = async (packageName: string) => {
		if (!pyodideRef.current) {
			await initializePyodide();
			if (!pyodideRef.current) return;
		}

		setIsLoading(true);
		try {
			await pyodideRef.current.loadPackage([packageName]);
			setOutput(
				(prev) => `${prev ? `${prev}\n` : ""}✅ 成功安装包：${packageName}`,
			);
		} catch (err) {
			setError(
				`安装包失败：${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	const commonPackages = ["numpy", "pandas", "matplotlib", "scipy"];

	return (
		<div className="flex flex-col h-full">
			{/* 工具栏 - 可选显示 */}
			{showToolbar && (
				<PreviewToolbar
					content={content}
					filename="python_code.py"
					mimeType="text/x-python"
				>
					<Code2 className="w-3.5 h-3.5 text-blue-600" />
					<span className="text-sm font-medium text-blue-700">
						Python 执行器
					</span>
					<Badge variant="outline" className="text-xs">
						Pyodide
					</Badge>
					{!pyodideReady && (
						<Badge variant="secondary" className="text-xs">
							{isInitializing ? `初始化中... ${preloadProgress}%` : "未就绪"}
						</Badge>
					)}

					{/* 常用包安装 */}
					<div className="flex items-center gap-1 ml-3">
						{commonPackages.map((pkg) => (
							<Button
								key={pkg}
								variant="outline"
								size="sm"
								className="h-5 px-2 text-xs"
								onClick={() => installPackage(pkg)}
								disabled={isLoading || !pyodideReady}
							>
								<Package className="w-2.5 h-2.5 mr-1" />
								{pkg}
							</Button>
						))}
					</div>

					{/* 执行按钮 */}
					<Button
						onClick={pyodideReady ? executeCode : initializePyodide}
						size="sm"
						variant="outline"
						className="h-6 px-2 ml-2"
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2 className="w-3 h-3 mr-1 animate-spin" />
						) : (
							<Play className="w-3 h-3 mr-1" />
						)}
						{pyodideReady ? "运行" : "初始化"}
					</Button>
				</PreviewToolbar>
			)}

			{/* 内容区域 */}
			<div className="flex-1 flex flex-col p-4 overflow-hidden">
				{error && (
					<div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex-shrink-0">
						<AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
						<div className="text-sm text-red-700 dark:text-red-400">
							<div className="font-medium mb-1">执行错误：</div>
							<pre className="whitespace-pre-wrap text-xs">{error}</pre>
						</div>
					</div>
				)}

				{output ? (
					<div className="flex-1 bg-gray-900 text-green-400 p-4 font-mono text-sm border rounded-md overflow-auto">
						<div className="text-gray-400 mb-2 font-sans text-xs uppercase tracking-wide">
							执行结果
						</div>
						<pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center space-y-2">
							{isLoading ? (
								<>
									<Loader2 className="w-8 h-8 mx-auto animate-spin" />
									<p className="text-sm">
										{isInitializing
											? `正在初始化 Pyodide... ${preloadProgress}%`
											: "正在执行代码..."}
									</p>
								</>
							) : pyodideReady ? (
								<>
									<Play className="w-8 h-8 mx-auto opacity-30" />
									<p className="text-sm">点击运行按钮执行 Python 代码</p>
								</>
							) : (
								<>
									<div className="text-blue-600 text-2xl">🐍</div>
									<p className="text-sm">
										{isInitializing
											? `正在初始化 Python 环境... ${preloadProgress}%`
											: "点击初始化按钮启动 Python 环境"}
									</p>
									{!isInitializing && (
										<p className="text-xs text-muted-foreground/70">
											Pyodide 运行时已预加载，初始化会很快
										</p>
									)}
								</>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
