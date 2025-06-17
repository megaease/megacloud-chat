"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeEditor } from "@/components/code-editor";
import {
	Code2,
	Eye,
	Play,
	AlertCircle,
	Monitor,
	Smartphone,
	Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CodePreviewProps {
	content: string;
	language?: string;
	className?: string;
	mode?: "code" | "preview";
}

// 检测代码语言
const detectLanguage = (content: string): string => {
	const lowerContent = content.toLowerCase();

	// HTML 检测
	if (
		lowerContent.includes("<!doctype html") ||
		lowerContent.includes("<html") ||
		lowerContent.includes("<head>") ||
		lowerContent.includes("<body>")
	) {
		return "html";
	}

	// React/JSX 检测
	if (
		lowerContent.includes("import react") ||
		lowerContent.includes("from 'react'") ||
		lowerContent.includes("export default") ||
		lowerContent.includes("jsx") ||
		lowerContent.includes("function component") ||
		lowerContent.match(/const\s+\w+\s*=\s*\(/)
	) {
		return "react";
	}

	// JavaScript 检测
	if (
		lowerContent.includes("function ") ||
		lowerContent.includes("const ") ||
		lowerContent.includes("let ") ||
		lowerContent.includes("var ") ||
		lowerContent.includes("console.log") ||
		lowerContent.includes("=>")
	) {
		return "javascript";
	}

	// CSS 检测
	if (
		lowerContent.match(/[.#]\w+\s*\{/) ||
		lowerContent.includes("@media") ||
		lowerContent.includes("background:") ||
		lowerContent.includes("color:") ||
		lowerContent.includes("margin:") ||
		lowerContent.includes("padding:")
	) {
		return "css";
	}

	// Python 检测
	if (
		lowerContent.includes("def ") ||
		lowerContent.includes("import ") ||
		lowerContent.includes("from ") ||
		lowerContent.includes("print(")
	) {
		return "python";
	}

	return "text";
};

// HTML 预览组件
const HtmlPreview = ({ content }: { content: string }) => {
	const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">(
		"desktop",
	);

	const getViewportClass = () => {
		switch (viewMode) {
			case "mobile":
				return "w-80 max-w-full h-full";
			case "tablet":
				return "w-[768px] max-w-full h-full";
			default:
				return "w-full h-full";
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* 工具栏 - 紧凑版 */}
			<div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 flex-shrink-0">
				<div className="flex items-center gap-1.5">
					<Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
					<span className="text-sm font-medium text-blue-700 dark:text-blue-300">
						HTML 预览
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant={viewMode === "desktop" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("desktop")}
						className="h-6 w-6 p-0"
						title="桌面视图"
					>
						<Monitor className="w-3 h-3" />
					</Button>
					<Button
						variant={viewMode === "tablet" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("tablet")}
						className="h-6 w-6 p-0"
						title="平板视图"
					>
						<Tablet className="w-3 h-3" />
					</Button>
					<Button
						variant={viewMode === "mobile" ? "default" : "ghost"}
						size="sm"
						onClick={() => setViewMode("mobile")}
						className="h-6 w-6 p-0"
						title="手机视图"
					>
						<Smartphone className="w-3 h-3" />
					</Button>
				</div>
			</div>

			{/* 预览区域 - 直接占满剩余空间 */}
			<div className="flex-1 bg-muted/20">
				{viewMode === "desktop" ? (
					<iframe
						srcDoc={content}
						className="w-full h-full border-0"
						sandbox="allow-scripts allow-same-origin"
						title="HTML Preview"
					/>
				) : (
					<div className="flex items-center justify-center h-full p-4">
						<div
							className={cn(
								"bg-background border overflow-hidden",
								getViewportClass(),
							)}
						>
							<iframe
								srcDoc={content}
								className="w-full h-full border-0"
								sandbox="allow-scripts allow-same-origin"
								title="HTML Preview"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

// React 组件预览
const ReactPreview = ({ content }: { content: string }) => {
	const [previewContent, setPreviewContent] = useState<string>("");
	const [error, setError] = useState<string>("");

	useEffect(() => {
		try {
			// 创建一个更完整的 React 预览
			const wrappedContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>React Component Preview</title>
					<style>
						* { box-sizing: border-box; }
						body {
							font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
							margin: 0;
							padding: 20px;
							background: #f8fafc;
							line-height: 1.6;
						}
						.preview-container {
							background: white;
							padding: 24px;
							box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
						}
						.code-preview {
							background: #1e293b;
							color: #e2e8f0;
							padding: 16px;
							font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
							font-size: 14px;
							line-height: 1.5;
							overflow-x: auto;
							white-space: pre-wrap;
						}
						.preview-note {
							background: #f0f9ff;
							border: 1px solid #0ea5e9;
							padding: 16px;
							margin-bottom: 16px;
							color: #0c4a6e;
						}
						.preview-note h4 {
							margin: 0 0 8px 0;
							color: #075985;
							font-size: 16px;
						}
						.preview-note p {
							margin: 0;
							font-size: 14px;
						}
					</style>
				</head>
				<body>
					<div class="preview-container">
						<div class="preview-note">
							<h4>🚀 React 组件预览</h4>
							<p>这是一个 React 组件。在实际应用中，它会被编译并渲染为交互式的用户界面。</p>
						</div>
						<div class="code-preview">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
					</div>
				</body>
				</html>
			`;
			setPreviewContent(wrappedContent);
			setError("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "预览生成失败");
		}
	}, [content]);

	if (error) {
		return (
			<div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
				<AlertCircle className="w-4 h-4 text-red-500" />
				<span className="text-sm text-red-700 dark:text-red-400">{error}</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* 工具栏 - 紧凑版 */}
			<div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 flex-shrink-0">
				<Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
				<span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
					React 组件预览
				</span>
				<Badge variant="secondary" className="text-xs">
					实验性
				</Badge>
			</div>

			{/* 预览区域 - 直接占满剩余空间 */}
			<div className="flex-1 bg-muted/20">
				<iframe
					srcDoc={previewContent}
					className="w-full h-full border-0"
					sandbox="allow-scripts"
					title="React Preview"
				/>
			</div>
		</div>
	);
};

// JavaScript 执行预览
const JavaScriptPreview = ({ content }: { content: string }) => {
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
			const func = new Function(content);
			const result = func();

			// 恢复原始 console.log
			console.log = originalLog;

			if (result !== undefined) {
				logs.push(
					`返回值：${typeof result === "object" ? JSON.stringify(result, null, 2) : String(result)}`,
				);
			}

			setOutput(logs.join("\n") || "(没有输出)");
		} catch (err) {
			setError(err instanceof Error ? err.message : "执行错误");
		}
	};

	return (
		<div className="flex flex-col h-full">
			{/* 工具栏 - 紧凑版 */}
			<div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 flex-shrink-0">
				<div className="flex items-center gap-2">
					<Play className="w-3.5 h-3.5" />
					<span className="text-sm font-medium">JavaScript 执行</span>
					<Badge variant="outline" className="text-xs">
						沙盒环境
					</Badge>
				</div>
				<Button
					onClick={executeCode}
					size="sm"
					variant="outline"
					className="h-7 px-2"
				>
					<Play className="w-3 h-3 mr-1" />
					运行
				</Button>
			</div>

			{/* 内容区域 */}
			<div className="flex-1 flex flex-col p-4 overflow-hidden">
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
							输出结果
						</div>
						<pre className="whitespace-pre-wrap leading-relaxed">{output}</pre>
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center space-y-2">
							<Play className="w-8 h-8 mx-auto opacity-30" />
							<p className="text-sm">点击"运行"按钮执行 JavaScript 代码</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

// CSS 预览组件
const CssPreview = ({ content }: { content: string }) => {
	const previewHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CSS 样式预览</title>
      <style>
        * {
          box-sizing: border-box;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          margin: 0;
          padding: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          line-height: 1.6;
        }
        .demo-container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 800px;
          margin: 0 auto;
        }
        .demo-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .demo-header h1 {
          color: #1a202c;
          font-size: 2.5em;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .demo-header p {
          color: #718096;
          font-size: 1.1em;
          margin: 0;
        }
        .demo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-top: 32px;
        }
        .demo-card {
          background: #f7fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .demo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .demo-element {
          background: linear-gradient(45deg, #4299e1, #667eea);
          color: white;
          padding: 16px 24px;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 16px 0;
        }
        .demo-button {
          background: #4299e1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .demo-button:hover {
          background: #3182ce;
          transform: translateY(-1px);
        }
        .demo-text {
          color: #2d3748;
          font-size: 16px;
          margin: 16px 0;
        }
        /* 用户自定义样式 */
        ${content}
      </style>
    </head>
    <body>
      <div class="demo-container">
        <div class="demo-header">
          <h1>🎨 CSS 样式预览</h1>
          <p>查看您的 CSS 样式在实际页面中的效果</p>
        </div>
        
        <div class="demo-grid">
          <div class="demo-card">
            <h3>演示元素</h3>
            <div class="demo-element">这是一个演示元素</div>
            <p class="demo-text">您的 CSS 样式会应用到页面上的各种元素中。</p>
          </div>
          
          <div class="demo-card">
            <h3>交互按钮</h3>
            <button class="demo-button">点击试试</button>
            <p class="demo-text">按钮样式也会受到您的 CSS 影响。</p>
          </div>
          
          <div class="demo-card">
            <h3>自定义内容</h3>
            <div class="custom-element">自定义样式元素</div>
            <p class="demo-text">尝试在 CSS 中添加 .custom-element 的样式。</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

	return (
		<div className="flex flex-col h-full">
			{/* 工具栏 - 紧凑版 */}
			<div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30 flex-shrink-0">
				<Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
				<span className="text-sm font-medium text-purple-700 dark:text-purple-300">
					CSS 样式预览
				</span>
			</div>

			{/* 预览区域 - 直接占满剩余空间 */}
			<div className="flex-1 bg-muted/20">
				<iframe
					srcDoc={previewHtml}
					className="w-full h-full border-0"
					sandbox="allow-scripts"
					title="CSS Preview"
				/>
			</div>
		</div>
	);
};

export function CodePreview({
	content,
	language,
	className,
	mode = "code",
}: CodePreviewProps) {
	const detectedLanguage = language || detectLanguage(content);

	const renderPreview = () => {
		switch (detectedLanguage.toLowerCase()) {
			case "html":
				return <HtmlPreview content={content} />;
			case "react":
			case "jsx":
			case "tsx":
				return <ReactPreview content={content} />;
			case "javascript":
			case "js":
				return <JavaScriptPreview content={content} />;
			case "css":
				return <CssPreview content={content} />;
			default:
				return (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<div className="text-center space-y-3">
							<Code2 className="w-12 h-12 mx-auto opacity-30" />
							<div>
								<p className="text-sm font-medium">暂不支持预览</p>
								<p className="text-xs text-muted-foreground/60">
									{detectedLanguage.toUpperCase()} 语言暂时不支持可视化预览
								</p>
							</div>
						</div>
					</div>
				);
		}
	};

	return (
		<div className={cn("h-full", className)}>
			{mode === "code" ? (
				<div className="h-full">
					<CodeEditor
						value={content}
						language={detectedLanguage}
						showHeader={false}
						showCopyButton={false}
						height="100%"
						className="h-full"
					/>
				</div>
			) : (
				<div className="h-full overflow-hidden">{renderPreview()}</div>
			)}
		</div>
	);
}
