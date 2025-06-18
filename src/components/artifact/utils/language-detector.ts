/**
 * 检测代码语言类型
 * @param content 代码内容
 * @returns 检测到的语言类型
 */
export const detectLanguage = (content: string): string => {
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
