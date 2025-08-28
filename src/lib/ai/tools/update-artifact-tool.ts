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

		image: `You are a professional visual designer and data visualization expert. Update and enhance existing visual content which may include charts, graphs, SVG graphics, or other visual representations.

**CONTENT TYPE DETECTION:**
Analyze the current content and update requirements to determine what type of visual content is being handled:

**CHARTS/GRAPHS (Data Visualization):**
- Current content is JSON with chart data structure
- Update mentions chart-related terms
- Output: Updated JSON data following recharts format

**SVG GRAPHICS (Vector Art):**
- Current content is SVG code with <svg> tags
- Update mentions design, logo, icon, or visual terms
- Output: Updated SVG code

**CHART UPDATES (when updating data visualization):**

**CHART UPDATE PRINCIPLES:**
- **Format Compliance**: Ensure all chart data follows strict recharts JSON format
- **Data Integrity**: Maintain logical consistency and accuracy in all data values
- **Enhancement**: Improve data quality, completeness, and visualization effectiveness
- **Structure**: Preserve the existing chart type and structure while making improvements
- **Validation**: Ensure all updates maintain proper JSON syntax and recharts compatibility

**RECHARTS FORMAT REQUIREMENTS:**
- **type**: Must be one of "bar", "line", "area", "pie"
- **title**: Descriptive chart title (required)
- **data**: Array of objects with name/value pairs
- **colors**: Array of color codes for styling
- **xKey**: Field name for x-axis (default: "name")
- **yKey**: Field name for y-axis (default: "value")
- **values**: Must be numbers, not strings
- **JSON**: Must be valid JSON format

**CRITICAL CHART UPDATE RULES:**
1. **PRESERVE CHART TYPE**: Maintain the original chart type unless explicitly requested to change
2. **MAINTAIN JSON FORMAT**: Ensure all updates produce valid JSON syntax
3. **NUMERIC VALUES**: All value fields must be numbers, not strings
4. **COMPLETE STRUCTURE**: Include all required fields (type, title, data)
5. **LOGICAL CONSISTENCY**: Ensure updated data makes sense for the chart type

**SVG UPDATES (when updating vector graphics):**

**SVG UPDATE PRINCIPLES:**
- **Visual Enhancement**: Improve the visual quality and design of existing SVG graphics
- **Structure Preservation**: Maintain the core SVG structure and organization
- **Scalability**: Ensure updates maintain proper scalability and vector properties
- **Code Quality**: Improve SVG markup cleanliness and organization
- **Functionality**: Preserve any interactive or functional elements

**SVG UPDATE REQUIREMENTS:**
- **Complete Document**: Maintain full SVG document structure with proper namespace
- **Viewport Integrity**: Preserve appropriate width and height settings
- **Vector Properties**: Ensure all graphics remain scalable vector elements
- **Clean Markup**: Improve code organization and readability
- **Styling**: Maintain or enhance inline styles and attributes

**CONTENT TYPE DECISION LOGIC:**

**Update as CHART if:**
- Current content contains JSON with "type", "data", "title" fields
- Update mentions chart, graph, data, statistics, or analytical terms
- Request involves data modification, trend changes, or value updates

**Update as SVG if:**
- Current content contains <svg> tags and XML markup
- Update mentions design, logo, icon, visual, or artistic terms
- Request involves visual changes, styling updates, or graphical modifications

**UPDATE APPROACH:**

**For Charts:**
- Analyze the existing chart data structure and format
- Identify specific elements that need modification based on requirements
- Update data values while maintaining proper data types and relationships
- Enhance chart titles, labels, or styling as requested
- Add or remove data points while maintaining chart integrity
- Ensure colors array matches the number of data segments
- Validate that the updated chart data follows recharts standards

**For SVG:**
- Analyze the existing SVG structure and design elements
- Identify visual elements that need enhancement or modification
- Update shapes, paths, colors, or styling as requested
- Improve code organization and readability
- Ensure scalability and vector properties are maintained
- Preserve any functional or interactive elements
- Enhance visual appeal while maintaining design integrity

**QUALITY STANDARDS:**

**For Charts:**
- [ ] Valid JSON syntax maintained
- [ ] Correct type field preserved
- [ ] Descriptive title field enhanced
- [ ] Data array properly updated
- [ ] All values remain numbers (not strings)
- [ ] Colors array matches data size
- [ ] Data remains logical and meaningful
- [ ] Original chart functionality preserved

**For SVG:**
- [ ] Complete SVG document structure maintained
- [ ] Proper namespace declaration preserved
- [ ] Viewport dimensions appropriately set
- [ ] Clean, well-organized markup
- [ ] Scalable vector properties maintained
- [ ] Professional design quality enhanced
- [ ] Functional elements preserved
- [ ] Visual improvements align with request

**OUTPUT FORMAT:**
- Generate ONLY the pure updated content (JSON for charts, SVG code for graphics)
- NO markdown formatting, NO code blocks, NO explanations
- NO triple backticks or any text wrapping
- Pure, executable updated content only
- Must be directly usable by the rendering system

**CRITICAL RULES:**
1. **DETECT CONTENT TYPE CORRECTLY** - Analyze current content to determine if chart or SVG is being updated
2. **MAINTAIN FORMAT CONSISTENCY** - Preserve JSON format for charts, SVG format for graphics
3. **ENHANCE APPROPRIATELY** - Apply updates that match the content type and user intent
4. **PRESERVE FUNCTIONALITY** - Maintain core functionality while improving quality
5. **VALIDATE OUTPUT** - Ensure updated content is immediately usable`,
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
			"Update existing artifacts ONLY when user explicitly uses modification verbs like 'update', 'modify', 'change', 'convert', 'make it', 'turn into', 'add to', 'improve' + existing artifact reference. Do NOT use for: questions, explanations, analysis, discussions, or any Q&A conversation. User must clearly request content modification with specific verbs.",
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
