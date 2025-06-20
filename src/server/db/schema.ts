// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, type InferSelectModel } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
	index,
	integer,
	json,
	pgTableCreator,
	primaryKey,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
	boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `t_${name}`);

export const chats = createTable("chats", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(16)),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	title: text("title").notNull(),
	userId: text("user_id").notNull(),
});

export const chatMessages = createTable("chat_messages", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(16)),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	chatId: text("chat_id")
		.references(() => chats.id, { onDelete: "cascade" })
		.notNull(),
	content: text("content").notNull(),
	parts: json("parts").notNull(),
	role: text("role").notNull(), // 'user', 'assistant', 'system'
	attachments: json("attachments").notNull(),
});

export const apiProviders = createTable("api_providers", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(16)),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	name: text("name").notNull(), // User custom name for provider
	providerType: text("provider_type").notNull(), // openai, deepseek, azure, anthropic, together, custom
	apiKey: text("api_key").notNull(),
	baseUrl: text("base_url").notNull(),
	isDefault: integer("is_default").notNull().default(0), // Whether this is the default provider
	userId: text("user_id").notNull(),
	availableModels: json("available_models").default([]), // Cached available models list
	lastModelUsed: text("last_model_used"), // Last used model
});

// Artifacts table for storing created documents with version history
export const artifacts = createTable(
	"artifacts",
	{
		id: text("id").$defaultFn(() => nanoid(16)),
		version: integer("version").notNull().default(1),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		title: text("title").notNull(),
		content: text("content").notNull(),
		kind: text("kind").notNull(), // 'text', 'code', 'sheet', 'image'
		userId: text("user_id").notNull(),
		chatId: text("chat_id")
			.references(() => chats.id, { onDelete: "cascade" })
			.notNull(),
		isPublic: boolean("is_public").notNull().default(false),
		tags: json("tags").$type<string[]>().default([]),
		changeDescription: text("change_description"), // Description of what changed in this version
	},
	(table) => ({
		pk: primaryKey({ columns: [table.id, table.version] }),
		// Add index for common queries
		userIdIdx: index("artifacts_user_id_idx").on(table.userId),
		chatIdIdx: index("artifacts_chat_id_idx").on(table.chatId),
		idIdx: index("artifacts_id_idx").on(table.id),
	}),
);

export const chatsSchema = createSelectSchema(chats);
export const chatMessagesSchema = createSelectSchema(chatMessages);
export const artifactsSchema = createSelectSchema(artifacts);

export const ChatRoleEnum = z.enum(["user", "assistant", "system"]);
export const ArtifactKindEnum = z.enum(["text", "code", "sheet", "image"]);

export type ChatRole = z.infer<typeof ChatRoleEnum>;
export type ArtifactKind = z.infer<typeof ArtifactKindEnum>;
export type Chat = z.infer<typeof chatsSchema>;
export type DBMessage = InferSelectModel<typeof chatMessages>;
export type Artifact = InferSelectModel<typeof artifacts>;

// Insert schemas for artifacts
export const insertArtifactSchema = createInsertSchema(artifacts);

// MCP server-related type definitions
// =========================================

// Server status enum
export const ServerStatusEnum = {
	ONLINE: "online",
	OFFLINE: "offline",
	ERROR: "error",
	CONNECTING: "connecting",
} as const;

export type ServerStatus =
	(typeof ServerStatusEnum)[keyof typeof ServerStatusEnum];

export const TypeEnum = {
	SSE: "sse",
	STDIO: "stdio",
} as const;

export type Type = (typeof TypeEnum)[keyof typeof TypeEnum];

// Define MCP server database table structure
export const mcpServers = createTable("mcp_servers", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	url: text("url"),
	command: text("command"),
	status: varchar("status", { length: 50 })
		.notNull()
		.default(ServerStatusEnum.OFFLINE),
	lastConnected: timestamp("last_connected"),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	headers: json("headers").$type<Record<string, string>>().default({}),
	args: json("args").$type<string[]>().default([]),
	env: json("env").$type<Record<string, string>>().default({}),
});

// Base schema definition - shared properties for all server types
const baseServerSchema = z.object({
	name: z.string().min(2, "Server name must be at least 2 characters long"),
	description: z.string().optional(),
	type: z.enum([TypeEnum.SSE, TypeEnum.STDIO]),
});

// Define schema for SSE server type
const sseServerSchema = baseServerSchema.extend({
	type: z.literal(TypeEnum.SSE),
	url: z.string().url("Please enter a valid URL").min(1, "URL cannot be empty"),
	headers: z.record(z.string(), z.string()).default({}),
	command: z.string().optional(),
	args: z.array(z.string()).default([]).optional(),
	env: z.record(z.string(), z.string()).default({}).optional(),
});

// Define schema for STDIO server type
const stdioServerSchema = baseServerSchema.extend({
	type: z.literal(TypeEnum.STDIO),
	command: z.string().min(1, "Command cannot be empty"),
	args: z.array(z.string()).default([]),
	env: z.record(z.string(), z.string()).default({}),
	url: z.string().optional(),
	headers: z.record(z.string(), z.string()).default({}).optional(),
});

// Dynamically select schema based on server type
export const insertMcpServerSchema = z.union([
	sseServerSchema,
	stdioServerSchema,
]);

// Schema for querying database records
export const selectMcpServerSchema = createSelectSchema(mcpServers);

// Export type definitions
export type McpServer = InferSelectModel<typeof mcpServers>;
export type NewMcpServer = z.infer<typeof insertMcpServerSchema>;
export type McpServerSSE = Extract<NewMcpServer, { type: typeof TypeEnum.SSE }>;
export type McpServerSTDIO = Extract<
	NewMcpServer,
	{ type: typeof TypeEnum.STDIO }
>;
export type McpServerUpdate = Partial<NewMcpServer>;
