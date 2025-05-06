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

// MCP 服务器相关的类型定义
// =========================================

// 服务器状态枚举
export const ServerStatusEnum = {
	ONLINE: "online",
	OFFLINE: "offline",
	ERROR: "error",
	CONNECTING: "connecting",
} as const;

export type ServerStatus =
	(typeof ServerStatusEnum)[keyof typeof ServerStatusEnum];

// 服务器连接类型枚举
export const TypeEnum = {
	SSE: "sse", // Server-Sent Events 连接
	STDIO: "stdio", // 标准输入/输出连接
} as const;

export type Type = (typeof TypeEnum)[keyof typeof TypeEnum];

// 定义 MCP 服务器数据表结构
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

// Base 类型定义 - 所有服务器类型共享的属性
const baseServerSchema = {
	name: z.string().min(2, "服务器名称至少需要 2 个字符"),
	description: z.string().optional(),
};

// SSE 类型服务器的专属属性
const sseSpecificSchema = {
	url: z.string().url("请输入有效的 URL 地址").min(1, "URL 不能为空"),
	headers: z.record(z.string(), z.string()).default({}),
};

// STDIO 类型服务器的专属属性
const stdioSpecificSchema = {
	command: z.string().min(1, "命令不能为空"),
	args: z.array(z.string()).default([]),
	env: z.record(z.string(), z.string()).default({}),
};

// 使用 discriminatedUnion 分别定义不同类型服务器的验证规则
export const insertMcpServerSchema = z.discriminatedUnion("type", [
	// SSE 类型服务器
	z.object({
		type: z.literal(TypeEnum.SSE),
		...baseServerSchema,
		...sseSpecificSchema,
		// 这些字段对 SSE 类型是可选的
		command: z.string().optional(),
		args: z.array(z.string()).optional().default([]),
		env: z.record(z.string(), z.string()).default({}),
	}),

	// STDIO 类型服务器
	z.object({
		type: z.literal(TypeEnum.STDIO),
		...baseServerSchema,
		...stdioSpecificSchema,
		// 这些字段对 STDIO 类型是可选的
		url: z.string().optional(),
		headers: z.record(z.string(), z.string()).default({}),
	}),
]);

// 数据库记录查询的 schema
export const selectMcpServerSchema = createSelectSchema(mcpServers);

// 导出类型定义
export type McpServer = z.infer<typeof selectMcpServerSchema>;
export type NewMcpServer = z.infer<typeof insertMcpServerSchema>;
export type McpServerSSE = Extract<NewMcpServer, { type: typeof TypeEnum.SSE }>;
export type McpServerSTDIO = Extract<
	NewMcpServer,
	{ type: typeof TypeEnum.STDIO }
>;
export type McpServerUpdate = Partial<NewMcpServer>;
