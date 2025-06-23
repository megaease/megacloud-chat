"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconLoader2, IconPlus, IconServer } from "@tabler/icons-react";
import { toast } from "sonner";
import { KeyValueEditor } from "./key-value-editor";
import { createMcpServer } from "@/lib/mcp-server-action";
import {
	insertMcpServerSchema,
	TypeEnum,
	type McpServerSSE,
	type McpServerSTDIO,
} from "@/server/db/schema";

// Generate unique ID for array items
const generateId = () => Math.random().toString(36).substr(2, 9);

// Argument item with unique ID
interface ArgumentItem {
	id: string;
	value: string;
}

interface AddServerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	customTrigger?: boolean;
}

// Default values for SSE server
const defaultSseValues: McpServerSSE = {
	type: TypeEnum.SSE,
	name: "",
	url: "",
	description: "",
	headers: {},
	command: "",
	args: [],
	env: {},
};

const defaultStdioValues: McpServerSTDIO = {
	type: TypeEnum.STDIO,
	name: "",
	command: "",
	description: "",
	args: [],
	env: {},
	url: "",
	headers: {},
};

type ServerFormValues = z.infer<typeof insertMcpServerSchema>;

export function AddServerDialog({
	onSuccess,
	open,
	onOpenChange,
	customTrigger,
}: AddServerDialogProps) {
	const t = useTranslations("MCPServer");
	const tCommon = useTranslations("Common");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [argItems, setArgItems] = useState<ArgumentItem[]>([]);

	// Use type assertion to resolve compatibility between complex union types and form library
	const form = useForm<ServerFormValues>({
		resolver: zodResolver(insertMcpServerSchema) as Resolver<ServerFormValues>,
		defaultValues: defaultSseValues,
	});

	// Initialize argItems from form data
	useEffect(() => {
		const formArgs = form.getValues("args") || [];
		if (argItems.length === 0 && formArgs.length > 0) {
			setArgItems(
				formArgs.map((value) => ({
					id: generateId(),
					value,
				})),
			);
		}
	}, [argItems.length, form]);

	// Reset form and state when dialog opens
	useEffect(() => {
		if (open) {
			// Reset form to default values
			form.reset(defaultSseValues);
			// Reset argItems state
			setArgItems([]);
			// Reset submitting state
			setIsSubmitting(false);
		}
	}, [open, form]);

	// Update form when argItems change
	const updateFormArgs = (newArgItems: ArgumentItem[]) => {
		setArgItems(newArgItems);
		form.setValue(
			"args",
			newArgItems.map((item) => item.value),
		);
	};

	// Handle form submission
	const onSubmit = async (data: ServerFormValues) => {
		setIsSubmitting(true);

		try {
			const cleanedData = { ...data };

			if (data.type === TypeEnum.SSE) {
				cleanedData.command = "";
				cleanedData.args = [];
				cleanedData.env = {};
			} else if (data.type === TypeEnum.STDIO) {
				cleanedData.url = "";
				cleanedData.headers = {};
			}

			const result = await createMcpServer(cleanedData);

			if (result.success) {
				toast.success(t("serverAdded"));
				form.reset(defaultSseValues);
				setArgItems([]);
				onOpenChange(false);
				if (onSuccess) onSuccess();
			} else {
				// 处理多行错误信息的显示
				const errorMessage = result.error || t("serverAddFailed");
				const lines = errorMessage.split("\n");

				if (lines.length > 1) {
					// 多行错误信息，显示详细错误
					toast.error(
						<div className="space-y-1">
							<div className="font-medium">{lines[0]}</div>
							{lines.slice(1).map((line: string) => (
								<div
									key={`error-${Date.now()}-${line.slice(0, 20)}`}
									className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap"
								>
									{line}
								</div>
							))}
						</div>,
						{
							duration: 8000, // 延长显示时间以便用户阅读详细错误
						},
					);
				} else {
					// 单行错误信息，正常显示
					toast.error(errorMessage);
				}
			}
		} catch (error) {
			console.error("Failed to add server:", error);
			toast.error(t("serverAddFailed"));
		} finally {
			setIsSubmitting(false);
		}
	};

	// Switch server type
	const handleTypeChange = (type: (typeof TypeEnum)[keyof typeof TypeEnum]) => {
		form.setValue("type", type);
		// Reset argItems when switching server type
		if (type === TypeEnum.SSE) {
			setArgItems([]);
			form.setValue("args", []);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				{customTrigger ? null : (
					<div className="w-full px-4 py-2">
						<Button className="w-full">
							<IconPlus className="mr-2 h-4 w-4" />
							{t("addServer")}
						</Button>
					</div>
				)}
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(880px,90vh)] sm:max-w-xl  [&>button:last-child]:top-3.5">
				<DialogHeader className="px-6 py-4">
					<DialogTitle>{t("addServer")}</DialogTitle>
					<DialogDescription>{t("descriptionDescription")}</DialogDescription>
				</DialogHeader>

				<div className="overflow-y-auto  px-6 py-4">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(
								onSubmit,
								// Add error handling callback to display validation errors
								(errors) => {
									console.error("Form validation errors:", errors);
									toast.error(t("validationError"));
								},
							)}
							className="space-y-6"
						>
							{/* Server type selection */}
							<div className="space-y-2">
								<FormLabel>{t("serverType")}</FormLabel>
								<Tabs
									value={form.watch("type")}
									onValueChange={(value) =>
										handleTypeChange(
											value as (typeof TypeEnum)[keyof typeof TypeEnum],
										)
									}
									className="w-full"
								>
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value={TypeEnum.SSE}>
											<IconServer className="mr-2 h-4 w-4" />
											SSE
										</TabsTrigger>
										<TabsTrigger value={TypeEnum.STDIO}>
											<IconServer className="mr-2 h-4 w-4" />
											STDIO
										</TabsTrigger>
									</TabsList>
								</Tabs>
								<FormDescription>
									{form.watch("type") === TypeEnum.SSE
										? t("serverTypeDescription").split("|")[0]
										: t("serverTypeDescription").split("|")[1]}
								</FormDescription>
							</div>

							{/* Basic information */}
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("name")}</FormLabel>
											<FormControl>
												<Input placeholder={t("namePlaceholder")} {...field} />
											</FormControl>
											<FormDescription>{t("nameDescription")}</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("description")}</FormLabel>
											<FormControl>
												<Textarea
													placeholder={t("descriptionPlaceholder")}
													className="resize-none"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormDescription>
												{t("descriptionDescription")}
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* SSE specific fields */}
							{form.watch("type") === TypeEnum.SSE && (
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="url"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("url")}</FormLabel>
												<FormControl>
													<Input placeholder={t("urlPlaceholder")} {...field} />
												</FormControl>
												<FormDescription>{t("urlDescription")}</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="headers"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("httpHeaders")}</FormLabel>
												<FormControl>
													<KeyValueEditor
														keyPlaceholder={t("headerName")}
														valuePlaceholder={t("headerValue")}
														value={field.value || {}}
														onChange={field.onChange}
													/>
												</FormControl>
												<FormDescription>
													{t("httpHeadersDescription")}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{/* STDIO specific fields */}
							{form.watch("type") === TypeEnum.STDIO && (
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="command"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("command")}</FormLabel>
												<FormControl>
													<Input
														placeholder={t("commandPlaceholder")}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													{t("commandDescription")}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="args"
										render={() => (
											<FormItem>
												<FormLabel>{t("commandArguments")}</FormLabel>
												<FormControl>
													<div className="space-y-2">
														{argItems.map((item, i) => (
															<div
																key={item.id}
																className="flex items-center gap-2"
															>
																<Input
																	value={item.value}
																	onChange={(e) => {
																		const newArgItems = [...argItems];
																		newArgItems[i] = {
																			...item,
																			value: e.target.value,
																		};
																		updateFormArgs(newArgItems);
																	}}
																	placeholder={t("argumentPlaceholder", {
																		number: i + 1,
																	})}
																/>
																<Button
																	type="button"
																	variant="outline"
																	size="icon"
																	onClick={() => {
																		const newArgItems = argItems.filter(
																			(_, idx) => idx !== i,
																		);
																		updateFormArgs(newArgItems);
																	}}
																>
																	×
																</Button>
															</div>
														))}
														<Button
															type="button"
															variant="outline"
															onClick={() => {
																const newArgItems = [
																	...argItems,
																	{ id: generateId(), value: "" },
																];
																updateFormArgs(newArgItems);
															}}
														>
															{t("addArgument")}
														</Button>
													</div>
												</FormControl>
												<FormDescription>
													{t("commandArgumentsDescription")}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="env"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("environmentVariables")}</FormLabel>
												<FormControl>
													<KeyValueEditor
														keyPlaceholder={t("variableName")}
														valuePlaceholder={t("variableValue")}
														value={field.value || {}}
														onChange={field.onChange}
													/>
												</FormControl>
												<FormDescription>
													{t("environmentVariablesDescription")}
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
								>
									{tCommon("cancel")}
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
											{t("adding")}
										</>
									) : (
										t("addServer")
									)}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
