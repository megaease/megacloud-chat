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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	ConnectionTypeEnum,
	type NewMcpServer,
	type McpServer,
	insertMcpServerSchema,
	ServerStatusEnum,
	type ConnectionType,
} from "@/server/db/schema";
// import {
// 	createMcpServer,
// } from "@/lib/actions/mcp-server-actions";
import { toast } from "sonner";
import { ScrollArea } from "../ui/scroll-area";
import { MCPConnectionTest } from "@/components/mcp/mcp-connection-test";

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

	const form = useForm<NewMcpServer>({
		resolver: zodResolver(insertMcpServerSchema),
		defaultValues: {
			name: "",
			connectionType: ConnectionTypeEnum.SSE,
			url: "",
			command: "",
			description: "",
		},
	});

	const connectionType = form.watch("connectionType");
	const formValues = form.watch();

	const resetForm = () => {
		form.reset({
			name: "",
			connectionType: ConnectionTypeEnum.SSE,
			url: "",
			command: "",
			description: "",
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
	}

	// Create a temporary server object for connection testing
	const tempServer: McpServer = {
		id: -1, // Temporary ID
		name: formValues.name,
		connectionType: formValues.connectionType as ConnectionType,
		url: formValues.url || null,
		command: formValues.command || null,
		status: ServerStatusEnum.OFFLINE,
		description: formValues.description || null,
		createdAt: new Date(),
		updatedAt: new Date(),
		lastConnected: null,
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

							<FormField
								control={form.control}
								name="connectionType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>连接方式</FormLabel>
										<Tabs
											defaultValue={field.value}
											className="w-full"
											onValueChange={field.onChange}
										>
											<TabsList className="grid w-full grid-cols-2">
												<TabsTrigger value={ConnectionTypeEnum.SSE}>
													SSE
												</TabsTrigger>
												<TabsTrigger value={ConnectionTypeEnum.STDIO}>
													STDIO
												</TabsTrigger>
											</TabsList>
											<TabsContent
												value={ConnectionTypeEnum.SSE}
												className="mt-4"
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
											</TabsContent>
											<TabsContent
												value={ConnectionTypeEnum.STDIO}
												className="mt-4"
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
																/>
															</FormControl>
															<FormDescription>
																启动 MCP 服务器的命令 (Standard IO)
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
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{showConnectionTest && (
								<div className="mt-6">
									<MCPConnectionTest server={tempServer} />
								</div>
							)}

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
