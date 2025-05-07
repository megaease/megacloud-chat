"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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

// SSE 服务器默认值
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
	const [serverType, setServerType] = useState<
		(typeof TypeEnum)[keyof typeof TypeEnum]
	>(TypeEnum.SSE);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// 使用类型断言解决复杂联合类型与表单库的兼容性问题
	const form = useForm<ServerFormValues>({
		resolver: zodResolver(insertMcpServerSchema) as any,
		defaultValues:
			serverType === TypeEnum.SSE ? defaultSseValues : defaultStdioValues,
	});

	// 当服务器类型变化时重置表单
	useEffect(() => {
		if (form.formState.isDirty) {
			// 只有当表单已经被编辑过时才提示用户
			const shouldReset =
				serverType === TypeEnum.SSE
					? form.getValues("type") !== TypeEnum.SSE
					: form.getValues("type") !== TypeEnum.STDIO;

			if (shouldReset) {
				form.reset(
					serverType === TypeEnum.SSE ? defaultSseValues : defaultStdioValues,
				);
			}
		}
	}, [serverType, form]);

	// 处理表单提交
	const onSubmit = async (data: ServerFormValues) => {
		setIsSubmitting(true);

		try {
			const result = await createMcpServer(data);

			if (result.success) {
				toast.success("服务器添加成功！");
				form.reset();
				onOpenChange(false);
			} else {
				toast.error(result.error || "添加服务器失败");
			}
		} catch (error) {
			console.error("添加服务器失败：", error);
			toast.error("添加服务器失败");
		} finally {
			setIsSubmitting(false);
		}
	};

	// 切换服务器类型
	const handleTypeChange = (type: (typeof TypeEnum)[keyof typeof TypeEnum]) => {
		setServerType(type);
		form.setValue("type", type);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<div className="w-full px-4 py-2">
					<Button className="w-full">
						<Plus className="mr-2 h-4 w-4" />
						添加服务器
					</Button>
				</div>
			</DialogTrigger>
			<DialogContent className="flex flex-col gap-0 p-0 sm:max-h-[min(880px,90vh)] sm:max-w-xl  [&>button:last-child]:top-3.5">
				<DialogHeader className="px-6 py-4">
					<DialogTitle>添加 MCP 服务器</DialogTitle>
					<DialogDescription>
						添加一个新的 MCP 服务器以扩展 AI 助手的能力。
					</DialogDescription>
				</DialogHeader>

				<div className="overflow-y-auto  px-6 py-4">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* 服务器类型选择 */}
							<div className="space-y-2">
								<FormLabel>服务器类型</FormLabel>
								<Tabs
									value={serverType}
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
									{serverType === TypeEnum.SSE
										? "SSE (Server-Sent Events) 连接通过 HTTP 与 MCP 服务器通信。"
										: "STDIO 连接通过标准输入/输出与本地 MCP 进程通信。"}
								</FormDescription>
							</div>

							{/* 基本信息 */}
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>名称</FormLabel>
											<FormControl>
												<Input placeholder="MCP 服务器名称" {...field} />
											</FormControl>
											<FormDescription>服务器的显示名称</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>描述</FormLabel>
											<FormControl>
												<Textarea
													placeholder="服务器描述（可选）"
													className="resize-none"
													{...field}
													value={field.value || ""}
												/>
											</FormControl>
											<FormDescription>
												简要描述此 MCP 服务器的功能和用途
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							{/* SSE 特定字段 */}
							{serverType === TypeEnum.SSE && (
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
													MCP 服务器的 SSE 端点 URL
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
												<FormLabel>HTTP 头</FormLabel>
												<FormControl>
													<KeyValueEditor
														keyPlaceholder="Header 名称"
														valuePlaceholder="Header 值"
														value={field.value || {}}
														onChange={field.onChange}
													/>
												</FormControl>
												<FormDescription>
													发送到 MCP 服务器的自定义 HTTP 头
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							)}

							{/* STDIO 特定字段 */}
							{serverType === TypeEnum.STDIO && (
								<div className="space-y-4">
									<FormField
										control={form.control}
										name="command"
										render={({ field }) => (
											<FormItem>
												<FormLabel>命令</FormLabel>
												<FormControl>
													<Input
														placeholder="python mcp_server.py"
														{...field}
													/>
												</FormControl>
												<FormDescription>启动 MCP 服务器的命令</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="args"
										render={({ field }) => (
											<FormItem>
												<FormLabel>命令行参数</FormLabel>
												<FormControl>
													<div className="space-y-2">
														{field.value?.map((arg, i) => (
															<div
																key={`arg-${i}-${arg}`}
																className="flex items-center gap-2"
															>
																<Input
																	value={arg}
																	onChange={(e) => {
																		const newArgs = [...(field.value || [])];
																		newArgs[i] = e.target.value;
																		field.onChange(newArgs);
																	}}
																	placeholder={`参数 ${i + 1}`}
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
															添加参数
														</Button>
													</div>
												</FormControl>
												<FormDescription>传递给命令的参数列表</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="env"
										render={({ field }) => (
											<FormItem>
												<FormLabel>环境变量</FormLabel>
												<FormControl>
													<KeyValueEditor
														keyPlaceholder="变量名"
														valuePlaceholder="变量值"
														value={field.value || {}}
														onChange={field.onChange}
													/>
												</FormControl>
												<FormDescription>
													传递给 MCP 服务器进程的环境变量
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
									取消
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
							</DialogFooter>
						</form>
					</Form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
