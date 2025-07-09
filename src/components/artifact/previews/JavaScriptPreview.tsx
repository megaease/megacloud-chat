"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, AlertCircle } from "lucide-react";

interface JavaScriptPreviewProps {
	content: string;
	showToolbar?: boolean;
}

export const JavaScriptPreview = ({
	content,
	showToolbar = true,
}: JavaScriptPreviewProps) => {
	const tArtifact = useTranslations("Artifact");
	const [output, setOutput] = useState<string>("");
	const [error, setError] = useState<string>("");

	const executeCode = () => {
		try {
			setError("");
			const logs: string[] = [];

			// 重写 console.log 来捕获输出
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

			// 执行代码
			// 注意：这里只是一个简单的示例，实际应用中需要更安全的沙盒环境
			// eslint-disable-next-line no-new-func
			const func = new Function(content);
			const result = func();

			// 恢复原始 console.log
			console.log = originalLog;

			if (result !== undefined) {
				logs.push(
					`${tArtifact("returnValue", { value: typeof result === "object" ? JSON.stringify(result, null, 2) : String(result) })}`,
				);
			}

			setOutput(logs.join("\n") || tArtifact("noOutput"));
		} catch (err) {
			setError(
				err instanceof Error ? err.message : tArtifact("executionError"),
			);
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* 工具栏 */}
			{showToolbar && (
				<div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 flex-shrink-0">
					<div className="flex items-center gap-1.5">
						<Play className="w-3 h-3" />
						<span className="text-xs font-medium">
							{tArtifact("javascriptExecution")}
						</span>
						<Badge variant="outline" className="text-xs px-1.5 py-0.5">
							{tArtifact("sandboxEnvironment")}
						</Badge>
					</div>
					<Button
						onClick={executeCode}
						size="sm"
						variant="outline"
						className="h-6 px-2 text-xs"
					>
						<Play className="w-3 h-3 mr-1" />
						{tArtifact("run")}
					</Button>
				</div>
			)}

			{/* 内容区域 */}
			<div className="flex-1 flex flex-col p-4 overflow-hidden relative">
				{/* 浮动执行按钮（当没有工具栏时） */}
				{!showToolbar && (
					<div className="absolute top-3 right-3 z-10">
						<Button
							onClick={executeCode}
							size="sm"
							variant="default"
							className="h-8 px-3 text-xs shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
						>
							<Play className="w-3.5 h-3.5 mr-1.5" />
							{tArtifact("run")}
						</Button>
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex-shrink-0">
						<AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
						<span className="text-sm text-red-700 dark:text-red-400">
							{error}
						</span>
					</div>
				)}

				{output ? (
					<div className="flex-1 bg-gray-900 text-green-400 p-4 font-mono text-sm border overflow-auto">
						<div className="text-gray-400 mb-2 font-sans text-xs uppercase tracking-wide">
							{tArtifact("outputResult")}
						</div>
						<pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center space-y-2">
							<Play className="w-8 h-8 mx-auto opacity-30" />
							<p className="text-sm">{tArtifact("clickRunToExecute")}</p>
							{!showToolbar && (
								<Button
									onClick={executeCode}
									size="sm"
									variant="default"
									className="h-9 px-4 text-sm mt-4 shadow-md hover:shadow-lg transition-shadow"
								>
									<Play className="w-4 h-4 mr-2" />
									{tArtifact("run")}
								</Button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
