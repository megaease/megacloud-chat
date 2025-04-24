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
} from "drizzle-orm/pg-core";

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
