"use client";

import { useState } from "react";
import { PythonPreview } from "@/components/artifact/previews/PythonPreview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const simpleExamples = [
	{
		id: "basic",
		title: "基础输出",
		code: `print("Hello, Python!")
x = 42
print(f"答案是：{x}")
x`,
	},
	{
		id: "calc",
		title: "简单计算",
		code: `numbers = [1, 2, 3, 4, 5]
total = sum(numbers)
print(f"总和：{total}")
average = total / len(numbers)
print(f"平均值：{average}")
average`,
	},
	{
		id: "string",
		title: "字符串操作",
		code: `text = "Python is great!"
print(text.upper())
print(text.lower())
words = text.split()
print(f"单词数量：{len(words)}")
words`,
	},
];

export default function SimplePythonTestPage() {
	const [selectedExample, setSelectedExample] = useState(simpleExamples[0]);

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold mb-4">Python 代码执行测试</h1>
				<p className="text-muted-foreground">测试 Python 代码执行功能</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 示例选择 */}
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">选择示例</h2>
					{simpleExamples.map((example) => (
						<Button
							key={example.id}
							variant={
								selectedExample?.id === example.id ? "default" : "outline"
							}
							className="w-full justify-start"
							onClick={() => setSelectedExample(example)}
						>
							{example.title}
						</Button>
					))}
				</div>

				{/* Python 执行器 */}
				<div className="lg:col-span-2">
					<Card className="h-[600px]">
						<CardHeader>
							<CardTitle>{selectedExample?.title || "选择一个示例"}</CardTitle>
						</CardHeader>
						<CardContent className="h-full p-0">
							{selectedExample ? (
								<PythonPreview content={selectedExample.code} />
							) : (
								<div className="flex items-center justify-center h-full">
									<p className="text-muted-foreground">
										请选择一个示例开始测试
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
