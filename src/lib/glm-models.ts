export const GLM_MODELS = [
	"glm-4.5",
	"glm-4.5-x",
	"glm-4.5-air",
	"glm-4.5-airx",
	"glm-4.5-flash",
	"glm-z1-airx",
] as const;

export type GlmModel = (typeof GLM_MODELS)[number];
