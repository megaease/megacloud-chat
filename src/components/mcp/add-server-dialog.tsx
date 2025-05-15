"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Plus, Server } from "lucide-react";
import { toast } from "sonner";
import { KeyValueEditor } from "./key-value-editor";
import { createMcpServer } from "@/lib/mcp-server-action";
import {
	insertMcpServerSchema,
	TypeEnum,
	type McpServerSSE,
	type McpServerSTDIO,
} from "@/server/db/schema";

interface AddServerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
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
}: AddServerDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Use type assertion to resolve compatibility between complex union types and form library
	const form = useForm<ServerFormValues>({
		resolver: zodResolver(insertMcpServerSchema) as Resolver<ServerFormValues>,
		defaultValues: defaultSseValues,
	});

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
				toast.success("Server added successfully!");
				form.reset();
				onOpenChange(false);
				if (onSuccess) onSuccess();
			} else {
				toast.error(result.error || "Failed to add server");
			}
		} catch (error) {
			console.error("Failed to add server:", error);
			toast.error("Failed to add server");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Switch server type
	const handleTypeChange = (type: (typeof TypeEnum)[keyof typeof TypeEnum]) => {
		form.setValue("type", type);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<div className="w-full px-4 py-2">
					<Button className="w-full">
						<Plus className="mr-2 h-4 w-4" />
						Add Server
					</Button>
				</div>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(880px,90vh)] sm:max-w-xl  [&>button:last-child]:top-3.5">
				<DialogHeader className="px-6 py-4">
					<DialogTitle>Add MCP Server</DialogTitle>
					<DialogDescription>
						Add a new MCP server to enhance AI assistant capabilities.
					</DialogDescription>
				</DialogHeader>

				<div className="overflow-y-auto  px-6 py-4">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(
								onSubmit,
								// 添加错误处理回调以显示验证错误
								(errors) => {
									console.error("Form validation errors:", errors);
									toast.error(
										"Please correct the form errors before submitting",
									);
								},
							)}
							className="space-y-6"
						>
							{/* Server type selection */}
							<div className="space-y-2">
								<FormLabel>Server Type</FormLabel>
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
											<Server className="mr-2 h-4 w-4" />
											SSE
										</TabsTrigger>
										<TabsTrigger value={TypeEnum.STDIO}>
											<Server className="mr-2 h-4 w-4" />
											STDIO
										</TabsTrigger>
									</TabsList>
								</Tabs>
								<FormDescription>
									{form.watch("type") === TypeEnum.SSE
										? "SSE (Server-Sent Events) connects to MCP server via HTTP."
										: "STDIO connects to local MCP process via standard input/output."}
								</FormDescription>
							</div>

							{/* Basic information */}
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input placeholder="MCP Server Name" {...field} />
											</FormControl>
											<FormDescription>
												Display name for the server
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Server description (optional)"
													className="resize-none"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormDescription>
												Brief description of this MCP server's functionality and
												purpose
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
												<FormLabel>URL</FormLabel>
												<FormControl>
													<Input
														placeholder="https://example.com/mcp"
														{...field}
													/>
												</FormControl>
												<FormDescription>
													SSE endpoint URL for the MCP server
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="headers"
										render={({ field }) => (
											<FormItem>
												<FormLabel>HTTP Headers</FormLabel>
												<FormControl>
													<KeyValueEditor
														keyPlaceholder="Header name"
														valuePlaceholder="Header value"
														value={field.value || {}}
														onChange={field.onChange}
													/>
												</FormControl>
												<FormDescription>
													Custom HTTP headers sent to the MCP server
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
												<FormLabel>Command</FormLabel>
												<FormControl>
													<Input placeholder="npx" {...field} />
												</FormControl>
												<FormDescription>
													Command to start the MCP server
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="args"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Command Arguments</FormLabel>
												<FormControl>
													<div className="space-y-2">
														{field.value?.map((arg, i) => (
															<div
																key={`arg-${i}`}
																className="flex items-center gap-2"
															>
																<Input
																	value={arg}
																	onChange={(e) => {
																		const newArgs = [...(field.value || [])];
																		newArgs[i] = e.target.value;
																		field.onChange(newArgs);
																	}}
																	placeholder={`Argument ${i + 1}`}
																/>
																<Button
																	type="button"
																	variant="outline"
																	size="icon"
																	onClick={() => {
																		const newArgs = [...(field.value || [])];
																		newArgs.splice(i, 1);
																		field.onChange(newArgs);
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
																field.onChange([...(field.value || []), ""]);
															}}
														>
															Add Argument
														</Button>
													</div>
												</FormControl>
												<FormDescription>
													List of arguments passed to the command
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
												<FormLabel>Environment Variables</FormLabel>
												<FormControl>
													<KeyValueEditor
														keyPlaceholder="Variable name"
														valuePlaceholder="Variable value"
														value={field.value || {}}
														onChange={field.onChange}
													/>
												</FormControl>
												<FormDescription>
													Environment variables passed to the MCP server process
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
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Adding...
										</>
									) : (
										"Add Server"
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
