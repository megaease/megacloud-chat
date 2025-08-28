"use server";

import { getMCPConnectionManager } from "@/lib/mcp-connection-manager";
import { db } from "@/server/db";
import {
	type McpServerUpdate,
	type ServerStatus,
	ServerStatusEnum,
	insertMcpServerSchema,
	mcpServers,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { z } from "zod";

// Create a new MCP server
export async function createMcpServer(
	data: z.infer<typeof insertMcpServerSchema>,
) {
	try {
		// Validate the data
		const validatedData = insertMcpServerSchema.parse(data);

		// Check if a server with the same name already exists
		const [existingServer] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.name, validatedData.name));

		if (existingServer) {
			return {
				success: false,
				error: `A server with the name "${validatedData.name}" already exists. Please choose a different name.`,
			};
		}

		// Insert the new server with OFFLINE status initially
		const [newServer] = await db
			.insert(mcpServers)
			.values({ ...validatedData, status: ServerStatusEnum.OFFLINE })
			.returning();

		if (!newServer) {
			return { success: false, error: "Failed to create server record" };
		}

		// Try to start the MCP server
		console.log("Starting MCP server:", newServer.name);
		const mcpConnectionManager = getMCPConnectionManager();
		const startResult = await mcpConnectionManager.startServer(newServer);

		if (startResult.success) {
			// Update status to ONLINE if successful
			const [updatedServer] = await db
				.update(mcpServers)
				.set({
					status: ServerStatusEnum.ONLINE,
					lastConnected: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(mcpServers.id, newServer.id))
				.returning();

			if (updatedServer) {
				console.log("MCP server started successfully:", updatedServer.name);
			}

			// Revalidate the path to update the UI
			revalidatePath("/");

			return { success: true, data: updatedServer || newServer };
		}

		// Keep server in database but mark as OFFLINE
		console.error("Failed to start MCP server:", startResult.error);

		// Revalidate the path to update the UI
		revalidatePath("/");

		return {
			success: false,
			error: `Server created but failed to start: ${startResult.error}`,
			data: newServer, // Still return the server data
		};
	} catch (error: unknown) {
		console.error("Failed to create MCP server:", error);

		// Handle validation errors
		if (
			error &&
			typeof error === "object" &&
			"name" in error &&
			error.name === "ZodError"
		) {
			return {
				success: false,
				error: "Validation error",
				details: "errors" in error ? error.errors : undefined,
			};
		}

		return { success: false, error: "Failed to create MCP server" };
	}
}

// Get all MCP servers
export async function getMcpServers() {
	try {
		const servers = await db
			.select()
			.from(mcpServers)
			.orderBy(mcpServers.createdAt);
		return { success: true, data: servers };
	} catch (error) {
		console.error("Failed to fetch MCP servers:", error);
		return { success: false, error: "Failed to fetch MCP servers" };
	}
}

// Get a specific MCP server by ID
export async function getMcpServerById(id: number) {
	try {
		const [server] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!server) {
			return { success: false, error: "MCP server not found" };
		}

		return { success: true, data: server };
	} catch (error) {
		console.error("Failed to fetch MCP server:", error);
		return { success: false, error: "Failed to fetch MCP server" };
	}
}

// Update a specific MCP server by ID
export async function updateMcpServer(
	id: number,
	data: McpServerUpdate & { status?: ServerStatus },
) {
	try {
		// Check if server exists
		const [existingServer] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!existingServer) {
			return { success: false, error: "MCP server not found" };
		}

		// If name is being updated, check for uniqueness
		if (data.name && data.name !== existingServer.name) {
			const [serverWithSameName] = await db
				.select()
				.from(mcpServers)
				.where(eq(mcpServers.name, data.name));

			if (serverWithSameName) {
				return {
					success: false,
					error: `A server with the name "${data.name}" already exists. Please choose a different name.`,
				};
			}
		}

		// Update the server with the new data
		const [updatedServer] = await db
			.update(mcpServers)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(mcpServers.id, id))
			.returning();

		if (!updatedServer) {
			return { success: false, error: "Failed to update server" };
		}

		// If status changed to ONLINE, try to start the server
		if (
			data.status === ServerStatusEnum.ONLINE &&
			existingServer.status !== ServerStatusEnum.ONLINE
		) {
			console.log("Starting MCP server:", updatedServer.name);
			const mcpConnectionManager = getMCPConnectionManager();
			const startResult = await mcpConnectionManager.startServer(updatedServer);

			if (!startResult.success) {
				// Revert status to OFFLINE if start failed
				await db
					.update(mcpServers)
					.set({ status: ServerStatusEnum.OFFLINE, updatedAt: new Date() })
					.where(eq(mcpServers.id, id));

				return {
					success: false,
					error: `Failed to start MCP server: ${startResult.error}`,
				};
			}

			// Update lastConnected timestamp
			await db
				.update(mcpServers)
				.set({ lastConnected: new Date(), updatedAt: new Date() })
				.where(eq(mcpServers.id, id));
		}

		// If status changed to OFFLINE, stop the server
		if (
			data.status === ServerStatusEnum.OFFLINE &&
			existingServer.status === ServerStatusEnum.ONLINE
		) {
			console.log("Stopping MCP server:", updatedServer.name);
			const mcpConnectionManager = getMCPConnectionManager();
			await mcpConnectionManager.stopServer(id);
		}

		// Revalidate the path to update the UI
		revalidatePath("/");

		return { success: true, data: updatedServer };
	} catch (error) {
		console.error("Failed to update MCP server:", error);
		return { success: false, error: "Failed to update MCP server" };
	}
}

// Delete a specific MCP server by ID
export async function deleteMcpServer(id: number) {
	try {
		// Check if server exists
		const [existingServer] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!existingServer) {
			return { success: false, error: "MCP server not found" };
		}

		// Stop the server if it's running
		if (existingServer.status === ServerStatusEnum.ONLINE) {
			console.log("Stopping MCP server before deletion:", existingServer.name);
			const mcpConnectionManager = getMCPConnectionManager();
			await mcpConnectionManager.stopServer(id);
		}

		// Delete the server
		await db.delete(mcpServers).where(eq(mcpServers.id, id));

		// Revalidate the path to update the UI
		revalidatePath("/");

		return { success: true };
	} catch (error) {
		console.error("Failed to delete MCP server:", error);
		return { success: false, error: "Failed to delete MCP server" };
	}
}

// Update server status
export async function updateMcpServerStatus(id: number, status: ServerStatus) {
	try {
		// Check if server exists
		const [existingServer] = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.id, id));

		if (!existingServer) {
			return { success: false, error: "MCP server not found" };
		}

		// Update data object
		const updateData: Record<string, unknown> = {
			status,
			updatedAt: new Date(),
		};

		// If the status is changing to online, update the lastConnected timestamp
		if (status === ServerStatusEnum.ONLINE) {
			updateData.lastConnected = new Date();
		}

		// Update the server with the new status
		const [updatedServer] = await db
			.update(mcpServers)
			.set(updateData)
			.where(eq(mcpServers.id, id))
			.returning();

		// Note: revalidatePath is removed from here to avoid render-time issues
		// UI updates should be handled by the calling component

		return { success: true, data: updatedServer };
	} catch (error) {
		console.error("Failed to update MCP server status:", error);
		return { success: false, error: "Failed to update MCP server status" };
	}
}

export async function getActiveMcpServers() {
	try {
		const servers = await db
			.select()
			.from(mcpServers)
			.where(eq(mcpServers.status, ServerStatusEnum.ONLINE));

		return { success: true, data: servers };
	} catch (error) {
		console.error("Error fetching active MCP servers:", error);
		return { success: false, error: "Failed to fetch active MCP servers" };
	}
}
