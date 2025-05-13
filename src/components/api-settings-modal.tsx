"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiSettings } from "@/context/api-settings-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const apiSettingsSchema = z.object({
	apiKey: z.string().min(1, { message: "API key is required" }),
	modelName: z.string().min(1, { message: "Model name is required" }),
	baseUrl: z.string().min(1, { message: "API URL is required" }),
});

type ApiSettingsFormValues = z.infer<typeof apiSettingsSchema>;

export function ApiSettingsModal() {
	const {
		isOpen,
		setIsOpen,
		apiKey,
		setApiKey,
		modelName,
		setModelName,
		baseUrl,
		setBaseUrl,
		saveSettings,
	} = useApiSettings();

	const [isTesting, setIsTesting] = useState(false);

	const form = useForm<ApiSettingsFormValues>({
		resolver: zodResolver(apiSettingsSchema),
		defaultValues: {
			apiKey: apiKey,
			modelName: modelName,
			baseUrl: baseUrl,
		},
	});
	useEffect(() => {
		if (isOpen) {
			form.reset({
				apiKey,
				modelName,
				baseUrl,
			});
		}
	}, [isOpen, apiKey, modelName, baseUrl, form]);

	const onSubmit = (data: ApiSettingsFormValues) => {
		setApiKey(data.apiKey);
		setModelName(data.modelName);
		setBaseUrl(data.baseUrl);
		saveSettings();
		setIsOpen(false);
		toast.success("API settings saved successfully");
	};

	const testConnection = async () => {
		const values = form.getValues();
		if (!values.apiKey || !values.modelName || !values.baseUrl) {
			toast.error("Please fill in all fields first");
			return;
		}

		setIsTesting(true);
		try {
			// Using a simple test message to verify the API connection
			const response = await fetch("/api/chat/test-connection", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey: values.apiKey,
					modelName: values.modelName,
					baseUrl: values.baseUrl,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to connect to API");
			}

			// 如果有警告信息（比如模型未在列表中找到），显示警告提示
			if (data.warning) {
				toast.warning("Connection Warning", {
					description: data.warning,
					duration: 5000,
					action:
						data.availableModels?.length > 0
							? {
									label: "View Available Models",
									onClick: () => {
										toast.info("Available Models", {
											description: data.availableModels.join(", "),
											duration: 8000,
										});
									},
								}
							: undefined,
				});
			} else {
				toast.success(data.message || "Connection successful", {
					description:
						data.availableModels?.length > 0
							? `Available models: ${data.availableModels.slice(0, 3).join(", ")}${data.availableModels.length > 3 ? " and more..." : ""}`
							: undefined,
					action:
						data.availableModels?.length > 0
							? {
									label: "View All",
									onClick: () => {
										toast.info("Available Models", {
											description: data.availableModels.join(", "),
											duration: 8000,
										});
									},
								}
							: undefined,
				});
			}
		} catch (error) {
			console.error("Connection test error:", error);
			toast.error("Connection failed", {
				description:
					error instanceof Error ? error.message : "Failed to connect to API",
				duration: 5000,
			});
		} finally {
			setIsTesting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>API Settings</DialogTitle>
					<DialogDescription>
						Enter your API key and model name to connect to your preferred AI
						provider.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="apiKey">API Key</Label>
							<Input
								id="apiKey"
								type="password"
								placeholder="Enter your API key"
								{...form.register("apiKey")}
							/>
							{form.formState.errors.apiKey && (
								<p className="text-sm text-red-500">
									{form.formState.errors.apiKey.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="modelName">Model Name</Label>
							<Input
								id="modelName"
								placeholder="e.g., gpt-4o, claude-3-opus"
								{...form.register("modelName")}
							/>
							{form.formState.errors.modelName && (
								<p className="text-sm text-red-500">
									{form.formState.errors.modelName.message}
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
								Use a custom API endpoint or leave as default for OpenAI
							</p>
						</div>
					</div>

					<DialogFooter className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={testConnection}
							disabled={isTesting}
						>
							{isTesting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Testing...
								</>
							) : (
								"Test Connection"
							)}
						</Button>
						<Button type="submit">Save Settings</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
