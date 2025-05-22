# Megacloud MCP Client

这是一个现代化的前端应用程序，用于与 AI 聊天交互和管理 Model Context Protocol (MCP) 服务器。

*[View English Version](./README.md)*

## ✨ 功能特性

* **AI 智能聊天界面**：与 AI 模型进行流畅的交互式对话，支持 DeepSeek 等模型。
* **聊天历史记录**：自动保存和方便浏览过去的对话内容，轻松回顾和继续之前的交流。
* **MCP 服务器管理**：
  * 添加和配置 SSE 或 STDIO 类型的 MCP 服务器
  * 实时监控服务器状态（在线、离线、错误、连接中）
  * 启动/停止服务器运行
  * 自定义服务器配置（URL、命令、环境变量、请求头等）
  * 编辑或删除已有服务器
* **响应式设计**：自适应不同设备和屏幕尺寸，提供一致的用户体验。

## 🚀 技术栈

* **框架**：[Next.js 15](https://nextjs.org/) (App Router)
* **语言**：[TypeScript](https://www.typescriptlang.org/)
* **UI**：
  * [React 19](https://reactjs.org/)
  * [Tailwind CSS 4](https://tailwindcss.com/)
  * [shadcn/ui](https://ui.shadcn.com/) (基于 Radix UI)
* **状态管理/数据获取**：[TanStack Query](https://tanstack.com/query/latest)
* **表单处理**：[React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
* **数据库与 ORM**：
  * PostgreSQL
  * [Drizzle ORM](https://orm.drizzle.team/)
* **AI 集成**：
  * [AI SDK](https://sdk.vercel.ai/)
  * [DeepSeek 集成](https://www.deepseek.com/)
* **开发工具**：
  * [Biome](https://biomejs.dev/) (代码格式化和检查)
  * [PNPM](https://pnpm.io/) (包管理器)

## 🛠️ 本地开发

1. **克隆仓库**：

   ```bash
   git clone <your-repository-url>
   cd megacloud-mcp-client
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

## 📝 开发笔记

项目使用 T3 Stack 生态系统，遵循现代 React 和 Next.js 最佳实践。确保在开发过程中：

1. 仅在服务器组件中进行数据库操作
2. 使用 TanStack Query 进行客户端数据管理
3. 使用正确的环境变量模式（参考 `src/env.js`）
4. 遵循类型安全的开发实践

## 🤝 贡献

欢迎贡献代码、提出问题或建议。请确保遵循项目的代码风格和提交消息规范。

---
