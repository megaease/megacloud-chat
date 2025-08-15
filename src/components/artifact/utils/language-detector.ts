import type { ArtifactLanguage } from "@/lib/artifact-types";

/**
 * 检测代码语言类型（仅在没有明确语言标识时使用）
 * @param content 代码内容
 * @returns 检测到的语言类型，如果无法确定则返回 undefined
 */
export const detectLanguage = (
	content: string,
): ArtifactLanguage | undefined => {
	const lowerContent = content.toLowerCase().trim();

	// 如果内容为空，返回 undefined
	if (!content.trim()) {
		return undefined;
	}

	// HTML 检测 - 明确的 HTML 标识（优先级最高）
	if (
		lowerContent.includes("<!doctype html") ||
		lowerContent.includes("<html") ||
		(lowerContent.includes("<head>") && lowerContent.includes("</head>")) ||
		(lowerContent.includes("<body>") && lowerContent.includes("</body>")) ||
		// 完整的 HTML 结构
		(lowerContent.includes("<html>") && lowerContent.includes("</html>"))
	) {
		return "html";
	}

	// React/JSX 检测 - 明确的 React 标识（中等优先级）
	if (
		lowerContent.includes("import react") ||
		lowerContent.includes("from 'react'") ||
		lowerContent.includes('from "react"') ||
		lowerContent.includes("usestate") ||
		lowerContent.includes("useeffect") ||
		lowerContent.includes("useref") ||
		lowerContent.includes("usecontext") ||
		lowerContent.includes("jsx") ||
		// React 组件模式
		(lowerContent.includes("export default function") &&
			lowerContent.includes("return") &&
			lowerContent.includes("<")) ||
		(lowerContent.includes("export const") &&
			lowerContent.includes("=>") &&
			lowerContent.includes("return") &&
			lowerContent.includes("<")) ||
		// React Hooks 模式
		(lowerContent.includes("const [") && lowerContent.includes("] = use")) ||
		// JSX 语法特征
		(lowerContent.includes("{") &&
			lowerContent.includes("}") &&
			lowerContent.includes("<"))
	) {
		return "react";
	}

	// Python 检测 - 明确的 Python 语法
	if (
		lowerContent.includes("def ") ||
		lowerContent.includes("print(") ||
		lowerContent.includes("if __name__") ||
		(lowerContent.includes("import ") && !lowerContent.includes("from ")) ||
		lowerContent.includes("elif ") ||
		(lowerContent.includes(":") && content.includes("    ")) // Python 缩进特征
	) {
		return "python";
	}

	// CSS 检测 - 明确的 CSS 语法
	if (
		lowerContent.match(/[.#]\w+\s*\{/) ||
		lowerContent.includes("@media") ||
		lowerContent.includes("@import") ||
		lowerContent.includes("@keyframes") ||
		(lowerContent.includes("color:") && lowerContent.includes("}")) ||
		(lowerContent.includes("display:") && lowerContent.includes("}")) ||
		(lowerContent.includes("background:") && lowerContent.includes("}"))
	) {
		return "css";
	}

	// JavaScript 检测 - 明确的 JavaScript 语法（排除 React 相关的）
	if (
		(lowerContent.includes("function ") &&
			!lowerContent.includes("export default")) ||
		(lowerContent.includes("const ") && !lowerContent.includes("= () =>")) ||
		(lowerContent.includes("let ") && !lowerContent.includes("= () =>")) ||
		(lowerContent.includes("var ") && !lowerContent.includes("= () =>")) ||
		(lowerContent.includes("console.log") && !lowerContent.includes("react")) ||
		(lowerContent.includes("=>") &&
			!lowerContent.includes("return") &&
			!lowerContent.includes("<")) ||
		(lowerContent.includes("document.") &&
			lowerContent.includes("(") &&
			!lowerContent.includes("react"))
	) {
		return "javascript";
	}

	// 如果无法明确检测，返回 undefined
	return undefined;
};

/**
 * 智能获取语言类型 - 优先使用明确的 language，回退到内容检测
 * @param explicitLanguage 明确指定的语言
 * @param content 代码内容
 * @returns 最终确定的语言类型，如果无法确定则返回 undefined
 */
export const getLanguage = (
	explicitLanguage: ArtifactLanguage | undefined,
	content: string,
): ArtifactLanguage | undefined => {
	// 优先使用明确指定的语言
	if (explicitLanguage) {
		return explicitLanguage;
	}

	// 回退到内容检测
	return detectLanguage(content);
};

/**
 * 将检测到的语言映射到支持的预览类型
 * @param language 语言类型
 * @returns 预览类型，如果 language 为 undefined 则返回 "code"
 */
export const getPreviewType = (
	language: ArtifactLanguage | undefined,
): string => {
	if (!language) {
		return "code";
	}

	switch (language) {
		case "html":
			return "html";
		case "react":
			return "react";
		case "javascript":
			return "javascript";
		case "python":
			return "python";
		default:
			return "code";
	}
};

/**
 * 获取语言的显示名称
 * @param language 语言类型
 * @returns 显示名称，如果 language 为 undefined 则返回 "Code"
 */
export const getLanguageDisplayName = (
	language: ArtifactLanguage | undefined,
): string => {
	if (!language) {
		return "Code";
	}

	const displayNames: Record<ArtifactLanguage, string> = {
		html: "HTML",
		react: "React",
		javascript: "JavaScript",
		python: "Python",
		css: "CSS",
	};
	return displayNames[language] || language.toUpperCase();
};

/**
 * 检查语言是否支持预览
 * @param language 语言类型
 * @returns 是否支持预览，如果 language 为 undefined 则返回 false
 */
export const isPreviewSupported = (
	language: ArtifactLanguage | undefined,
): boolean => {
	if (!language) {
		return false;
	}
	return ["html", "react", "javascript", "python"].includes(language);
};
