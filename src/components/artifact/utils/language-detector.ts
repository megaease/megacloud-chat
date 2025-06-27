import type { ArtifactLanguage } from "@/lib/artifact-types";

/**
 * 检测代码语言类型
 * @param content 代码内容
 * @returns 检测到的语言类型
 */
export const detectLanguage = (content: string): ArtifactLanguage => {
	const lowerContent = content.toLowerCase();

	// HTML 检测
	if (
		lowerContent.includes("<!doctype html") ||
		lowerContent.includes("<html") ||
		lowerContent.includes("<head>") ||
		lowerContent.includes("<body>") ||
		(lowerContent.includes("<div") && lowerContent.includes("</div>")) ||
		(lowerContent.includes("<p>") && lowerContent.includes("</p>"))
	) {
		return "html";
	}

	// React/JSX 检测
	if (
		lowerContent.includes("import react") ||
		lowerContent.includes("from 'react'") ||
		lowerContent.includes('from "react"') ||
		lowerContent.includes("export default") ||
		lowerContent.includes("jsx") ||
		lowerContent.includes("function component") ||
		lowerContent.match(/const\s+\w+\s*=\s*\(/) ||
		lowerContent.includes("usestate") ||
		lowerContent.includes("useeffect")
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
		lowerContent.includes("=>") ||
		lowerContent.includes("require(") ||
		lowerContent.includes("module.exports")
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
		lowerContent.includes("padding:") ||
		lowerContent.includes("display:") ||
		lowerContent.includes("position:")
	) {
		return "css";
	}

	// Python 检测
	if (
		lowerContent.includes("def ") ||
		lowerContent.includes("import ") ||
		lowerContent.includes("from ") ||
		lowerContent.includes("print(") ||
		lowerContent.includes("class ") ||
		lowerContent.includes("if __name__") ||
		lowerContent.includes("pip install")
	) {
		return "python";
	}

	// 默认返回 javascript（作为代码的通用类型）
	return "javascript";
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
	return ["html", "react", "javascript"].includes(language);
};
