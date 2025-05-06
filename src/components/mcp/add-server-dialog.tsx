"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	TypeEnum,
	type NewMcpServer,
	type McpServer,
	insertMcpServerSchema,
	ServerStatusEnum,
	type Type,
} from "@/server/db/schema";
// import {
// 	createMcpServer,
// } from "@/lib/actions/mcp-server-actions";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { MCPConnectionTest } from "@/components/mcp/mcp-connection-test";
import { KeyValuePairInput } from "./key-value-pair-input";

interface AddServerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function AddServerDialog({
	open,
	onOpenChange,
	onSuccess,
}: AddServerDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConnectionTest, setShowConnectionTest] = useState(false);

	// 创建表单，适配 schema
	const form = useForm<NewMcpServer>({
		resolver: zodResolver(insertMcpServerSchema),
		defaultValues: {
			name: "",
			type: TypeEnum.SSE,
			url: "",
			command: "",
			description: "",
			headers: {}, // 空对象而非字符串
			args: {}, // 空对象而非字符串
			env: {}, // 空对象而非字符串
		},
	});

	const type = form.watch("type");
	const formValues = form.watch();

	const resetForm = () => {
		form.reset({
			name: "",
			type: TypeEnum.SSE,
			url: "",
			command: "",
			description: "",
			headers: {}, // 空对象而非字符串
			args: {}, // 空对象而非字符串
			env: {}, // 空对象而非字符串
		});
		setShowConnectionTest(false);
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			resetForm();
		}
		onOpenChange(open);
	};

	const handleTestConnection = async () => {
		const isValid = await form.trigger();
		if (isValid) {
			setShowConnectionTest(true);
		}
	};

	async function onSubmit(data: NewMcpServer) {
		setIsSubmitting(true);
		try {
			// 表单已经通过 zodResolver 验证，值应该已经是正确的格式
			console.log("Submitting data:", data);
			// 实际提交逻辑：
			// await createMcpServer(data);
			// toast.success("服务器添加成功！");
			// onSuccess?.();
			// handleOpenChange(false);
			toast.info("提交功能尚未实现。");
		} catch (error) {
			console.error("添加服务器失败：", error);
			toast.error("添加服务器失败，请检查详细信息。");
		} finally {
			setIsSubmitting(false);
		}
	}

	// 创建用于测试连接的临时服务器对象
	const tempServer: McpServer = {
		id: -1,
		name: formValues.name,
		type: formValues.type as Type,
		url: formValues.url || null,
		command: formValues.command || null,
		status: ServerStatusEnum.OFFLINE,
		description: formValues.description || null,
		createdAt: new Date(),
		updatedAt: new Date(),
		lastConnected: null,
		headers: formValues.headers || {},
		args: formValues.args || {},
		env: formValues.env || {},
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[500px] px-0">
				<DialogHeader className="px-6">
					<DialogTitle>添加 MCP 服务器</DialogTitle>
					<DialogDescription>
						连接到新的 MCP 服务器以增强 AI 聊天框的功能。
					</DialogDescription>
				</DialogHeader>
				<ScrollArea className="overflow-auto max-h-[80vh] px-6">
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-5 py-4"
						>
							{/* 服务器名称字段 */}
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>服务器名称</FormLabel>
										<FormControl>
											<Input placeholder="我的 MCP 服务器" {...field} />
										</FormControl>
										<FormDescription>
											用于标识此服务器的友好名称
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* 连接方式选择和条件字段 */}
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>连接方式</FormLabel>
										<Tabs
											value={field.value}
											className="w-full"
											onValueChange={(value) => {
												field.onChange(value);
												// 切换类型时重置不相关的字段
												if (value === TypeEnum.SSE) {
													form.setValue("command", "");
													form.setValue("args", {});
												} else if (value === TypeEnum.STDIO) {
													form.setValue("url", "");
													form.setValue("headers", {});
												}
											}}
										>
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value={TypeEnum.SSE}>SSE</TabsTrigger>
												<TabsTrigger value={TypeEnum.STDIO}>STDIO</TabsTrigger>
											</TabsList>

											{/* SSE 表单内容 */}
											<TabsContent
												value={TypeEnum.SSE}
												className="mt-4 space-y-4"
											>
												<FormField
													control={form.control}
													name="url"
													render={({ field }) => (
														<FormItem>
															<FormLabel>服务器 URL</FormLabel>
															<FormControl>
																<Input
																	placeholder="https://mcp.example.com/sse"
																	{...field}
																	value={field.value || ""}
																/>
															</FormControl>
															<FormDescription>
																MCP 服务器的 URL 端点 (Server-Sent Events)
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>

												{/* Headers 键值对输入 */}
												<FormField
													control={form.control}
													name="headers"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Headers</FormLabel>
															<FormControl>
																<KeyValuePairInput
																	pairs={field.value}
																	onChange={field.onChange}
																	keyPlaceholder="Header 名称"
																	valuePlaceholder="Header 值"
																/>
															</FormControl>
															<FormDescription>
																要发送到 SSE 端点的 HTTP Headers
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>

												{/* 环境变量键值对输入 */}
												<FormField
													control={form.control}
													name="env"
													render={({ field }) => (
														<FormItem>
															<FormLabel>环境变量</FormLabel>
															<FormControl>
																<KeyValuePairInput
																	pairs={field.value}
																	onChange={field.onChange}
																	keyPlaceholder="变量名"
																	valuePlaceholder="变量值"
																/>
															</FormControl>
															<FormDescription>
																与 SSE 连接相关的环境变量
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
											</TabsContent>

											{/* STDIO 表单内容 */}
											<TabsContent
												value={TypeEnum.STDIO}
												className="mt-4 space-y-4"
											>
												<FormField
													control={form.control}
													name="command"
													render={({ field }) => (
														<FormItem>
															<FormLabel>命令</FormLabel>
															<FormControl>
																<Input
																	placeholder="npx -y @example/mcp-server"
																	{...field}
																	value={field.value || ""}
																/>
															</FormControl>
															<FormDescription>
																启动 MCP 服务器的命令 (Standard IO)
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>

												{/* 参数键值对输入 */}
												<FormField
													control={form.control}
													name="args"
													render={({ field }) => (
														<FormItem>
															<FormLabel>参数</FormLabel>
															<FormControl>
																<KeyValuePairInput
																	pairs={field.value}
																	onChange={field.onChange}
																	keyPlaceholder="参数名"
																	valuePlaceholder="参数值"
																/>
															</FormControl>
															<FormDescription>
																传递给命令的参数
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>

												{/* 环境变量键值对输入 */}
												<FormField
													control={form.control}
													name="env"
													render={({ field }) => (
														<FormItem>
															<FormLabel>环境变量</FormLabel>
															<FormControl>
																<KeyValuePairInput
																	pairs={field.value}
																	onChange={field.onChange}
																	keyPlaceholder="变量名"
																	valuePlaceholder="变量值"
																/>
															</FormControl>
															<FormDescription>
																为命令设置的环境变量
															</FormDescription>
															<FormMessage />
														</FormItem>
													)}
												/>
											</TabsContent>
										</Tabs>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* 描述字段 */}
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>描述 (可选)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="关于此 MCP 服务器的简要描述"
												className="resize-none"
												{...field}
												value={field.value || ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* 连接测试 */}
							{showConnectionTest && (
								<div className="mt-6">
									<MCPConnectionTest server={tempServer} />
								</div>
							)}

							{/* 底部按钮 */}
							<DialogFooter className="pt-4">
								<div className="flex gap-2 w-full justify-between sm:justify-end">
									<Button
										type="button"
										variant="outline"
										onClick={() => handleOpenChange(false)}
									>
										取消
									</Button>
									<Button
										type="button"
										variant="secondary"
										onClick={handleTestConnection}
									>
										测试连接
									</Button>
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												添加中...
											</>
										) : (
											"添加服务器"
										)}
									</Button>
								</div>
							</DialogFooter>
						</form>
					</Form>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
