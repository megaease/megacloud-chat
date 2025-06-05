"use client";

import { useState } from "react";
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
	name: z.string().min(1, { message: "Name cannot be empty" }),
	providerType: z.string().min(1, { message: "Please select a provider type" }),
	apiKey: z.string().min(1, { message: "API key cannot be empty" }),
	baseUrl: z.string().min(1, { message: "API URL cannot be empty" }),
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
				toast.error("Please test the connection first");
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
			} else {
				// Add new provider
				await addProvider({
					name: data.name,
					providerType: data.providerType as ProviderType,
					apiKey: data.apiKey,
					baseUrl: data.baseUrl,
					availableModels: availableModels,
				});
			}

			if (onSuccess) {
				onSuccess();
			}
		} catch (error) {
			console.error("Error saving provider:", error);
			toast.error("Failed to save provider");
		}
	};

	// Test API connection
	const handleTestConnection = async () => {
		const values = form.getValues();

		if (!values.apiKey || !values.baseUrl) {
			toast.error("Please fill in API key and URL");
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

			toast.success("Connection test successful", {
				description:
					models.length > 0
						? `Found ${models.length} available models`
						: "No available models found",
				action:
					models.length > 0
						? {
								label: "View Models",
								onClick: () => {
									toast.info("Available Models", {
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
			toast.error("Connection test failed", {
				description:
					error instanceof Error ? error.message : "Cannot connect to API",
			});
		} finally {
			setIsTesting(false);
		}
	};

	// Handle provider type change and set default URL
	const handleProviderTypeChange = (value: string) => {
		form.setValue("providerType", value);

		// Update URL to default value, unless user has modified it
		const defaultUrl = getDefaultUrlForProvider(value as ProviderType);
		const currentUrl = form.getValues("baseUrl");
		const isDefaultUrl = isKnownDefaultUrl(currentUrl);

		if (isDefaultUrl) {
			form.setValue("baseUrl", defaultUrl);
		}

		// Reset connection test status
		setConnectionTested(false);
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					placeholder="My OpenAI Account"
					{...form.register("name")}
				/>
				{form.formState.errors.name && (
					<p className="text-sm text-red-500">
						{form.formState.errors.name.message}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="providerType">Provider Type</Label>
				<Select
					value={form.watch("providerType")}
					onValueChange={handleProviderTypeChange}
				>
					<SelectTrigger id="providerType">
						<SelectValue placeholder="Select provider type" />
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
						{form.formState.errors.providerType.message}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="apiKey">API Key</Label>
				<Input
					id="apiKey"
					type="password"
					placeholder="sk-..."
					{...form.register("apiKey")}
				/>
				{form.formState.errors.apiKey && (
					<p className="text-sm text-red-500">
						{form.formState.errors.apiKey.message}
					</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="baseUrl">API URL</Label>
				<Input
					id="baseUrl"
					placeholder="https://api.openai.com/v1"
					{...form.register("baseUrl")}
				/>
				{form.formState.errors.baseUrl && (
					<p className="text-sm text-red-500">
						{form.formState.errors.baseUrl.message}
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
							Testing connection...
						</>
					) : connectionTested ? (
						<>
							<IconCheck className="mr-2 h-4 w-4" />
							Connection successful
						</>
					) : (
						"Test Connection"
					)}
				</Button>

				<Button type="submit" disabled={!connectionTested}>
					{initialProvider ? "Update" : "Add"} Provider
				</Button>
			</div>
		</form>
	);
}
