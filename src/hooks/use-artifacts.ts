import { useState, useEffect } from "react";
import type { Artifact } from "@/server/db/schema";

// 模拟数据
const mockArtifacts: Artifact[] = [
	{
		id: "artifact-1",
		version: 1,
		createdAt: new Date("2024-01-15"),
		updatedAt: new Date("2024-01-15"),
		title: "React 组件示例",
		content: `import React from 'react';

export function Button({ children, onClick }) {
  return (
    <button 
      className="px-4 py-2 bg-blue-500 text-white rounded"
      onClick={onClick}
    >
      {children}
    </button>
  );
}`,
		kind: "code",
		language: "react",
		userId: "demo-user",
		chatId: "chat-1",
		isPublic: true,
		tags: ["react", "component", "ui"],
		changeDescription: "Initial version",
	},
	{
		id: "artifact-2",
		version: 2,
		createdAt: new Date("2024-01-16"),
		updatedAt: new Date("2024-01-17"),
		title: "用户指南文档",
		content: `# 用户指南

## 介绍
这是一个全面的用户指南，帮助您快速上手我们的产品。

## 功能特性
- 简单易用的界面
- 强大的搜索功能
- 实时协作
- 数据安全保护

## 开始使用
1. 创建账户
2. 配置个人信息
3. 开始您的第一个项目`,
		kind: "text",
		language: null,
		userId: "demo-user",
		chatId: "chat-2",
		isPublic: false,
		tags: ["documentation", "guide"],
		changeDescription: "Updated content and formatting",
	},
	{
		id: "artifact-3",
		version: 1,
		createdAt: new Date("2024-01-18"),
		updatedAt: new Date("2024-01-18"),
		title: "数据分析脚本",
		content: `import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# 读取数据
data = pd.read_csv('data.csv')

# 数据清洗
data_clean = data.dropna()

# 统计分析
summary = data_clean.describe()
print(summary)

# 可视化
plt.figure(figsize=(10, 6))
plt.hist(data_clean['value'], bins=30, alpha=0.7)
plt.title('数据分布图')
plt.xlabel('值')
plt.ylabel('频次')
plt.show()`,
		kind: "code",
		language: "python",
		userId: "demo-user",
		chatId: "chat-3",
		isPublic: true,
		tags: ["python", "data-analysis", "visualization"],
		changeDescription: "Initial version",
	},
	{
		id: "artifact-4",
		version: 1,
		createdAt: new Date("2024-01-19"),
		updatedAt: new Date("2024-01-19"),
		title: "销售数据表格",
		content: `产品名称,销售数量,销售额,日期
iPhone 15,120,120000,2024-01-01
MacBook Pro,80,200000,2024-01-01
iPad Air,150,75000,2024-01-01
Apple Watch,200,80000,2024-01-01
AirPods,300,45000,2024-01-01`,
		kind: "sheet",
		language: null,
		userId: "demo-user",
		chatId: "chat-4",
		isPublic: false,
		tags: ["sales", "data", "excel"],
		changeDescription: "Initial version",
	},
];

interface UseArtifactsOptions {
	searchQuery?: string;
	filters?: {
		kind?: string;
		language?: string;
		isPublic?: string;
		tags?: string[];
	};
}

export function useArtifacts(options: UseArtifactsOptions = {}) {
	const [artifacts, setArtifacts] = useState<Artifact[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setLoading(true);
		
		// 模拟 API 延迟
		const timer = setTimeout(() => {
			let filtered = [...mockArtifacts];

			// 搜索过滤
			if (options.searchQuery?.trim()) {
				const query = options.searchQuery.toLowerCase();
				filtered = filtered.filter(
					(artifact) =>
						artifact.title.toLowerCase().includes(query) ||
						artifact.content.toLowerCase().includes(query) ||
						artifact.tags?.some((tag) => tag.toLowerCase().includes(query))
				);
			}

			// 类型过滤
			if (options.filters?.kind) {
				filtered = filtered.filter((artifact) => artifact.kind === options.filters?.kind);
			}

			// 语言过滤
			if (options.filters?.language) {
				filtered = filtered.filter((artifact) => artifact.language === options.filters?.language);
			}

			// 可见性过滤
			if (options.filters?.isPublic === "true") {
				filtered = filtered.filter((artifact) => artifact.isPublic === true);
			} else if (options.filters?.isPublic === "false") {
				filtered = filtered.filter((artifact) => artifact.isPublic === false);
			}

			setArtifacts(filtered);
			setLoading(false);
		}, 300);

		return () => clearTimeout(timer);
	}, [options.searchQuery, options.filters]);

	return {
		artifacts,
		loading,
		refetch: () => {
			setLoading(true);
			setTimeout(() => {
				setArtifacts([...mockArtifacts]);
				setLoading(false);
			}, 300);
		},
	};
}
