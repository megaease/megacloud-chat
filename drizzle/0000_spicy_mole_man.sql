CREATE TABLE "t_chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"chat_id" text NOT NULL,
	"content" text NOT NULL,
	"parts" json NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "t_chats" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "t_mcp_servers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"connection_type" varchar(50) NOT NULL,
	"url" text,
	"command" text,
	"status" varchar(50) DEFAULT 'offline' NOT NULL,
	"last_connected" timestamp,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "t_chat_messages" ADD CONSTRAINT "t_chat_messages_chat_id_t_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."t_chats"("id") ON DELETE cascade ON UPDATE no action;