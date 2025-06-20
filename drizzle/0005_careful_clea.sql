ALTER TABLE "t_artifact_versions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "t_artifact_versions" CASCADE;--> statement-breakpoint
ALTER TABLE "t_artifacts" DROP CONSTRAINT "t_artifacts_pkey";--> statement-breakpoint
ALTER TABLE "t_artifacts" ALTER COLUMN "id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "t_artifacts" ADD CONSTRAINT "t_artifacts_id_version_pk" PRIMARY KEY("id","version");--> statement-breakpoint
ALTER TABLE "t_artifacts" ADD COLUMN "change_description" text;--> statement-breakpoint
CREATE INDEX "artifacts_user_id_idx" ON "t_artifacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "artifacts_chat_id_idx" ON "t_artifacts" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "artifacts_id_idx" ON "t_artifacts" USING btree ("id");--> statement-breakpoint
ALTER TABLE "t_artifacts" DROP COLUMN "parent_id";