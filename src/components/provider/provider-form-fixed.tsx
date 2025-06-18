"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useApiProvider } from "@/context/api-provider-context";
import { toast } from "sonner";
import { IconLoader2, IconCheck } from "@tabler/icons-react";
import type { ProviderType } from "@/lib/ai-providers";
import {
	getDefaultUrlForProvider,
	isKnownDefaultUrl,
} from "@/lib/ai-providers";
import type { ApiProvider } from "@/types/api-provider";

const providerSchema = z.object({
	name: z.string().min(1, { message: "nameRequired" }),
	providerType: z.string().min(1, { message: "providerTypeRequired" }),
	apiKey: z.string().min(1, { message: "apiKeyRequired" }),
	baseUrl: z.string().min(1, { message: "baseUrlRequired" }),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

interface ProviderFormProps {
	initialProvider?: ApiProvider;
	onSuccess?: () => void;
}

export function ProviderForm({
	initialProvider,
	onSuccess,
}: ProviderFormProps) {
	const t = useTranslations("Provider");
	const { addProvider, updateProvider, testConnection } = useApiProvider();
	const [isTesting, setIsTesting] = useState(false);
	const [connectionTested, setConnectionTested] = useState(false);
	const [availableModels, setAvailableModels] = useState<string[]>([]);

	const form = useForm<ProviderFormValues>({
		resolver: zodResolver(providerSchema),
		defaultValues: initialProvider
			? {
					name: initialProvider.name,
					providerType: initialProvider.providerType,
					apiKey: initialProvider.apiKey,
					baseUrl: initialProvider.baseUrl,
				}
			: {
					name: "",
					providerType: "openai",
					apiKey: "",
					baseUrl: "https://api.openai.com/v1",
				},
	});

	// Handle form submission
	const onSubmit = async (data: ProviderFormValues) => {
		try {
			if (!connectionTested) {
				toast.error(t("connectionTestRequired"));
				return;
			}

			if (initialProvider) {
				// Update existing provider
				await updateProvider(initialProvider.id, {
					name: data.name,
					providerType: data.providerType as ProviderType,
					apiKey: data.apiKey,
					baseUrl: data.baseUrl,
					availableModels,
				});
				toast.success(t("providerUpdated"));
			} else {
				// Add new provider
				await addProvider({
					name: data.name,
					providerType: data.providerType as ProviderType,
					apiKey: data.apiKey,
					baseUrl: data.baseUrl,
					availableModels: availableModels,
				});
				toast.success(t("providerAdded"));
			}

			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			console.error("Error saving provider:", error);
			toast.error(t("operationFailed"));
		}
	};

	// Test API connection
	const handleTestConnection = async () => {
		const values = form.getValues();

		if (!values.apiKey || !values.baseUrl) {
			toast.error(`${t("apiKeyRequired")} and ${t("baseUrlRequired")}`);
			return;
		}

		setIsTesting(true);
		try {
			const models = await testConnection({
				apiKey: values.apiKey,
				baseUrl: values.baseUrl,
				providerType: values.providerType as ProviderType,
			});

			setAvailableModels(models);
			setConnectionTested(true);

			toast.success(t("connectionTestSuccess"), {
				description:
					models.length > 0
						? t("modelsFound", { count: models.length })
						: t("noModels"),
				action:
					models.length > 0
						? {
								label: "View Models",
								onClick: () => {
									toast.info(t("availableModels"), {
										description:
											models.slice(0, 20).join(", ") +
											(models.length > 20 ? "..." : ""),
										duration: 8000,
									});
								},
							}
						: undefined,
			});
		} catch (error) {
			console.error("Test connection error:", error);
			toast.error(t("connectionTestFailed"), {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		} finally {
			setIsTesting(false);
		}
	};

	// Handle provider type change
	const handleProviderTypeChange = (value: string) => {
		form.setValue("providerType", value);

		// Auto-fill URL based on provider type
		const defaultUrl = getDefaultUrlForProvider(value as ProviderType);
		if (
			defaultUrl &&
			(!form.getValues("baseUrl") ||
				isKnownDefaultUrl(form.getValues("baseUrl")))
		) {
			form.setValue("baseUrl", defaultUrl);
		}

		// Reset connection test status
		setConnectionTested(false);
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">{t("name")}</Label>
				<Input
					id="name"
					placeholder={t("namePlaceholder")}
					{...form.register("name")}
				/>
				{form.formState.errors.name && (
					<p className="text-sm text-red-500">
						{t(
							form.formState.errors.name
								.message as keyof IntlMessages["Provider"],
						)}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="providerType">{t("providerType")}</Label>
				<Select
					value={form.watch("providerType")}
					onValueChange={handleProviderTypeChange}
				>
					<SelectTrigger id="providerType">
						<SelectValue placeholder={t("providerTypeRequired")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="openai">OpenAI</SelectItem>
						<SelectItem value="deepseek">DeepSeek</SelectItem>
						<SelectItem value="openrouter">OpenRouter</SelectItem>
						<SelectItem value="custom">Custom</SelectItem>
					</SelectContent>
				</Select>
				{form.formState.errors.providerType && (
					<p className="text-sm text-red-500">
						{t(
							form.formState.errors.providerType
								.message as keyof IntlMessages["Provider"],
						)}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="apiKey">{t("apiKey")}</Label>
				<Input
					id="apiKey"
					type="password"
					placeholder={t("apiKeyPlaceholder")}
					{...form.register("apiKey")}
				/>
				{form.formState.errors.apiKey && (
					<p className="text-sm text-red-500">
						{t(
							form.formState.errors.apiKey
								.message as keyof IntlMessages["Provider"],
						)}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="baseUrl">{t("baseUrl")}</Label>
				<Input
					id="baseUrl"
					placeholder={t("baseUrlPlaceholder")}
					{...form.register("baseUrl")}
				/>
				{form.formState.errors.baseUrl && (
					<p className="text-sm text-red-500">
						{t(
							form.formState.errors.baseUrl
								.message as keyof IntlMessages["Provider"],
						)}
					</p>
				)}
				<p className="text-xs text-muted-foreground">
					Use the provider's API endpoint
				</p>
			</div>

			<div className="flex justify-between pt-2">
				<Button
					type="button"
					variant="outline"
					onClick={handleTestConnection}
					disabled={isTesting}
				>
					{isTesting ? (
						<>
							<IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
							{t("testingConnection")}
						</>
					) : connectionTested ? (
						<>
							<IconCheck className="mr-2 h-4 w-4" />
							{t("connectionTestSuccess")}
						</>
					) : (
						t("testConnection")
					)}
				</Button>

				<Button type="submit" disabled={!connectionTested}>
					{initialProvider ? t("editProvider") : t("addProvider")}
				</Button>
			</div>
		</form>
	);
}
