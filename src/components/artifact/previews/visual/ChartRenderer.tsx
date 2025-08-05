"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, AlertCircle, TrendingUp } from "lucide-react";
import {
	AreaChart,
	Area,
	BarChart,
	Bar,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer
} from "recharts";
import type { VisualState } from "../VisualPreview";

interface ChartRendererProps {
	content: string;
	visualState: VisualState;
	updateVisualState: (updates: Partial<VisualState>) => void;
}

interface ChartData {
	type: "area" | "bar" | "line" | "pie";
	data: any[];
	config?: {
		xKey?: string;
		yKey?: string;
		colors?: string[];
		title?: string;
	};
}

// 默认颜色方案
const DEFAULT_COLORS = [
	"#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00",
	"#ff00ff", "#00ffff", "#ffff00", "#ff0000", "#0000ff"
];

export function ChartRenderer({ content, visualState, updateVisualState }: ChartRendererProps) {
	// 解析图表数据
	const chartData = useMemo((): ChartData | null => {
		try {
			const parsed = JSON.parse(content);
			
			// 检查数据格式
			if (!parsed || (!parsed.data && !parsed.datasets && !parsed.series)) {
				return null;
			}

			// 转换不同格式的数据
			let processedData: any[] = [];
			let chartType: ChartData["type"] = "bar";
			let config: ChartData["config"] = {};

			if (parsed.data) {
				// 简单数据格式：{ data: [...], type: "...", ... }
				processedData = Array.isArray(parsed.data) ? parsed.data : [];
				chartType = parsed.type || "bar";
				config = {
					xKey: parsed.xKey || "name",
					yKey: parsed.yKey || "value",
					colors: parsed.colors || DEFAULT_COLORS,
					title: parsed.title
				};
			} else if (parsed.datasets) {
				// Chart.js 格式：{ datasets: [...], labels: [...] }
				const labels = parsed.labels || [];
				const dataset = parsed.datasets[0] || {};
				
				processedData = labels.map((label: string, index: number) => ({
					name: label,
					value: dataset.data?.[index] || 0
				}));
				
				chartType = dataset.type || parsed.type || "bar";
				config = {
					xKey: "name",
					yKey: "value",
					colors: dataset.backgroundColor || DEFAULT_COLORS,
					title: parsed.title || dataset.label
				};
			} else if (parsed.series) {
				// 其他格式：{ series: [...] }
				const series = parsed.series[0] || {};
				processedData = Array.isArray(series.data) ? series.data : [];
				chartType = series.type || parsed.type || "bar";
				config = {
					xKey: parsed.xKey || "name",
					yKey: parsed.yKey || "value",
					colors: series.colors || DEFAULT_COLORS,
					title: parsed.title || series.name
				};
			}

			// 确保数据格式正确
			if (!Array.isArray(processedData) || processedData.length === 0) {
				return null;
			}

			return {
				type: chartType,
				data: processedData,
				config
			};
		} catch (error) {
			console.error("Chart data parsing failed:", error);
			return null;
		}
	}, [content]);

	// 如果解析失败，显示错误状态
	if (!chartData) {
		return (
			<motion.div
				className="flex flex-col items-center justify-center p-8 text-center space-y-4"
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
			>
				<div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center">
					<AlertCircle className="w-8 h-8 text-red-500" />
				</div>
				<div className="space-y-2">
					<h3 className="text-lg font-semibold text-foreground">
						图表数据无效
					</h3>
					<p className="text-sm text-muted-foreground max-w-md">
						无法解析提供的图表数据。请确保数据格式正确，包含有效的 data、datasets 或 series 字段。
					</p>
				</div>
			</motion.div>
		);
	}

	// 渲染不同类型的图表
	const renderChart = () => {
		const { type, data, config } = chartData;
		const { xKey = "name", yKey = "value", colors = DEFAULT_COLORS } = config || {};

		switch (type) {
			case "area":
				return (
					<AreaChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey={xKey} />
						<YAxis />
						<Tooltip />
						<Legend />
						<Area
							type="monotone"
							dataKey={yKey}
							stroke={colors[0]}
							fill={colors[0]}
							fillOpacity={0.6}
						/>
					</AreaChart>
				);

			case "line":
				return (
					<LineChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey={xKey} />
						<YAxis />
						<Tooltip />
						<Legend />
						<Line
							type="monotone"
							dataKey={yKey}
							stroke={colors[0]}
							strokeWidth={2}
						/>
					</LineChart>
				);

			case "pie":
				return (
					<PieChart>
						<Pie
							data={data}
							dataKey={yKey}
							nameKey={xKey}
							cx="50%"
							cy="50%"
							outerRadius={80}
							label
						>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={colors[index % colors.length]}
								/>
							))}
						</Pie>
						<Tooltip />
						<Legend />
					</PieChart>
				);

			case "bar":
			default:
				return (
					<BarChart data={data}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey={xKey} />
						<YAxis />
						<Tooltip />
						<Legend />
						<Bar
							dataKey={yKey}
							fill={colors[0]}
						/>
					</BarChart>
				);
		}
	};

	return (
		<motion.div
			className="w-full h-full flex flex-col p-4"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.5, ease: "easeOut" }}
		>
			{/* 图表标题 */}
			{chartData.config?.title && (
				<motion.div
					className="mb-4 text-center flex-shrink-0"
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
				>
					<h3 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
						<TrendingUp className="w-5 h-5" />
						{chartData.config.title}
					</h3>
				</motion.div>
			)}

			{/* 图表容器 */}
			<motion.div
				className="flex-1 min-h-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg p-4"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.3 }}
			>
				<ResponsiveContainer width="100%" height="100%">
					{renderChart()}
				</ResponsiveContainer>
			</motion.div>

			{/* 图表信息 */}
			<motion.div
				className="mt-3 text-center text-sm text-muted-foreground flex-shrink-0"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5 }}
			>
				<span className="inline-flex items-center gap-1">
					<BarChart3 className="w-4 h-4" />
					{chartData.type.toUpperCase()} 图表 • {chartData.data.length} 数据点
				</span>
			</motion.div>
		</motion.div>
	);
}
