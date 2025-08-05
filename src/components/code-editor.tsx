"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { xml } from "@codemirror/lang-xml";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { githubLight } from "@uiw/codemirror-theme-github";
import { useTheme } from "next-themes";
import type { Extension } from "@codemirror/state";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

interface CodeEditorProps {
	value: string;
	language?: string | undefined;
	editable?: boolean;
	onChange?: (value: string) => void;
	className?: string;
	showHeader?: boolean;
	showCopyButton?: boolean;
	height?: string | number;
}

// 语言映射
const getLanguageExtension = (language: string | undefined): Extension[] => {
	if (!language) {
		return [];
	}

	switch (language.toLowerCase()) {
		case "javascript":
		case "js":
			return [javascript()];
		case "typescript":
		case "ts":
			return [javascript({ typescript: true })];
		case "python":
		case "py":
			return [python()];
		case "html":
			return [html()];
		case "css":
			return [css()];
		case "json":
			return [json()];
		case "xml":
			return [xml()];
		case "markdown":
		case "md":
			return [markdown()];
		case "jsx":
			return [javascript({ jsx: true })];
		case "tsx":
			return [javascript({ typescript: true, jsx: true })];
		default:
			return [];
	}
};

export function CodeEditor({
	value,
	language,
	editable = false,
	onChange,
	className,
	showHeader = true,
	showCopyButton = true,
	height = "auto",
}: CodeEditorProps) {
	const extensions = getLanguageExtension(language);
	const { resolvedTheme } = useTheme();

	// 根据主题选择合适的 CodeMirror 主题
	const getTheme = () => {
		if (resolvedTheme === "dark") {
			return oneDark;
		}
		return githubLight;
	};

	return (
		<div
			className={cn(
				"relative overflow-hidden flex flex-col bg-background",
				height !== "auto" && "h-full",
				className,
			)}
		>
			{showHeader && (
				<div className="flex items-center justify-between bg-muted/50 px-3 py-1 border-b border-border">
					<span className="text-xs font-medium">{language}</span>
					{showCopyButton && <CopyButton text={value} />}
				</div>
			)}
			<div className="flex-1 overflow-hidden">
				<CodeMirror
					value={value}
					height={height === "auto" ? "auto" : "100%"}
					theme={getTheme()}
					extensions={extensions}
					editable={editable}
					onChange={onChange}
					basicSetup={{
						lineNumbers: true,
						foldGutter: false,
						dropCursor: false,
						allowMultipleSelections: false,
						indentOnInput: true,
						bracketMatching: true,
						closeBrackets: true,
						autocompletion: true,
						highlightSelectionMatches: false,
						searchKeymap: true,
					}}
					style={{
						fontSize: "14px",
						height: "100%",
					}}
				/>
			</div>
		</div>
	);
}
