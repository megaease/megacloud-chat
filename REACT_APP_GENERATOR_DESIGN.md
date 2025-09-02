# React App Generator 设计文档

## 概述
基于现有 artifact 系统，实现一个完整的 Vite React 应用生成器，支持 E2B 沙箱预览功能。

## 系统架构

### 1. 数据存储方案
采用 JSON 压缩存储方案，在现有 artifacts 表的 content 字段中存储多文件结构。

```typescript
interface ReactAppContent {
  type: "react-app";
  files: Array<{
    path: string;
    content: string;
    language?: string;
  }>;
  dependencies?: string[];
  devDependencies?: string[];
  scripts?: Record<string, string>;
  config?: {
    typescript: boolean;
    tailwind: boolean;
    router: boolean;
  };
}
```

### 2. 核心组件

#### 2.1 工具扩展
- 扩展 `create-artifact-tool.ts` 支持 `react-app` 类型
- 创建 `preview-react-app-tool.ts` 用于 E2B 预览

#### 2.2 类型定义扩展
```typescript
// src/lib/artifact-types.ts
export type ArtifactKind = "text" | "code" | "sheet" | "image" | "react-app";

export type ArtifactLanguage =
  | "html"
  | "react"
  | "javascript"
  | "python"
  | "css"
  | "typescript"
  | "json";
```

#### 2.3 前端组件
- 创建 `ReactAppViewer.tsx` 用于显示和预览 React App
- 扩展 `Artifact` 组件支持新的类型

## 实现步骤

### 阶段一：基础功能
1. **类型定义扩展**
   - 修改 `artifact-types.ts` 添加 `react-app` 类型
   - 定义 ReactAppContent 接口

2. **工具实现**
   - 修改 `create-artifact-tool.ts` 支持多文件生成
   - 实现 Vite React 应用模板生成逻辑

3. **数据库支持**
   - 更新 queries 支持 react-app 类型
   - 无需修改表结构

### 阶段二：E2B 预览
1. **安装 E2B SDK**
   ```bash
   npm install @e2b/sdk
   ```

2. **创建预览工具**
   - 实现 `preview-react-app-tool.ts`
   - 集成 E2B 沙箱管理

3. **预览功能**
   - 在沙箱中创建项目文件
   - 安装依赖并启动开发服务器
   - 返回预览 URL

### 阶段三：前端界面
1. **React App 查看器**
   - 文件树显示
   - 代码编辑器
   - 预览面板

2. **交互功能**
   - 下载项目
   - 实时预览
   - 编辑更新

## API 设计

### 1. 创建 React App
```typescript
// 通过现有 chat API 使用工具
{
  type: "tool_call",
  tool: "createArtifactTool",
  params: {
    kind: "react-app",
    title: "My App",
    language: "react",
    // 其他配置...
  }
}
```

### 2. 预览 React App
```typescript
{
  type: "tool_call",
  tool: "previewReactAppTool",
  params: {
    artifactId: "xxx",
    // 预览配置...
  }
}
```

## 文件结构
```
src/
├── lib/ai/tools/
│   ├── create-artifact-tool.ts      // 扩展支持 react-app
│   └── preview-react-app-tool.ts    // 新增预览工具
├── components/
│   ├── artifact/
│   │   ├── Artifact.tsx             // 扩展支持新类型
│   │   └── ReactAppViewer.tsx       // 新增 React App 查看器
│   └── code-editor/                 // 复用代码编辑器
└── lib/
    ├── artifact-types.ts            // 扩展类型定义
    └── e2b-utils.ts                 // E2B 工具函数
```

## 技术要点

### 1. 代码生成策略
- 使用 AI 生成完整的项目文件结构
- 包含 package.json、tsconfig.json、vite.config.ts
- 支持可选的 Tailwind CSS、React Router

### 2. E2B 沙箱管理
- 创建 Node.js 环境沙箱
- 文件系统操作
- 进程管理（npm install, npm run dev）
- 预览 URL 获取和生命周期管理

### 3. 性能考虑
- 大文件使用压缩存储
- 沙箱实例复用
- 预览超时处理

## 安全考虑
- E2B API Key 安全存储
- 沙箱资源限制
- 文件内容校验

## 扩展性
- 支持其他框架（Vue, Svelte）
- 支持部署功能
- 支持模板系统