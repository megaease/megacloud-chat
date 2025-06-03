CREATE TABLE "t_api_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"provider_type" text NOT NULL,
	"api_key" text NOT NULL,
	"base_url" text NOT NULL,
	"is_default" integer DEFAULT 0 NOT NULL,
	"user_id" text NOT NULL,
	"available_models" json DEFAULT '[]'::json,
	"last_model_used" text
);
