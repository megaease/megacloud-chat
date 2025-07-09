"use client";

import { TestCodePreview } from "@/components/artifact/test-code-preview";

export default function TestCodePreviewPage() {
	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">代码预览测试</h1>
			<TestCodePreview />
		</div>
	);
}
