# Megacloud Chat

一个功能丰富的现代化 AI 聊天应用，具备完整的 Model Context Protocol (MCP) 服务器管理和工件系统支持。

*[View English Version](./README.md)*

## ✨ 功能特性

### 🤖 AI 聊天能力

* **多模型支持**：在多个 AI 提供商之间无缝切换，包括 OpenAI、DeepSeek、Anthropic、GLM、OpenRouter 和自定义提供商
* **实时流式对话**：体验流畅的实时对话流，配备打字指示器
* **聊天历史管理**：自动保存和组织对话，支持轻松搜索和检索
* **推理过程显示**：查看 AI 模型的推理过程，更好地理解响应
* **消息编辑**：编辑和重新生成消息，改善对话流程

### 🎨 工件系统

* **动态内容创建**：AI 可以创建和管理各种类型的内容，包括代码、文档和交互式元素
* **版本控制**：跟踪和管理工件的不同版本，支持轻松回滚
* **多种预览类型**：支持代码预览、HTML 渲染、React 组件和文本工件
* **交互式操作**：复制、下载、刷新和全屏查看工件
* **实时更新**：工件创建和修改的实时流式更新

### 🔧 MCP 服务器管理

* **多协议支持**：添加和配置 SSE（服务器发送事件）和 STDIO 类型的 MCP 服务器
* **实时状态监控**：通过视觉指示器跟踪服务器状态（在线、离线、错误、连接中）
* **灵活配置**：自定义服务器设置，包括 URL、命令、环境变量和请求头
* **连接管理**：轻松启动、停止和重新启动服务器操作
* **服务器组织**：编辑、删除和组织多个 MCP 服务器配置

### 🎯 附加功能

* **提供商管理**：统一界面管理多个 AI 提供商，支持 API 密钥和端点配置
* **搜索功能**：在对话和工件中提供强大的搜索能力
* **响应式设计**：完全响应式界面，无缝适应桌面、平板和移动设备
* **深色/浅色主题**：内置主题支持，自动检测系统偏好
* **国际化**：完整的 i18n 支持，提供英文和中文语言选项
* **代码编辑器**：集成代码编辑器，支持多种编程语言语法高亮
* **工具集成**：支持 AI 工具使用和函数调用能力

## 🚀 技术栈

* **框架**：[Next.js 15](https://nextjs.org/) (App Router)
* **语言**：[TypeScript](https://www.typescriptlang.org/)
* **UI**：[React 19](https://reactjs.org/)、[Tailwind CSS 4](https://tailwindcss.com/)、[shadcn/ui](https://ui.shadcn.com/)
* **状态管理**：[TanStack Query](https://tanstack.com/query/latest)
* **表单处理**：[React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
* **数据库**：PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
* **AI 集成**：[AI SDK](https://sdk.vercel.ai/)、多提供商支持
* **开发工具**：[Biome](https://biomejs.dev/)、[PNPM](https://pnpm.io/)

## 🛠️ 本地开发

1. **克隆仓库**：

   ```bash
   git clone <your-repository-url>
   cd megacloud-chat
   ```

2. **安装依赖**：

   ```bash
   pnpm install
   ```

3. **启动本地 PostgreSQL 数据库**：

   可使用项目中的脚本启动 Docker 容器（如果已安装 Docker）：

   ```bash
   ./start-database.sh
   ```

   或手动配置本地 PostgreSQL 实例。

4. **设置环境变量**：

   复制 `.env.example` 为 `.env` 文件，并填入必要的环境变量：

   ```bash
   cp .env.example .env
   ```

   然后编辑 `.env` 文件，配置：
   * 数据库连接字符串 (`DATABASE_URL`)
   * AI 模型 API 密钥

5. **数据库迁移**：

   ```bash
   pnpm db:push
   ```

6. **启动开发服务器**：

   ```bash
   pnpm dev
   ```

   在浏览器中打开 `http://localhost:3000`。

7. **其他有用的命令**：

   * 类型检查：`pnpm typecheck`
   * 代码检查：`pnpm check`
   * 代码自动修复：`pnpm check:write`
   * 数据库管理界面：`pnpm db:studio`

## 📦 部署

支持多种部署方式：

* **Vercel**：推荐用于生产环境，[部署指南](https://create.t3.gg/en/deployment/vercel)
* **Netlify**：提供类似 Vercel 的便捷部署体验，[部署指南](https://create.t3.gg/en/deployment/netlify)
* **Docker**：适合自托管场景，[容器化部署指南](https://create.t3.gg/en/deployment/docker)

## 🤝 贡献

欢迎贡献代码、提出问题或建议。请确保遵循项目的代码风格和提交消息规范。

---
