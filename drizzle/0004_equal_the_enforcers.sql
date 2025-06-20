CREATE TABLE "t_artifacts" (
	"id" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"kind" text NOT NULL,
	"user_id" text NOT NULL,
	"chat_id" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"change_description" text,
	CONSTRAINT "t_artifacts_id_version_pk" PRIMARY KEY("id","version")
);
--> statement-breakpoint
ALTER TABLE "t_artifacts" ADD CONSTRAINT "t_artifacts_chat_id_t_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."t_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artifacts_user_id_idx" ON "t_artifacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "artifacts_chat_id_idx" ON "t_artifacts" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "artifacts_id_idx" ON "t_artifacts" USING btree ("id");