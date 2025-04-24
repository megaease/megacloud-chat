import { db } from "@/server/db";
import { chats } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const userId = request.headers.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 },
			);
		}

		const userChats = await db.query.chats.findMany({
			where: (chats, { eq }) => eq(chats.userId, userId),
			orderBy: [desc(chats.updatedAt)],
		});

		return NextResponse.json({ chats: userChats });
	} catch (error) {
		console.error("获取聊天记录失败：", error);
		return NextResponse.json({ error: "获取聊天记录时出错" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const userId = request.headers.get("userId");

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 },
			);
		}

		const { chatId } = await request.json();

		if (!chatId) {
			return NextResponse.json(
				{ error: "chatId is required" },
				{ status: 400 },
			);
		}

		// 确保只能删除自己的聊天
		const result = await db
			.delete(chats)
			.where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
			.returning({ id: chats.id });

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "聊天不存在或无权删除" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("删除聊天失败：", error);
		return NextResponse.json({ error: "删除聊天时出错" }, { status: 500 });
	}
}
