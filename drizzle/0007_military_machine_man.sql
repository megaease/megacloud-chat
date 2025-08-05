ALTER TABLE "t_artifacts" ADD COLUMN "language" text;--> statement-breakpoint
CREATE INDEX "idx_artifact_language" ON "t_artifacts" USING btree ("language");