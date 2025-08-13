"use client";

import { useEffect } from "react";
import { scan } from "react-scan";

export function ReactScanProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		// 只在开发环境中启用 react-scan
		if (process.env.NODE_ENV === "development") {
			scan({
				enabled: true,
				// 可选配置
				log: true, // 在控制台输出日志
				// 可以添加更多配置选项
			});
		}
	}, []);

	return <>{children}</>;
}
