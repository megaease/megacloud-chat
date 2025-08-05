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
import { IconLoader2, IconServer } from "@tabler/icons-react";
import { toast } from "sonner";
import { KeyValueEditor } from "./key-value-editor";
import { updateMcpServer, getMcpServerById } from "@/lib/mcp-server-action";
import { insertMcpServerSchema, TypeEnum } from "@/server/db/schema";
import { useQuery } from "@tanstack/react-query";

// Generate unique ID for array items
const generateId = () => Math.random().toString(36).substr(2, 9);

// Argument item with unique ID
interface ArgumentItem {
	id: string;
	value: string;
}

interface EditServerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	serverId: number | null;
}

type ServerFormValues = z.infer<typeof insertMcpServerSchema>;

export function EditServerDialog({
	onSuccess,
	open,
	onOpenChange,
	serverId,
}: EditServerDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [argItems, setArgItems] = useState<ArgumentItem[]>([]);

	const { data: serverResult, isLoading } = useQuery({
		queryKey: ["getMcpServer", serverId],
		queryFn: async () => {
			if (!serverId)
				return { success: false, error: "Server ID does not exist" };
			return await getMcpServerById(serverId);
		},
		enabled: !!serverId && open,
		staleTime: 0,
	});

	const server = serverResult?.success
		? "data" in serverResult
			? serverResult.data
			: null
		: null;
	const serverType =
		(server?.type as (typeof TypeEnum)[keyof typeof TypeEnum]) || TypeEnum.SSE;

	const defaultValues: ServerFormValues = server
		? {
				type: serverType,
				name: server.name,
				description: server.description || "",

				...(serverType === TypeEnum.SSE
					? {
							url: server.url || "",
							headers: server.headers || {},

							command: "",
							args: [],
							env: {},
						}
					: {
							command: server.command || "",
							args: server.args || [],
							env: server.env || {},

							url: "",
							headers: {},
						}),
			}
		: {
				type: TypeEnum.SSE,
				name: "",
				url: "",
				description: "",
				headers: {},
				command: "",
				args: [],
				env: {},
			};

	// Initialize form
	const form = useForm<ServerFormValues>({
		resolver: zodResolver(insertMcpServerSchema) as Resolver<ServerFormValues>,
		defaultValues,
		values: server ? defaultValues : undefined,
	});

	// Initialize argItems when server data loads
	useEffect(() => {
		if (server?.args && server.args.length > 0) {
			setArgItems(
				server.args.map((value) => ({
					id: generateId(),
					value,
				})),
			);
		}
	}, [server]);

	// Update form when argItems change
	const updateFormArgs = (newArgItems: ArgumentItem[]) => {
		setArgItems(newArgItems);
		form.setValue(
			"args",
			newArgItems.map((item) => item.value),
		);
	};

	const handleTypeChange = (type: (typeof TypeEnum)[keyof typeof TypeEnum]) => {
		form.setValue("type", type);
		// Reset argItems when switching to SSE type
		if (type === TypeEnum.SSE) {
			setArgItems([]);
			form.setValue("args", []);
		}
	};

	const onSubmit = async (data: ServerFormValues) => {
		if (!serverId) {
			toast.error("Server ID does not exist");
			return;
		}
		console.log("Submitting form data:", data);
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

			const result = await updateMcpServer(serverId, cleanedData);

			if (result.success) {
				toast.success("Server updated successfully!");
				if (onSuccess) {
					onSuccess();
				}
				onOpenChange(false);
			} else {
				console.error("Failed to update server:", result.error);
				toast.error(result.error || "Failed to update server");
			}
		} catch (error) {
			console.error("Failed to update server:", error);
			toast.error("Failed to update server");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(880px,90vh)] sm:max-w-xl  [&>button:last-child]:top-3.5">
				<DialogHeader className="px-6 py-4 ">
					<DialogTitle>Edit MCP Server</DialogTitle>
					<DialogDescription>
						Modify MCP server configuration to update AI assistant capabilities.
					</DialogDescription>
				</DialogHeader>
				<div className="overflow-y-auto  px-6 py-4 ">
					<DialogDescription asChild>
						{isLoading ? (
							<div className="flex items-center justify-center py-8">
								<IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								<span className="ml-2 text-muted-foreground">Loading...</span>
							</div>
						) : !server ? (
							<div className="flex items-center justify-center py-8 text-muted-foreground">
								Server data not found
							</div>
						) : (
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(
										onSubmit,
										// Add error handling callback to display validation errors
										(errors) => {
											console.error("Form validation errors:", errors);
											toast.error(
												"Please correct the form errors before submitting",
											);
										},
									)}
									className="space-y-6"
								>
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
												? "SSE (Server-Sent Events) connects to MCP server via HTTP."
												: "STDIO connects to local MCP process via standard input/output."}
										</FormDescription>
									</div>

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
														Brief description of this MCP server's functionality
														and purpose
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
												render={() => (
													<FormItem>
														<FormLabel>Command Arguments</FormLabel>
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
																			placeholder={`Argument ${i + 1}`}
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
															Environment variables passed to the MCP server
															process
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
													<IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
													Updating...
												</>
											) : (
												"Update Server"
											)}
										</Button>
									</DialogFooter>
								</form>
							</Form>
						)}
					</DialogDescription>
				</div>
			</DialogContent>
		</Dialog>
	);
}
