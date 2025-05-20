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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiSettings } from "@/context/api-settings-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import type { cn } from "@/lib/utils";

const initialSettingsSchema = z.object({
	apiKey: z.string().min(1, { message: "API key is required" }),
	baseUrl: z.string().min(1, { message: "API URL is required" }),
});

const completeSettingsSchema = initialSettingsSchema.extend({
	modelName: z.string().min(1, { message: "Model name is required" }),
});

type InitialSettingsFormValues = z.infer<typeof initialSettingsSchema>;
type CompleteSettingsFormValues = z.infer<typeof completeSettingsSchema>;

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
	const [connectionTested, setConnectionTested] = useState(false);
	const [availableModels, setAvailableModels] = useState<string[]>([]);
	const [selectedModel, setSelectedModel] = useState("");
	const [step, setStep] = useState<"initial" | "modelSelection">("initial");

	const form = useForm<InitialSettingsFormValues>({
		resolver: zodResolver(initialSettingsSchema),
		defaultValues: {
			apiKey: apiKey,
			baseUrl: baseUrl || "https://api.openai.com/v1",
		},
	});

	useEffect(() => {
		if (isOpen) {
			// Reset form and state
			form.reset({
				apiKey: apiKey,
				baseUrl: baseUrl || "https://api.openai.com/v1",
			});
			setConnectionTested(false);
			setAvailableModels([]);
			setSelectedModel("");
			setStep("initial");
		}
	}, [isOpen, apiKey, baseUrl, form]);

	const onSubmit = (data: InitialSettingsFormValues) => {
		// Ensure we have a valid model name, obtained from the selector in step two
		if (step === "modelSelection" && !selectedModel) {
			toast.error("Please select a model");
			return;
		}

		saveSettings({
			apiKey: data.apiKey,
			modelName: selectedModel, // Use the selected model
			baseUrl: data.baseUrl,
		});
		setIsOpen(false);
		toast.success("API settings saved successfully");
	};

	const testConnection = async () => {
		const values = form.getValues();
		if (!values.apiKey || !values.baseUrl) {
			toast.error("Please fill in API Key and API URL");
			return;
		}

		setIsTesting(true);
		try {
			// Test the connection
			const testResponse = await fetch("/api/chat/test-connection", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey: values.apiKey,
					baseUrl: values.baseUrl,
				}),
			});

			const testData = await testResponse.json();

			if (!testResponse.ok) {
				throw new Error(testData.error || "Unable to connect to API");
			}

			// After the connection test succeeds, get the complete model list
			const modelsResponse = await fetch("/api/models/list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey: values.apiKey,
					baseUrl: values.baseUrl,
				}),
			});

			const modelsData = await modelsResponse.json();

			if (modelsResponse.ok && modelsData.models) {
				// Use the complete model list
				setAvailableModels(modelsData.models);
			} else if (testData.sampleModels && testData.sampleModels.length > 0) {
				// If getting the complete list fails, use sample models returned from the test connection
				setAvailableModels(testData.sampleModels);
			}

			setConnectionTested(true);

			// If there are warning messages (e.g., model not found in list), display a warning prompt
			if (testData.warning) {
				toast.warning("Connection Warning", {
					description: testData.warning,
					duration: 5000,
					action:
						availableModels.length > 0
							? {
									label: "View Available Models",
									onClick: () => {
										toast.info("Available Models", {
											description: availableModels.join(", "),
											duration: 8000,
										});
									},
								}
							: undefined,
				});
			} else {
				toast.success(testData.message || "Connection Successful", {
					description:
						availableModels.length > 0
							? `Available Models: ${availableModels.slice(0, 3).join(", ")}${availableModels.length > 3 ? " etc..." : ""}`
							: undefined,
					action:
						availableModels.length > 0
							? {
									label: "View All",
									onClick: () => {
										toast.info("Available Models", {
											description: availableModels.join(", "),
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

	// Handle model selection after successful connection
	const handleModelSelection = () => {
		setStep("modelSelection");
		setConnectionTested(true);
	};

	// When the model list is updated, if a model has been previously saved, select it as the default option
	useEffect(() => {
		if (availableModels.length > 0 && modelName) {
			if (availableModels.includes(modelName)) {
				setSelectedModel(modelName);
			}
		}
	}, [availableModels, modelName]);

	// Handle state updates and model list display after successful API test
	useEffect(() => {
		if (connectionTested && availableModels.length > 0 && !selectedModel) {
			// Select the first model by default
			setSelectedModel(availableModels[0] ?? "");
		}
	}, [connectionTested, availableModels, selectedModel]);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>API Settings</DialogTitle>
					<DialogDescription>
						{step === "initial"
							? "Enter your API key and URL to connect to the AI provider"
							: "Select the AI model to use"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{step === "initial" ? (
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
									Use a custom API endpoint or keep the default OpenAI endpoint
								</p>
							</div>

							<DialogFooter className="flex items-center gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={testConnection}
									disabled={isTesting}
								>
									{isTesting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Testing connection...
										</>
									) : connectionTested ? (
										<>
											<Check className="h-4 w-" />
											Connection successful
										</>
									) : (
										"Test Connection"
									)}
								</Button>
								{connectionTested && (
									<Button type="button" onClick={handleModelSelection}>
										Next
									</Button>
								)}
							</DialogFooter>
						</div>
					) : (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="modelSelect">Select Model</Label>
								{availableModels.length > 0 ? (
									<Select
										value={selectedModel}
										onValueChange={setSelectedModel}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select a model" />
										</SelectTrigger>
										<SelectContent>
											{availableModels.map((model) => (
												<SelectItem key={model} value={model}>
													{model}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<Input
										placeholder="e.g., gpt-4o, claude-3-opus"
										value={selectedModel}
										onChange={(e) => setSelectedModel(e.target.value)}
									/>
								)}
								{!selectedModel && (
									<p className="text-sm text-red-500">
										Please select or enter a model name
									</p>
								)}
							</div>

							<DialogFooter className="flex items-center gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setStep("initial")}
								>
									Back
								</Button>
								<Button type="submit" disabled={!selectedModel}>
									Save Settings
								</Button>
							</DialogFooter>
						</div>
					)}
				</form>
			</DialogContent>
		</Dialog>
	);
}
