export const GLM_MODELS = [
	"glm-4.5",
	"glm-4.5-air",
	"glm-4-air-250414",
	"glm-4-flash-250414",
	"glm-4-0520",
	"glm-4-air",
	"glm-4-flash",
	"glm-4-9b",
	"chatglm3-6b",
] as const;

export type GlmModel = (typeof GLM_MODELS)[number];
