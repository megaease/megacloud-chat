"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, AlertCircle, RefreshCw } from "lucide-react";
import * as Babel from "@babel/standalone";
import { PreviewToolbar } from "../PreviewToolbar";

interface ReactPreviewProps {
	content: string;
	showToolbar?: boolean;
}

export const ReactPreview = ({
	content,
	showToolbar = true,
}: ReactPreviewProps) => {
	const tArtifact = useTranslations("Artifact");
	const [error, setError] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [previewHtml, setPreviewHtml] = useState<string>("");
	const [refreshKey, setRefreshKey] = useState(0);

	const compileAndRender = useCallback(() => {
		const compile = async () => {
			setLoading(true);
			setError("");

			try {
				// 预处理代码，移除 import 语句并准备组件代码
				let processedContent = content.trim();

				// 移除 import 语句
				processedContent = processedContent.replace(
					/import\s+.*?from\s+['"][^'"]*['"];?\n?/g,
					"",
				);
				processedContent = processedContent.replace(
					/import\s+['"][^'"]*['"];?\n?/g,
					"",
				);
				processedContent = processedContent.replace(
					/import\s+\{[^}]*\}\s+from\s+['"][^'"]*['"];?\n?/g,
					"",
				);

				// 查找组件名
				const exportMatch = processedContent.match(
					/export\s+default\s+(\w+);?/,
				);
				processedContent = processedContent.replace(
					/export\s+default\s+\w+;?\n?/g,
					"",
				);

				let componentName = exportMatch?.[1];
				if (!componentName) {
					const functionMatch = processedContent.match(
						/(?:const|function)\s+(\w+)/,
					);
					componentName = functionMatch?.[1];
				}

				if (!componentName) {
					throw new Error(tArtifact("componentNotFound"));
				}

				// 使用 Babel standalone 编译 JSX
				const compiled = Babel.transform(processedContent, {
					presets: ["react"],
					plugins: [],
				});

				if (!compiled.code) {
					throw new Error(tArtifact("compilationFailed"));
				}

				// 创建完整的 HTML 页面
				const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>React Component Preview</title>
	<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
	<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
	<style>
		* { box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			margin: 0;
			padding: 20px;
			background: #ffffff;
			line-height: 1.6;
		}
		#root {
			min-height: 100vh;
		}
		.error-boundary {
			padding: 20px;
			border: 1px solid #ff6b6b;
			background-color: #ffe0e0;
			border-radius: 8px;
			color: #c92a2a;
		}
		/* 添加一些基础样式 */
		button {
			background: #007bff;
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;
			margin: 4px;
		}
		button:hover {
			background: #0056b3;
		}
		input {
			padding: 8px;
			border: 1px solid #ccc;
			border-radius: 4px;
			margin: 4px;
		}
		input:focus {
			outline: none;
			border-color: #007bff;
		}
	</style>
</head>
<body>
	<div id="root"></div>
	<script>
		try {
			// 获取 React 和 ReactDOM
			const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext } = React;
			
			// 编译后的组件代码
			${compiled.code}
			
			// 错误边界组件
			class ErrorBoundary extends React.Component {
				constructor(props) {
					super(props);
					this.state = { hasError: false, error: null };
				}
				
				static getDerivedStateFromError(error) {
					return { hasError: true, error: error.message };
				}
				
				componentDidCatch(error, errorInfo) {
					console.error('Component Error:', error, errorInfo);
				}
				
				render() {
					if (this.state.hasError) {
						return React.createElement('div', {
							className: 'error-boundary'
						}, [
							React.createElement('h3', { key: 'title' }, '组件渲染错误'),
							React.createElement('p', { key: 'message' }, this.state.error)
						]);
					}
					
					return this.props.children;
				}
			}
			
			// 渲染组件
			const root = ReactDOM.createRoot(document.getElementById('root'));
			root.render(
				React.createElement(ErrorBoundary, null,
					React.createElement(${componentName}, null)
				)
			);
		} catch (error) {
			document.getElementById('root').innerHTML = 
				'<div class="error-boundary">' +
				'<h3>渲染错误</h3>' +
				'<p>' + error.message + '</p>' +
				'</div>';
		}
	</script>
</body>
</html>`;

				setPreviewHtml(htmlContent);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "未知错误";
				setError(errorMessage);
				console.error("React component compilation error:", err);
			} finally {
				setLoading(false);
			}
		};

		compile();
	}, [content, tArtifact]);

	const handleManualRefresh = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
		compileAndRender();
	}, [compileAndRender]);

	// 当内容改变时自动重新编译
	useEffect(() => {
		if (content.trim()) {
			compileAndRender();
		}
	}, [content, compileAndRender]);

	return (
		<div className="flex flex-col h-full">
			{/* 工具栏 - 可选显示 */}
			{showToolbar && (
				<PreviewToolbar
					content={content}
					filename="react_component.jsx"
					mimeType="text/jsx"
					onRefresh={handleManualRefresh}
					refreshing={loading}
				>
					<Code2 className="w-3.5 h-3.5 text-cyan-600" />
					<span className="text-sm font-medium text-cyan-700">
						{tArtifact("reactComponentPreview")}
					</span>
					<Badge variant="secondary" className="text-xs">
						{tArtifact("liveRendering")}
					</Badge>
				</PreviewToolbar>
			)}

			{/* 预览区域 */}
			<div className="flex-1 bg-muted/20 overflow-hidden">
				{error ? (
					<div className="flex items-center justify-center h-full p-4">
						<div className="max-w-md w-full space-y-4">
							<div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
								<AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
								<div>
									<p className="text-sm font-medium text-red-700 dark:text-red-400">
										{tArtifact("compilationError")}
									</p>
									<p className="text-xs text-red-600 dark:text-red-300 mt-1">
										{error}
									</p>
								</div>
							</div>
							<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
								<p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
									{tArtifact("exampleCodeFormat")}
								</p>
								<pre className="text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
									{`const MyComponent = () => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <h1>Hello World!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
};`}
								</pre>
							</div>
						</div>
					</div>
				) : loading ? (
					<div className="flex items-center justify-center h-full">
						<div className="text-center space-y-2">
							<RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-500" />
							<p className="text-sm text-muted-foreground">
								{tArtifact("compilingComponent")}
							</p>
						</div>
					</div>
				) : previewHtml ? (
					<iframe
						key={`react-preview-${refreshKey}`}
						srcDoc={previewHtml}
						className="w-full h-full border-0"
						sandbox="allow-scripts allow-same-origin"
						title="React Component Preview"
					/>
				) : (
					<div className="flex items-center justify-center h-full text-muted-foreground">
						<div className="text-center space-y-2">
							<Code2 className="w-8 h-8 mx-auto opacity-30" />
							<p className="text-sm">{tArtifact("waitingForCode")}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
