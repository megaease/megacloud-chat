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
			// 重置表单和状态
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
		// 确保我们有一个有效的模型名称，在第二步中从选择器获取
		if (step === "modelSelection" && !selectedModel) {
			toast.error("请选择一个模型");
			return;
		}
		
		saveSettings({
			apiKey: data.apiKey,
			modelName: selectedModel, // 使用选择的模型
			baseUrl: data.baseUrl,
		});
		setIsOpen(false);
		toast.success("API 设置保存成功");
	};

	const testConnection = async () => {
		const values = form.getValues();
		if (!values.apiKey || !values.baseUrl) {
			toast.error("请填写 API Key 和 API URL");
			return;
		}

		setIsTesting(true);
		try {
			// 测试连接并获取可用模型列表
			const response = await fetch("/api/chat/test-connection", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					apiKey: values.apiKey,
					baseUrl: values.baseUrl,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to connect to API");
			}

			// 保存获取的模型列表
			if (data.availableModels && data.availableModels.length > 0) {
				setAvailableModels(data.availableModels);
			}

			setConnectionTested(true);

			// 如果有警告信息（比如模型未在列表中找到），显示警告提示
			if (data.warning) {
				toast.warning("连接警告", {
					description: data.warning,
					duration: 5000,
					action:
						data.availableModels?.length > 0
							? {
									label: "查看可用模型",
									onClick: () => {
										toast.info("可用模型", {
											description: data.availableModels.join(", "),
											duration: 8000,
										});
									},
								}
							: undefined,
				});
			} else {
				toast.success(data.message || "连接成功", {
					description:
						data.availableModels?.length > 0
							? `可用模型：${data.availableModels.slice(0, 3).join(", ")}${data.availableModels.length > 3 ? " 等..." : ""}`
							: undefined,
					action:
						data.availableModels?.length > 0
							? {
									label: "查看全部",
									onClick: () => {
										toast.info("可用模型", {
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

	// 处理连接成功后的模型选择
	const handleModelSelection = () => {
		setStep("modelSelection");
		setConnectionTested(true);
	};
	
	// 当模型列表更新后，如果之前已经保存过模型，选择该模型作为默认选项
	useEffect(() => {
		if (availableModels.length > 0 && modelName) {
			if (availableModels.includes(modelName)) {
				setSelectedModel(modelName);
			}
		}
	}, [availableModels, modelName]);

	// 处理 API 测试成功后的状态更新和模型列表显示
	useEffect(() => {
		if (connectionTested && availableModels.length > 0 && !selectedModel) {
			// 默认选择第一个模型
			setSelectedModel(availableModels[0]);
		}
	}, [connectionTested, availableModels, selectedModel]);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>API 设置</DialogTitle>
					<DialogDescription>
						{step === "initial" 
							? "输入您的 API 密钥和 URL 以连接到 AI 提供商" 
							: "选择要使用的 AI 模型"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{step === "initial" ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="apiKey">API 密钥</Label>
								<Input
									id="apiKey"
									type="password"
									placeholder="输入您的 API 密钥"
									{...form.register("apiKey")}
								/>
								{form.formState.errors.apiKey && (
									<p className="text-sm text-red-500">
										{form.formState.errors.apiKey.message}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="baseUrl">API 地址</Label>
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
									使用自定义 API 端点或保留 OpenAI 的默认端点
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
											测试连接中...
										</>
									) : connectionTested ? (
										<>
											<Check className="mr-2 h-4 w-4" />
											连接成功
										</>
									) : (
										"测试连接"
									)}
								</Button>
								{connectionTested && (
									<Button type="button" onClick={handleModelSelection}>
										下一步
									</Button>
								)}
							</DialogFooter>
						</div>
					) : (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="modelSelect">选择模型</Label>
								{availableModels.length > 0 ? (
									<Select
										value={selectedModel}
										onValueChange={setSelectedModel}
									>
										<SelectTrigger>
											<SelectValue placeholder="选择一个模型" />
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
										placeholder="例如，gpt-4o, claude-3-opus"
										value={selectedModel}
										onChange={(e) => setSelectedModel(e.target.value)}
									/>
								)}
								{!selectedModel && (
									<p className="text-sm text-red-500">
										请选择或输入一个模型名称
									</p>
								)}
							</div>

							<DialogFooter className="flex items-center gap-2 pt-2">
								<Button 
									type="button" 
									variant="outline" 
									onClick={() => setStep("initial")}
								>
									返回
								</Button>
								<Button type="submit" disabled={!selectedModel}>
									保存设置
								</Button>
							</DialogFooter>
						</div>
					)}
				</form>
			</DialogContent>
		</Dialog>
	);
}
