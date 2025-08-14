export interface StreamDelta {
	type: string; // 数据类型标识
	data: unknown; // 实际数据
	transient?: boolean; // 是否为临时数据
}

// 标准数据类型
export const StreamDeltaTypes = {
	ID: "data-id", // 文档 ID
	TITLE: "data-title", // 文档标题
	KIND: "data-kind", // 文档类型 ('text' | 'code' | 'sheet' | 'image')
	LANGUAGE: "data-language", // 语言类型
	CLEAR: "data-clear", // 清空内容信号
	TEXT_DELTA: "data-textDelta", // 文本内容增量
	CODE_DELTA: "data-codeDelta", // 代码内容增量
	SHEET_DELTA: "data-sheetDelta", // 表格内容增量
	IMAGE_DELTA: "data-imageDelta", // 图片数据
	FINISH: "data-finish", // 生成完成信号
} as const;

export type StreamDeltaType =
	(typeof StreamDeltaTypes)[keyof typeof StreamDeltaTypes];

// 添加字符串索引签名以满足 UIDataTypes 约束
declare module "ai" {
	interface UIDataTypes {
		"data-id": StreamDelta;
		"data-title": StreamDelta;
		"data-kind": StreamDelta;
		"data-language": StreamDelta;
		"data-clear": StreamDelta;
		"data-textDelta": StreamDelta;
		"data-codeDelta": StreamDelta;
		"data-sheetDelta": StreamDelta;
		"data-imageDelta": StreamDelta;
		"data-finish": StreamDelta;
	}
}
