"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { IconLoader2, IconCircleCheck, IconCircleX, IconAlertCircle } from "@tabler/icons-react";
import type {} from "@/server/db/schema";

import { toast } from "sonner";
interface MCPConnectionTestProps {
	server: schema.McpServer;
}

export function MCPConnectionTest({ server }: MCPConnectionTestProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [testResult, setTestResult] = useState<"success" | "error" | null>(
		null,
	);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleTestConnection = async () => {
		setIsLoading(true);
		setTestResult(null);
		setErrorMessage(null);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Connection Test</CardTitle>
				<CardDescription>
					Test the connection to your MCP server before saving
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-center py-4">
					{isLoading ? (
						<div className="flex flex-col items-center">
							<IconLoader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="mt-2 text-sm text-muted-foreground">
								Testing connection...
							</p>
						</div>
					) : testResult === "success" ? (
						<div className="flex flex-col items-center">
							<IconCircleCheck className="h-10 w-10 text-green-500" />
							<p className="mt-2 text-sm font-medium text-green-500">
								Connection successful!
							</p>
						</div>
					) : testResult === "error" ? (
						<div className="flex flex-col items-center">
							<IconCircleX className="h-10 w-10 text-red-500" />
							<p className="mt-2 text-sm font-medium text-red-500">
								Connection failed
							</p>
							{errorMessage && (
								<p className="mt-1 text-xs text-muted-foreground">
									{errorMessage}
								</p>
							)}
						</div>
					) : (
						<div className="flex flex-col items-center">
							<IconAlertCircle className="h-10 w-10 text-amber-500" />
							<p className="mt-2 text-sm text-muted-foreground">
								Click the button below to test the connection
							</p>
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter className="flex justify-center">
				<Button
					onClick={handleTestConnection}
					disabled={isLoading}
					variant={testResult === "success" ? "outline" : "default"}
				>
					{isLoading ? (
						<>
							<IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
							Testing...
						</>
					) : testResult === "success" ? (
						"Test Again"
					) : (
						"Test Connection"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
