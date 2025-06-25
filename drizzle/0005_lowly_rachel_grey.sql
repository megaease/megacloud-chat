DROP INDEX "artifacts_user_id_idx";--> statement-breakpoint
DROP INDEX "artifacts_chat_id_idx";--> statement-breakpoint
DROP INDEX "artifacts_id_idx";--> statement-breakpoint
CREATE INDEX "idx_artifact_user_id" ON "t_artifacts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_artifact_chat_id" ON "t_artifacts" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "idx_artifact_kind" ON "t_artifacts" USING btree ("kind");