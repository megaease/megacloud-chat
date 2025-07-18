import { NextResponse } from "next/server";
import { updateMessage, getMessageById } from "@/server/db/queries/messages";
import { z } from "zod";

// Validation schema for message update
const updateMessageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(10000, "Message content is too long"),
  userId: z.string().min(1, "User ID is required"),
});

interface RouteContext {
  params: Promise<{ messageId: string }>;
}

// GET /api/messages/[messageId] - Get message by ID
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { messageId } = await params;
    const userId = request.headers.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const message = await getMessageById(messageId);

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // TODO: Add permission check - ensure user owns the message or has access to the chat
    // For now, we'll skip this check but it should be implemented for security

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

// PATCH /api/messages/[messageId] - Update message content
export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { messageId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateMessageSchema.parse(body);
    const { content, userId } = validatedData;

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // First, check if the message exists
    const existingMessage = await getMessageById(messageId);
    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // TODO: Add permission check - ensure user owns the message
    // For now, we'll allow any user to edit any message, but this should be restricted
    // We should check if the message belongs to a chat that the user has access to
    // and if the message role is 'user' (only user messages should be editable)

    // Basic role check - only allow editing user messages
    if (existingMessage.role !== "user") {
      return NextResponse.json(
        { error: "Only user messages can be edited" },
        { status: 403 }
      );
    }

    // Update the message
    const updatedMessage = await updateMessage(messageId, content, undefined, userId);

    return NextResponse.json({ 
      message: updatedMessage,
      success: true 
    });

  } catch (error) {
    console.error("Error updating message:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    // Handle known errors from updateMessage function
    if (error instanceof Error) {
      if (error.message === "Message not found") {
        return NextResponse.json(
          { error: "Message not found" },
          { status: 404 }
        );
      }
      
      if (error.message === "Message content is required") {
        return NextResponse.json(
          { error: "Message content is required" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[messageId] - Delete message (for future use)
export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { messageId } = await params;
    const userId = request.headers.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // TODO: Implement message deletion
    // This is a placeholder for future message deletion functionality
    return NextResponse.json(
      { error: "Message deletion not implemented yet" },
      { status: 501 }
    );

  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
