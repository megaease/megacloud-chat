"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApiProvider } from "@/context/api-provider-context";
import { toast } from "sonner";
import type { ApiProvider } from "@/types/api-provider";
import {
	IconCheck,
	IconEdit,
	IconDots,
	IconStar,
	IconTrash,
	IconRefresh,
	IconSearch,
	IconPlus,
	IconBolt,
	IconGlobe,
	IconCpu,
	IconShield,
	IconAlertCircle,
	IconCircleCheck,
	IconClock,
	IconSettings,
	IconCopy,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ProviderForm } from "@/components/provider/provider-form";
import { useQueryClient } from "@tanstack/react-query";
import { getProviderTypeInfo } from "./utils";

export function ProviderManagementModal() {
	const t = useTranslations("Provider");
	const tCommon = useTranslations("Common");
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteConfirmProvider, setDeleteConfirmProvider] = useState<
		string | null
	>(null);
	const [testingProvider, setTestingProvider] = useState<string | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(
		null,
	);

	const {
		// 基础状态
		providers,
		currentProvider,
		isLoading,
		addProvider,
		isProviderModalOpen,
		setProviderModalOpen,
		switchProvider,
		setDefaultProvider,
		deleteProvider,
		testConnection,
		updateProvider,
	} = useApiProvider();

	// 处理设置默认提供商
	const handleSetDefault = async (providerId: string) => {
		try {
			await setDefaultProvider(providerId);
			toast.success(t("defaultProviderSet"));
		} catch (error) {
			toast.error(t("operationFailed"), {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	const handleDelete = async (providerId: string) => {
		try {
			await deleteProvider(providerId);
			setDeleteConfirmProvider(null);
			toast.success(t("providerDeleted"));
		} catch (error) {
			toast.error(t("operationFailed"), {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	// 处理测试连接
	const handleTestConnection = async (provider: ApiProvider) => {
		setTestingProvider(provider.id);
		try {
			const models = await testConnection({
				apiKey: provider.apiKey,
				baseUrl: provider.baseUrl,
				providerType: provider.providerType,
			});

			toast.success(t("connectionTestSuccess"), {
				description: t("modelsFound", { count: models.length }),
			});

			// 更新提供商信息
			await updateProvider(provider.id, {
				availableModels: models,
				lastTestedAt: new Date(),
				lastTestSuccess: true,
			});
		} catch (error) {
			toast.error(t("connectionTestFailed"), {
				description: error instanceof Error ? error.message : "Unknown error",
			});

			// 更新失败状态
			await updateProvider(provider.id, {
				lastTestedAt: new Date(),
				lastTestSuccess: false,
			});
		} finally {
			setTestingProvider(null);
		}
	};

	// 切换提供商
	const handleSwitchProvider = async (providerId: string) => {
		try {
			await switchProvider(providerId);
			toast.success(t("providerSwitched"));
		} catch (error) {
			toast.error(t("operationFailed"), {
				description: error instanceof Error ? error.message : "Unknown error",
			});
		}
	};

	// 复制 API 密钥
	const handleCopyApiKey = (apiKey: string) => {
		navigator.clipboard.writeText(apiKey);
		toast.success(tCommon("copied"));
	};

	// 过滤提供商
	const filteredProviders = useMemo(() => {
		return providers.filter(
			(provider) =>
				provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				provider.providerType.toLowerCase().includes(searchTerm.toLowerCase()),
		);
	}, [providers, searchTerm]);

	// 获取连接状态
	const getConnectionStatus = (provider: ApiProvider) => {
		if (!provider.lastTestedAt) {
			return {
				status: "untested",
				label: t("never"),
				color: "text-muted-foreground",
				icon: IconClock,
			};
		}
		if (provider.lastTestSuccess) {
			return {
				status: "success",
				label: "Connected",
				color: "text-green-600",
				icon: IconCircleCheck,
			};
		}
		return {
			status: "failed",
			label: "Connection failed",
			color: "text-red-600",
			icon: IconAlertCircle,
		};
	};

	if (isLoading) {
		return (
			<Dialog open={isProviderModalOpen} onOpenChange={setProviderModalOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh]">
					<DialogHeader>
						<DialogTitle>{t("manageProviders")}</DialogTitle>
					</DialogHeader>
					<div className="flex items-center justify-center h-64">
						<div className="flex items-center gap-2 text-muted-foreground">
							<IconRefresh className="h-4 w-4 animate-spin" />
							<span>{tCommon("loading")}</span>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<>
			<Dialog open={isProviderModalOpen} onOpenChange={setProviderModalOpen}>
				<DialogContent
					className="max-w-6xl max-h-[90vh] p-0 
					md:min-w-2xl
				"
				>
					<DialogHeader className="p-6 pb-0">
						<div className="flex items-center justify-between">
							<div>
								<DialogTitle className="text-xl">
									{t("manageProviders")}
								</DialogTitle>
								<p className="text-sm text-muted-foreground mt-1">
									Manage your AI service provider configurations and connection
									status
								</p>
							</div>
						</div>
					</DialogHeader>

					<div className="px-6 flex gap-2 items-center">
						<div className="relative flex-1">
							<IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder={t("searchPlaceholder")}
								className="pl-9"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
						<Button
							onClick={() => {
								setEditingProvider(null);
								setIsFormOpen(true);
							}}
							size="sm"
							className="gap-2"
						>
							<IconPlus />
							{t("addProvider")}
						</Button>
					</div>

					<ScrollArea className="h-[calc(100vh-320px)] px-6">
						{filteredProviders.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-12">
								<div className="rounded-full bg-muted p-3 mb-4">
									<IconSettings className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-medium mb-2">
									{providers.length === 0
										? t("noProviders")
										: "No matching providers found"}
								</h3>
								<p className="text-sm text-muted-foreground text-center mb-4">
									{providers.length === 0
										? "Add your first API provider to start using AI features"
										: "Try adjusting your search or add a new provider"}
								</p>
								<Button
									onClick={() => {
										setEditingProvider(null);
										setIsFormOpen(true);
									}}
									variant="outline"
									className="gap-2"
								>
									<IconPlus className="h-4 w-4" />
									{t("addProvider")}
								</Button>
							</div>
						) : (
							<div className="space-y-3 p-1">
								{filteredProviders.map((provider) => {
									const typeInfo = getProviderTypeInfo(provider.providerType);
									const connectionStatus = getConnectionStatus(provider);
									const isCurrentProvider = currentProvider?.id === provider.id;
									const isTesting = testingProvider === provider.id;

									return (
										<div
											key={provider.id}
											className={cn(
												"rounded-lg border p-4 transition-all duration-200 hover:shadow-sm",
												isCurrentProvider &&
													"ring-2 ring-ring ring-offset-2 bg-accent/50",
											)}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0">
													{/* Header Information */}
													<div className="flex items-center gap-3 mb-3">
														<div
															className={cn(
																"flex items-center gap-1.5",
																typeInfo.color,
															)}
														>
															{typeInfo.icon}
															<span className="text-sm font-medium">
																{typeInfo.name}
															</span>
														</div>
														<h3 className="font-semibold text-lg truncate">
															{provider.name}
														</h3>
														<div className="flex items-center gap-2">
															{provider.isDefault ? (
																<Badge variant="secondary" className="gap-1">
																	<IconStar className="h-3 w-3" />
																	Default
																</Badge>
															) : null}
															{isCurrentProvider && (
																<Badge variant="default" className="gap-1">
																	<IconCheck className="h-3 w-3" />
																	In use
																</Badge>
															)}
														</div>
													</div>

													{/* Detailed Information */}
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
														<div>
															<div className="text-muted-foreground block mb-1">
																API Key
															</div>
															<div className="flex items-center gap-2">
																<code className="bg-muted px-2 py-1 rounded text-xs">
																	{provider.apiKey.substring(0, 8)}****
																	{provider.apiKey.substring(
																		provider.apiKey.length - 4,
																	)}
																</code>
																<Button
																	variant="ghost"
																	size="sm"
																	className="h-6 w-6 p-0"
																	onClick={() =>
																		handleCopyApiKey(provider.apiKey)
																	}
																>
																	<IconCopy className="h-3 w-3" />
																</Button>
															</div>
														</div>

														<div>
															<div className="text-muted-foreground block mb-1">
																{t("baseUrl")}
															</div>
															<code className="bg-muted px-2 py-1 rounded text-xs block truncate">
																{provider.baseUrl}
															</code>
														</div>
													</div>

													{/* Available Models */}
													{provider.availableModels &&
														provider.availableModels.length > 0 && (
															<div className="mt-3">
																<div className="text-muted-foreground text-sm block mb-2">
																	{t("availableModels")} (
																	{provider.availableModels.length})
																</div>
																<div className="flex flex-wrap gap-1">
																	{provider.availableModels
																		.slice(0, 6)
																		.map((model) => (
																			<Badge
																				key={model}
																				variant="outline"
																				className="text-xs"
																			>
																				{model}
																			</Badge>
																		))}
																	{provider.availableModels.length > 6 && (
																		<Badge
																			variant="outline"
																			className="text-xs"
																		>
																			+{provider.availableModels.length - 6}{" "}
																			more
																		</Badge>
																	)}
																</div>
															</div>
														)}
												</div>

												{/* Action Menu */}
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															className="h-8 w-8 p-0"
														>
															<IconDots className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-48">
														<DropdownMenuItem
															onClick={() => handleSwitchProvider(provider.id)}
															disabled={isCurrentProvider}
														>
															<IconCheck className="mr-2 h-4 w-4" />
															Use this provider
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleSetDefault(provider.id)}
															disabled={provider.isDefault}
														>
															<IconStar className="mr-2 h-4 w-4" />
															Set as default
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => handleTestConnection(provider)}
															disabled={isTesting}
														>
															<IconRefresh
																className={cn(
																	"mr-2 h-4 w-4",
																	isTesting && "animate-spin",
																)}
															/>
															{isTesting ? "Testing..." : "Test connection"}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => {
																setEditingProvider(provider);
																setIsFormOpen(true);
															}}
														>
															<IconEdit className="mr-2 h-4 w-4" />
															Edit configuration
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() =>
																setDeleteConfirmProvider(provider.id)
															}
															className="text-destructive focus:text-destructive"
														>
															<IconTrash className="mr-2 h-4 w-4" />
															Delete provider
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</ScrollArea>

					<div className="border-t p-4">
						<div className="flex items-center justify-between text-sm text-muted-foreground">
							<span>Total {providers.length} providers</span>
							<span>
								{t("current")}: {currentProvider?.name || "None selected"}
							</span>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteConfirmProvider}
				onOpenChange={(isOpen) => {
					if (!isOpen) setDeleteConfirmProvider(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<IconAlertCircle className="h-5 w-5 text-destructive" />
							{t("deleteConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deleteConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (deleteConfirmProvider) {
									handleDelete(deleteConfirmProvider);
								}
							}}
							className="bg-destructive hover:bg-destructive/90"
						>
							{tCommon("confirm")} {tCommon("delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{/* Add/Edit Provider Form Dialog */}
			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{editingProvider ? t("editProvider") : t("addProvider")}
						</DialogTitle>
					</DialogHeader>
					<ProviderForm
						initialProvider={editingProvider || undefined}
						onSuccess={() => {
							setIsFormOpen(false);
							setEditingProvider(null);
						}}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
