// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
	index,
	integer,
	json,
	pgTableCreator,
	serial,
	text,
	timestamp,
	uuid,
	varchar,
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
});

export const chatsSchema = createSelectSchema(chats);
export const chatMessagesSchema = createSelectSchema(chatMessages);
export const ChatRoleEnum = z.enum(["user", "assistant", "system"]);
export type ChatRole = z.infer<typeof ChatRoleEnum>;
export type Chat = z.infer<typeof chatsSchema>;

// / Define the MCP server status enum
export const ServerStatusEnum = {
	ONLINE: "online",
	OFFLINE: "offline",
	ERROR: "error",
	CONNECTING: "connecting",
} as const;

export type ServerStatus =
	(typeof ServerStatusEnum)[keyof typeof ServerStatusEnum];

// Define the MCP server type enum
export const ServerTypeEnum = {
	DATABASE: "database",
	API: "api",
	AI: "ai",
	CUSTOM: "custom",
} as const;

export type ServerType = (typeof ServerTypeEnum)[keyof typeof ServerTypeEnum];

// Define the MCP server connection type enum - Updated to SSE and STDIO
export const ConnectionTypeEnum = {
	SSE: "sse",
	STDIO: "stdio",
} as const;

export type ConnectionType =
	(typeof ConnectionTypeEnum)[keyof typeof ConnectionTypeEnum];

// Define the MCP servers table schema
export const mcpServers = createTable("mcp_servers", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	connectionType: varchar("connection_type", { length: 50 }).notNull(),
	url: text("url"),
	command: text("command"),
	status: varchar("status", { length: 50 })
		.notNull()
		.default(ServerStatusEnum.OFFLINE),
	lastConnected: timestamp("last_connected"),
	description: text("description"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define Zod schemas for validation
export const insertMcpServerSchema = createInsertSchema(mcpServers, {
	name: z.string().min(2, "Server name must be at least 2 characters"),
	type: z.nativeEnum(ServerTypeEnum),
	connectionType: z.nativeEnum(ConnectionTypeEnum),
	url: z.string().url("Please enter a valid URL").optional().nullable(),
	command: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
}).refine(
	(data) => {
		if (data.connectionType === ConnectionTypeEnum.SSE) {
			return !!data.url;
		}
		if (data.connectionType === ConnectionTypeEnum.STDIO) {
			return !!data.command;
		}
		return false;
	},
	{
		message: "URL or command is required based on connection type",
		path: ["url"],
	},
);

export const selectMcpServerSchema = createSelectSchema(mcpServers);

// Define TypeScript types
export type McpServer = z.infer<typeof selectMcpServerSchema>;
export type NewMcpServer = z.infer<typeof insertMcpServerSchema>;
export type McpServerUpdate = Partial<NewMcpServer>;
