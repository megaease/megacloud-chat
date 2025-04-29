# Megacloud MCP Client

这是一个用于与 Megacloud 服务交互的前端应用程序，提供了聊天界面和 MCP 服务器管理功能。

## ✨ 功能特性

* **智能聊天界面：** 与 AI 模型进行交互式对话。
* **聊天历史：** 保存和浏览过去的对话。
* **MCP 服务器管理：** (根据 `mcp-drawer.tsx` 推断，请补充具体功能) 添加、查看或管理 MCP 服务器。
* **响应式设计：** 适应不同屏幕尺寸。

## 🚀 技术栈

* **框架：** [Next.js](https://nextjs.org/) (App Router)
* **语言：** [TypeScript](https://www.typescriptlang.org/)
* **UI:** [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
* **状态管理/数据获取：** [TanStack Query](https://tanstack.com/query/latest)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **AI 集成：** [Vercel AI SDK](https://sdk.vercel.ai/), [DeepSeek](https://www.deepseek.com/) (或其他模型)
* **数据库：** PostgreSQL

## 🛠️ 本地开发

1. **克隆仓库：**

    ```bash
    git clone <your-repository-url>
    cd megacloud-mcp-client
    ```

2. **安装依赖：**

    ```bash
    pnpm install
    ```

3. **设置环境变量：**
    复制 `.env.example` (如果存在) 为 `.env` 文件，并填入必要的环境变量，例如：
    * 数据库连接 URL (`DATABASE_URL`)
    * AI 服务 API 密钥 (例如 `DEEPSEEK_API_KEY`)
    * (其他必要的环境变量)

4. **数据库迁移 (使用 Drizzle):**

    ```bash
   pnpm db:push
    ```

5. **启动开发服务器：**

    ```bash
    pnpm dev
    ```

    在浏览器中打开 `http://localhost:3000`。

## 部署

有关如何部署此应用程序，请参阅 T3 Stack 的部署指南：

* [Vercel](https://create.t3.gg/en/deployment/vercel)
* [Netlify](https://create.t3.gg/en/deployment/netlify)
* [Docker](https://create.t3.gg/en/deployment/docker)

---
