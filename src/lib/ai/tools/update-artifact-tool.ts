import { smoothStream, tool, type UIMessageStreamWriter } from "ai";
import { z } from "zod";
import { updateArtifact, getArtifactById } from "@/server/db/queries/artifacts";
import { detectAndCreateAIModel } from "@/lib/ai-providers";
import { streamText, type LanguageModel } from "ai";
import type { StreamDelta } from "@/types/stream-delta";

export const updateArtifactInputSchema = z.object({
	id: z.string().min(1).describe("The ID of the artifact to update"),
	description: z
		.string()
		.min(1)
		.describe("Description of changes that need to be made"),
});

interface UpdateArtifactProps {
	session: { user: { id: string } };
	dataStream: UIMessageStreamWriter;
	modelConfig?: {
		apiKey?: string;
		modelName?: string;
		baseUrl?: string;
		providerType?: string;
	};
}

// 内容更新生成器函数
async function generateUpdatedContent({
	kind,
	currentContent,
	description,
	dataStream,
	modelConfig,
}: {
	kind: string;
	currentContent: string;
	description: string;
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

	// 根据不同类型生成专门的更新内容
	const systemPrompt = {
		text: `You are a professional content editor and expert writer. Update and enhance existing text content while preserving its core value and structure.

**CONTENT UPDATE PRINCIPLES:**
- **Preservation**: Maintain the core message, structure, and valuable content from the original
- **Enhancement**: Improve clarity, flow, and depth based on the update requirements
- **Consistency**: Ensure the updated content maintains a consistent tone and style
- **Quality**: Enhance the content while maintaining accuracy and relevance
- **Integration**: Seamlessly integrate new information with existing content

**UPDATE STRATEGIES:**
- Analyze the original content to understand its structure and key points
- Identify areas that need improvement or expansion based on requirements
- Enhance readability, clarity, and engagement where appropriate
- Add new information or insights while preserving existing value
- Ensure smooth transitions between original and updated sections
- Maintain the overall flow and logical progression of ideas

**QUALITY STANDARDS:**
- Preserve all valuable information from the original content
- Enhance clarity and readability without losing important details
- Ensure the updated content is comprehensive and well-structured
- Maintain consistency in tone, style, and formatting
- Verify that all updates align with the intended purpose and audience`,

		code: `You are a senior software engineer and code optimization expert. Update and enhance existing code while maintaining functionality and improving quality.

**CRITICAL UPDATE REQUIREMENTS:**
- **OUTPUT PURE CODE ONLY**: Generate ONLY the actual updated code without any markdown formatting, code blocks, or explanations
- **NO MARKDOWN**: Do NOT wrap the code in triple backticks (\`\`\`) or any markdown formatting
- **NO EXPLANATIONS**: Do NOT include any explanations, comments about the changes, or additional text
- **DIRECTLY EXECUTABLE**: The updated code must be directly copy-paste executable without any modifications
- **PRESERVE FUNCTIONALITY**: All existing features and functionality must be maintained

**CONTEXT AWARENESS - IMPORTANT:**
- **HTML Pages**: If updating an HTML page or if the update request mentions "page", "webpage", "website", etc., maintain the COMPLETE HTML document structure with DOCTYPE, html, head, and body tags
- **React Components**: If updating a React component, maintain the React structure and only update the specific parts requested
- **Type Consistency**: Maintain the same file type and structure as the original code
- **Language Detection**: Preserve the original programming language and framework

**CODE UPDATE PRINCIPLES:**
- **Functionality**: Preserve all existing functionality and features
- **Improvement**: Enhance code quality, performance, and maintainability
- **Compatibility**: Ensure updates don't break existing functionality or dependencies
- **Best Practices**: Apply modern coding standards and best practices
- **Testing**: Consider how changes affect testing and reliability

**UPDATE APPROACH:**
- Analyze the existing code structure and functionality
- Identify areas for improvement based on the update requirements
- Refactor code to improve readability and maintainability
- Add new features or enhancements while preserving existing logic
- Optimize performance and resource usage where appropriate
- Ensure proper error handling and edge case coverage
- Update inline comments to reflect changes (but no separate explanations)

**TECHNICAL STANDARDS:**
- Maintain backward compatibility where possible
- Follow established coding conventions and style guides
- Include inline comments explaining complex logic changes
- Ensure proper error handling and validation
- Consider performance implications of changes
- Update dependencies and imports as needed

**OUTPUT FORMAT:**
- Start with imports/dependencies (if changes needed)
- Follow with the complete updated code implementation
- Include inline comments for complex logic (but no separate explanations)
- End with any necessary configuration or setup
- NO markdown formatting, NO code blocks, NO explanations
- Pure, executable updated code only`,

		sheet: `You are a professional data analyst and spreadsheet management expert. Update and enhance existing tabular data while maintaining data integrity and relationships.

**DATA UPDATE PRINCIPLES:**
- **Integrity**: Maintain data accuracy, consistency, and logical relationships
- **Enhancement**: Improve data quality, completeness, and usefulness
- **Structure**: Preserve the existing structure while making necessary modifications
- **Validation**: Ensure all updates maintain data validity and proper formatting
- **Relevance**: Keep data relevant and aligned with the intended purpose

**UPDATE STRATEGIES:**
- Analyze the existing data structure and relationships
- Identify which rows, columns, or values need modification
- Add new data entries while maintaining consistency with existing data
- Update existing values to improve accuracy or relevance
- Ensure proper data formatting and type consistency
- Maintain logical relationships between different data fields
- Validate that all changes make sense in the context of the dataset

**QUALITY STANDARDS:**
- Preserve all important existing data and relationships
- Ensure data accuracy and consistency across all fields
- Maintain proper formatting and data types
- Include realistic and believable data values
- Ensure the updated dataset is complete and useful
- Validate that all changes align with the spreadsheet's purpose
- Maintain proper CSV formatting and structure`,

		image: `You are a professional visual designer and image enhancement expert. Update and refine existing visual descriptions while improving clarity and impact.

**VISUAL UPDATE PRINCIPLES:**
- **Enhancement**: Improve the visual description while preserving the core concept
- **Clarity**: Make the description more vivid, detailed, and actionable
- **Consistency**: Maintain the original artistic vision and style preferences
- **Precision**: Add specific details that improve the quality of the final image
- **Creativity**: Enhance the creative aspects while respecting the original concept

**UPDATE APPROACH:**
- Analyze the existing visual description to understand its strengths and weaknesses
- Identify areas that need more detail, clarity, or enhancement
- Enhance the description with more specific visual elements and details
- Improve the structure and flow of the description for better readability
- Add technical specifications or artistic direction as needed
- Ensure the updated description remains actionable for image generation
- Maintain the original mood, style, and artistic intent

**QUALITY STANDARDS:**
- Preserve the core concept and artistic vision of the original
- Enhance descriptive detail while maintaining clarity and focus
- Ensure the description is comprehensive and actionable
- Maintain consistency in style, mood, and technical specifications
- Include specific details that improve image generation quality
- Ensure all enhancements align with the intended visual outcome
- Make the description more vivid and engaging while remaining practical`,
	}[kind];

	const userPrompt = `**CURRENT CONTENT:**
${currentContent}

**UPDATE REQUIREMENTS:**
${description}

**UPDATE INSTRUCTIONS:**
Please provide a comprehensive updated version that incorporates all the requested changes while:

1. **Preserving Core Value**: Maintain all important information, functionality, and structure from the original content
2. **Implementing Enhancements**: Apply all the specified improvements and modifications
3. **Ensuring Quality**: Deliver updated content that meets professional standards for the content type
4. **Maintaining Consistency**: Keep consistent tone, style, and formatting throughout
5. **Seamless Integration**: Ensure new elements integrate smoothly with existing content

**CONTENT TYPE:** ${kind}

Please generate a complete, polished updated version that successfully incorporates all the requested changes while preserving the essential value and structure of the original content.`;

	// 流式生成更新内容
	const result = streamText({
		model: artifactModel,
		system: systemPrompt,
		messages: [{ role: "user", content: userPrompt as string }],
		providerOptions: {
			zhipu: {
				thinking: "disabled",
			},
		},
	});

	let updatedContent = "";

	// 处理流式响应
	for await (const delta of result.fullStream) {
		if (delta.type === "text-delta") {
			const textDelta = delta.text;
			updatedContent += textDelta;

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
			data: updatedContent,
			transient: true,
		});
	}

	return updatedContent;
}

export const updateArtifactTool = ({
	session,
	dataStream,
	modelConfig,
}: UpdateArtifactProps) =>
	tool({
		description:
			"Update an existing artifact's content when the user asks to modify previously created content. Do NOT use for questions, time/weather queries, or searches — use specialized tools instead.",
		inputSchema: updateArtifactInputSchema,
		execute: async ({ id, description }, { experimental_context }) => {
			if (!session?.user?.id) {
				throw new Error("Missing user session for artifact update");
			}

			// Check if artifact exists and user has permission
			const artifact = await getArtifactById(id, session.user.id);
			if (!artifact) {
				return {
					success: false,
					action: "update-artifact",
					id,
					error: "Artifact not found",
				} as const;
			}

			// Stream update metadata
			dataStream.write({
				type: "data-id",
				data: id,
				transient: true,
			});

			dataStream.write({
				type: "data-clear",
				data: null,
				transient: true,
			});

			// Generate updated content
			const updatedContent = await generateUpdatedContent({
				kind: artifact.kind,
				currentContent: artifact.content,
				description,
				dataStream,
				modelConfig,
			});

			// Update in database
			const updated = await updateArtifact({
				artifactId: id,
				userId: session.user.id,
				content: updatedContent,
				changeDescription: description,
			});

			// Signal completion
			dataStream.write({
				type: "data-finish",
				data: null,
				transient: true,
			});

			return {
				success: true,
				action: "update-artifact",
				id,
				version: updated?.version,
				title: artifact.title,
				kind: artifact.kind,
				content: "The artifact has been updated successfully.",
			} as const;
		},
	});

export type UpdateArtifactParams = z.infer<typeof updateArtifactInputSchema>;
