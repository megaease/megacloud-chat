"use client";

import { useEffect } from "react";
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

	const form = useForm<ApiSettingsFormValues>({
		resolver: zodResolver(apiSettingsSchema),
		defaultValues: {
			apiKey: "",
			modelName: "",
			baseUrl: "https://api.openai.com/v1",
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
						</div>
					</div>

					<DialogFooter>
						<Button type="submit">Save Settings</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
