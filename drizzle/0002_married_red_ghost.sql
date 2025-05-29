ALTER TABLE "t_mcp_servers" ALTER COLUMN "args" SET DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "t_chat_messages" ADD COLUMN "attachments" json NOT NULL;