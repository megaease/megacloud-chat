import { smoothStream, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { generateId } from "ai";
import { createArtifact } from "@/server/db/queries/artifacts";
import { detectAndCreateAIModel } from "@/lib/ai-providers";
import { streamText, type LanguageModel } from "ai";
import type { StreamDelta } from "@/types/stream-delta";

export const createArtifactInputSchema = z.object({
	kind: z
		.enum(["text", "code", "sheet", "image"])
		.describe(
			"The artifact type. Use 'sheet' for any tabular/CSV/row-column data.",
		),
	language: z
		.enum(["html", "react", "javascript", "python", "css", "markdown"])
		.default("markdown")
		.describe(
			"Language or format hint (e.g., html, react, javascript, python, css, markdown)",
		),
	title: z.string().min(1).describe("Title for the artifact"),
});

interface CreateArtifactProps {
	session: { user: { id: string } };
	dataStream: UIMessageStreamWriter;
	modelConfig?: {
		apiKey?: string;
		modelName?: string;
		baseUrl?: string;
		providerType?: string;
	};
}

// 内容生成器函数
async function generateArtifactContent({
	kind,
	title,
	dataStream,
	modelConfig,
}: {
	kind: string;
	title: string;
	dataStream: UIMessageStreamWriter;
	modelConfig?: {
		apiKey?: string;
		modelName?: string;
		baseUrl?: string;
		providerType?: string;
	};
}) {
	const { model: artifactModel } = detectAndCreateAIModel({
		apiKey: modelConfig?.apiKey || process.env.OPENAI_API_KEY,
		modelName: modelConfig?.modelName || "gpt-4-turbo",
		baseUrl: modelConfig?.baseUrl,
		providerType: modelConfig?.providerType,
	}) as { model: LanguageModel };

	// 根据不同类型生成专门的内容
	const systemPrompt = {
		text: `You are a professional content creator and expert writer. Generate high-quality, well-structured text content that is engaging, informative, and valuable to readers.

**CONTENT CREATION GUIDELINES:**
- **Structure**: Include clear introduction, well-organized body paragraphs, and concise conclusion
- **Quality**: Provide accurate, well-researched information with depth and insight
- **Engagement**: Write in a clear, engaging style that captures and maintains reader interest
- **Format**: Use proper formatting with paragraphs, headings, and transitions
- **Length**: Generate substantial content (500+ words) that provides real value
- **Tone**: Match the tone to the subject matter (professional, casual, technical, etc.)

**OUTPUT FORMAT:**
- Start with a compelling introduction that outlines what will be covered
- Include 3-5 well-developed body paragraphs with clear main points
- End with a concise conclusion that summarizes key takeaways
- Use proper grammar, spelling, and punctuation throughout
- Make content flow naturally with smooth transitions between ideas`,

		code: `You are a senior software engineer and expert programmer. Generate production-ready, clean, and well-structured code with best practices.

**CODE GENERATION STANDARDS:**
- **Completeness**: Provide full, working solutions that can be used immediately
- **Quality**: Write clean, maintainable code following industry best practices
- **Documentation**: Include clear comments explaining complex logic and important decisions
- **Structure**: Use proper organization with logical separation of concerns
- **Error Handling**: Include appropriate error handling and edge cases
- **Performance**: Write efficient code that considers performance implications
- **Security**: Follow security best practices and avoid common vulnerabilities

**IMPORTANT: TYPE DETECTION & CONTEXT AWARENESS:**
- **HTML Pages**: If the request is for a "page", "webpage", "website", or similar terms, generate a COMPLETE HTML document with DOCTYPE, html, head, and body tags
- **React Components**: Only generate React components when explicitly requested or when the context clearly indicates React development
- **Standalone Files**: Generate standalone files that can be directly executed or used without additional setup
- **Language Selection**: Choose the most appropriate language based on the request context

**TECHNICAL REQUIREMENTS:**
- Use modern language features and syntax appropriately
- Include necessary imports/dependencies
- Follow naming conventions and code style standards
- Provide examples of usage if applicable
- Ensure code is tested and functional
- Include configuration/setup instructions if needed

**OUTPUT FORMAT:**
- Start with a brief comment explaining the purpose and functionality
- Include all necessary imports and dependencies
- Organize code into logical sections/functions/classes
- Add inline comments for complex logic
- Provide usage examples when helpful
- End with any setup or configuration notes`,

		sheet: `You are a professional data analyst and spreadsheet expert. Generate high-quality, realistic tabular data with proper structure and formatting.

**DATA GENERATION STANDARDS:**
- **Structure**: Create well-organized tables with clear, descriptive headers
- **Quality**: Generate realistic, believable data that makes sense for the context
- **Completeness**: Include all relevant fields and sufficient data rows (10+ rows)
- **Format**: Use consistent data formatting and proper data types
- **Accuracy**: Ensure data relationships and values are logical and consistent
- **Variety**: Include appropriate diversity in the data while maintaining realism

**SPREADSHEET REQUIREMENTS:**
- Use clear, descriptive column headers that explain the data
- Include at least 10 rows of realistic sample data
- Ensure proper data formatting (numbers, dates, text, etc.)
- Maintain data integrity and logical relationships between fields
- Include realistic variations in the data (not all identical values)
- Format as proper CSV with comma-separated values and optional quotes

**OUTPUT FORMAT:**
- Start with a header row containing clear column names
- Include 10-15 rows of realistic sample data
- Use consistent formatting throughout
- Ensure proper CSV formatting with commas separating values
- Include quotes around text values containing commas or special characters
- Make data realistic and useful for the given context`,

		image: `You are a creative visual designer and AI art expert. Generate detailed, descriptive prompts for creating high-quality images and visualizations.

**VISUAL DESCRIPTION STANDARDS:**
- **Detail**: Provide comprehensive descriptions covering all visual elements
- **Clarity**: Use precise, vivid language that clearly communicates the visual concept
- **Structure**: Organize descriptions logically (subject, setting, style, mood, etc.)
- **Creativity**: Include artistic direction and stylistic preferences
- **Technical**: Specify technical aspects like composition, lighting, and perspective
- **Usability**: Ensure descriptions are actionable for AI image generation

**DESCRIPTION ELEMENTS:**
- **Subject**: Main focus and key elements of the image
- **Composition**: Layout, framing, and arrangement of elements
- **Style**: Artistic style, medium, and visual treatment
- **Color**: Color palette, mood, and lighting effects
- **Setting**: Background, environment, and context
- **Technical**: Resolution, aspect ratio, and technical specifications

**OUTPUT FORMAT:**
- Start with a clear overview of the image concept
- Describe the main subject and focal points in detail
- Specify the artistic style and visual treatment
- Include color palette and lighting preferences
- Describe the setting and background elements
- Add any technical specifications or requirements
- Ensure the description is comprehensive and actionable`,
	}[kind];

	const userPrompt = {
		text: `Write a comprehensive, high-quality article about: "${title}"

**Requirements:**
- Create a well-structured article with introduction, body, and conclusion
- Provide valuable, informative content that engages readers
- Use clear, professional language appropriate for the topic
- Include specific examples, insights, or practical applications
- Make the content substantial (500+ words) and genuinely useful
- Ensure the article flows naturally with smooth transitions
- End with key takeaways or a compelling conclusion

**Topic Focus:** ${title}

Please write a complete, polished article that readers will find valuable and engaging.`,

		code: `Generate complete, production-ready code for: "${title}"

**CRITICAL REQUIREMENTS:**
- **OUTPUT PURE CODE ONLY**: Generate ONLY the actual code without any markdown formatting, code blocks, or explanations
- **NO MARKDOWN**: Do NOT wrap the code in triple backticks (\`\`\`) or any markdown formatting
- **NO EXPLANATIONS**: Do NOT include any explanations, comments about the code, or additional text
- **DIRECTLY EXECUTABLE**: The code must be directly copy-paste executable without any modifications

**CONTEXT AWARENESS - IMPORTANT:**
- **For "page" requests**: If the title contains words like "page", "webpage", "website", "homepage", "landing page", etc., generate a COMPLETE HTML document with:
  - DOCTYPE declaration
  - Full HTML structure with <html>, <head>, and <body> tags
  - Proper meta tags and title in the head
  - Complete content in the body
  - Inline CSS or internal stylesheet for styling
  - Make it a standalone HTML file that can be opened directly in browser

- **For React components**: If the title contains words like "component", "react component", "react", or when explicitly requesting React functionality, generate a React component with:
  - Proper React imports (import React, useState, useEffect, etc.)
  - Component function or class definition
  - JSX syntax with proper return statement
  - Export default statement
  - Make it a standalone React component file

- **For JavaScript**: Generate plain JavaScript code when no specific framework is mentioned
- **For Python**: Generate Python scripts when Python-specific functionality is requested
- **For CSS**: Generate CSS stylesheets when styling-related requests are made

**TECHNICAL STANDARDS:**
- Provide a full, working solution that can be used immediately
- Follow best practices and modern coding standards
- Include appropriate imports and dependencies at the top
- Structure code logically with good organization
- Add proper error handling and edge cases
- Ensure the code is efficient and maintainable
- Include inline comments for complex logic (but no separate explanations)

**OUTPUT FORMAT:**
- Start with imports/dependencies (if applicable)
- Follow with the main code implementation
- End with any necessary configuration or setup
- NO markdown formatting, NO code blocks, NO explanations
- Pure, executable code only

**Project:** ${title}

Generate ONLY the pure code implementation without any formatting or explanations.`,

		sheet: `Create a comprehensive spreadsheet with realistic data about: "${title}"

**Requirements:**
- Generate a well-structured table with clear, descriptive headers
- Include 10-15 rows of realistic, believable sample data
- Use proper CSV formatting with comma-separated values
- Ensure data types are consistent and appropriate for each column
- Include realistic variations and diversity in the data
- Make the data useful and representative of the topic
- Ensure proper formatting and data integrity

**Spreadsheet Topic:** ${title}

Please create a complete CSV-formatted spreadsheet with headers and realistic sample data.`,

		image: `Generate a detailed, comprehensive description for creating an image of: "${title}"

**Requirements:**
- Provide a vivid, detailed description covering all visual elements
- Specify the artistic style, composition, and mood
- Include color palette, lighting, and technical specifications
- Describe the main subject, background, and setting
- Make the description actionable for AI image generation
- Include specific details about style, medium, and visual treatment
- Ensure the description is comprehensive and clear

**Image Concept:** ${title}

Please generate a complete, detailed visual description that can be used to create a high-quality image.`,
	}[kind];

	// 流式生成内容
	const result = streamText({
		model: artifactModel,
		system: systemPrompt,
		prompt: userPrompt,
		providerOptions: {
			zhipu: {
				thinking: "disabled",
			},
		},
	});
	let generatedContent = "";

	// 处理流式响应
	for await (const delta of result.fullStream) {
		if (delta.type === "text-delta") {
			const textDelta = delta.text;
			generatedContent += textDelta;

			// 根据类型发送相应的数据流
			switch (kind) {
				case "text":
					dataStream.write({
						type: "data-textDelta",
						data: textDelta,
						transient: true,
					});
					break;
				case "code":
					dataStream.write({
						type: "data-codeDelta",
						data: textDelta,
						transient: true,
					});
					break;
				case "sheet":
					dataStream.write({
						type: "data-sheetDelta",
						data: textDelta,
						transient: true,
					});
					break;
				case "image":
					// 图片类型一次性发送完整描述
					break;
			}
		}
	}

	// 对于图片类型，一次性发送完整内容
	if (kind === "image") {
		dataStream.write({
			type: "data-imageDelta",
			data: generatedContent,
			transient: true,
		});
	}

	return generatedContent;
}

export const createArtifactTool = ({
	session,
	dataStream,
	modelConfig,
}: CreateArtifactProps) =>
	tool({
		description:
			"Create a new artifact with substantial content ONLY when the user explicitly requests to create content (code/html/text/sheet/image). Do NOT use for general Q&A, explanations, or tasks like checking time/weather/searching — use appropriate tools instead.",
		inputSchema: createArtifactInputSchema,
		execute: async ({ kind, language, title }, { experimental_context }) => {
			if (!session?.user?.id) {
				throw new Error("Missing user session for artifact creation");
			}

			// Get chatId from context
			const ctx = (experimental_context || {}) as { chatId?: string };
			if (!ctx.chatId) {
				throw new Error("Missing chatId in experimental_context");
			}

			const id = generateId();

			// 智能检测 language - 根据标题自动设置合适的语言
			let detectedLanguage = language;
			if (kind === "code" && language === "markdown") {
				const lowerTitle = title.toLowerCase();

				// 检测页面请求
				if (
					lowerTitle.includes("page") ||
					lowerTitle.includes("webpage") ||
					lowerTitle.includes("website") ||
					lowerTitle.includes("homepage") ||
					lowerTitle.includes("landing page")
				) {
					detectedLanguage = "html";
				}
				// 检测 React 组件请求
				else if (
					lowerTitle.includes("component") ||
					lowerTitle.includes("react component") ||
					lowerTitle.includes("react") ||
					lowerTitle.includes("jsx") ||
					lowerTitle.includes("tsx")
				) {
					detectedLanguage = "react";
				}
				// 检测 JavaScript 请求
				else if (
					lowerTitle.includes("javascript") ||
					lowerTitle.includes("js") ||
					lowerTitle.includes("script") ||
					lowerTitle.includes("function")
				) {
					detectedLanguage = "javascript";
				}
				// 检测 Python 请求
				else if (
					lowerTitle.includes("python") ||
					lowerTitle.includes("py") ||
					lowerTitle.includes("python script")
				) {
					detectedLanguage = "python";
				}
				// 检测 CSS 请求
				else if (
					lowerTitle.includes("css") ||
					lowerTitle.includes("stylesheet") ||
					lowerTitle.includes("style") ||
					lowerTitle.includes("styling")
				) {
					detectedLanguage = "css";
				}
			}

			// 步骤 1: 发送文档基础信息
			dataStream.write({
				type: "data-id",
				data: id,
				transient: true,
			});

			dataStream.write({
				type: "data-title",
				data: title,
				transient: true,
			});

			dataStream.write({
				type: "data-kind",
				data: kind,
				transient: true,
			});

			dataStream.write({
				type: "data-language",
				data: detectedLanguage,
				transient: true,
			});

			dataStream.write({
				type: "data-clear",
				data: null,
				transient: true,
			});

			// 步骤 2: 生成内容并流式传输
			const generatedContent = await generateArtifactContent({
				kind,
				title,
				dataStream,
				modelConfig,
			});

			// 步骤 3: 保存到数据库
			const created = await createArtifact({
				id,
				title,
				content: generatedContent,
				kind,
				language: detectedLanguage,
				userId: session.user.id,
				chatId: ctx.chatId,
				tags: [],
				isPublic: false,
			});

			// 步骤 4: 发送完成信号
			dataStream.write({
				type: "data-finish",
				data: null,
				transient: true,
			});

			return {
				success: true,
				action: "create-artifact",
				id: created.id,
				version: created.version,
				kind,
				language,
				title: created.title,
				content: "An artifact was created and is now visible to the user.",
			} as const;
		},
	});

export type CreateArtifactParams = z.infer<typeof createArtifactInputSchema>;
