import type { ArtifactLanguage } from "@/lib/artifact-types";

/**
 * 检测代码语言类型（仅在没有明确语言标识时使用）
 * @param content 代码内容
 * @returns 检测到的语言类型
 */
export const detectLanguage = (content: string): ArtifactLanguage => {
	const lowerContent = content.toLowerCase();

	// HTML 检测 - 明确的 HTML 标识
	if (
		lowerContent.includes("<!doctype html") ||
		lowerContent.includes("<html") ||
		lowerContent.includes("<head>") ||
		lowerContent.includes("<body>")
	) {
		return "html";
	}

	// React/JSX 检测 - 明确的 React 标识
	if (
		lowerContent.includes("import react") ||
		lowerContent.includes("from 'react'") ||
		lowerContent.includes('from "react"') ||
		lowerContent.includes("usestate") ||
		lowerContent.includes("useeffect") ||
		lowerContent.includes("jsx")
	) {
		return "react";
	}

	// Python 检测 - 明确的 Python 语法
	if (
		lowerContent.includes("def ") ||
		lowerContent.includes("print(") ||
		lowerContent.includes("if __name__") ||
		lowerContent.includes("import ")
	) {
		return "python";
	}

	// CSS 检测 - 明确的 CSS 语法
	if (
		lowerContent.match(/[.#]\w+\s*\{/) ||
		lowerContent.includes("@media") ||
		(lowerContent.includes("color:") && lowerContent.includes("}"))
	) {
		return "css";
	}

	// 默认返回 javascript（通用代码类型）
	return "javascript";
};

/**
 * 智能获取语言类型 - 优先使用明确的 language，回退到内容检测
 * @param explicitLanguage 明确指定的语言
 * @param content 代码内容
 * @returns 最终确定的语言类型
 */
export const getLanguage = (
	explicitLanguage: ArtifactLanguage | undefined,
	content: string,
): ArtifactLanguage => {
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
 * @returns 预览类型
 */
export const getPreviewType = (language: ArtifactLanguage): string => {
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
 * @returns 显示名称
 */
export const getLanguageDisplayName = (language: ArtifactLanguage): string => {
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
 * @returns 是否支持预览
 */
export const isPreviewSupported = (language: ArtifactLanguage): boolean => {
	return ["html", "react", "javascript", "python"].includes(language);
};
