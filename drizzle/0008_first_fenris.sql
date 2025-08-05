CREATE TABLE "t_message_edit_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"message_id" text NOT NULL,
	"previous_content" text NOT NULL,
	"new_content" text NOT NULL,
	"edit_reason" text
);
--> statement-breakpoint
ALTER TABLE "t_chat_messages" ADD COLUMN "original_content" text;--> statement-breakpoint
ALTER TABLE "t_chat_messages" ADD COLUMN "edit_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "t_message_edit_history" ADD CONSTRAINT "t_message_edit_history_message_id_t_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."t_chat_messages"("id") ON DELETE cascade ON UPDATE no action;