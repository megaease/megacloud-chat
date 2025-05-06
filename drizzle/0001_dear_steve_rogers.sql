ALTER TABLE "t_mcp_servers" ADD COLUMN "headers" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "t_mcp_servers" ADD COLUMN "args" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "t_mcp_servers" ADD COLUMN "env" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "t_mcp_servers" DROP COLUMN "connection_type";