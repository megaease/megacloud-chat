# Megacloud MCP Client

A modern frontend application for AI chat interactions and Model Context Protocol (MCP) server management.

*[查看中文版](./README.zh.md)*

## ✨ Features

* **AI Chat Interface**: Engage in fluid, interactive conversations with AI models, including DeepSeek and others.
* **Chat History**: Automatically save and easily browse past conversations for seamless continuity.
* **MCP Server Management**:
  * Add and configure SSE or STDIO type MCP servers
  * Monitor server status in real-time (online, offline, error, connecting)
  * Start/stop server operations
  * Customize server configurations (URL, commands, environment variables, headers)
  * Edit or delete existing servers
* **Responsive Design**: Adapts to different devices and screen sizes for a consistent user experience.

## 🚀 Tech Stack

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **UI**:
  * [React 19](https://reactjs.org/)
  * [Tailwind CSS 4](https://tailwindcss.com/)
  * [shadcn/ui](https://ui.shadcn.com/) (based on Radix UI)
* **State Management/Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
* **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
* **Database & ORM**:
  * PostgreSQL
  * [Drizzle ORM](https://orm.drizzle.team/)
* **AI Integration**:
  * [AI SDK](https://sdk.vercel.ai/)
  * [DeepSeek Integration](https://www.deepseek.com/)
* **Development Tools**:
  * [Biome](https://biomejs.dev/) (code formatting and linting)
  * [PNPM](https://pnpm.io/) (package manager)

## 🛠️ Local Development

1. **Clone the repository**:

    ```bash
    git clone <your-repository-url>
    cd megacloud-mcp-client
    ```

2. **Install dependencies**:

    ```bash
    pnpm install
    ```

3. **Start local PostgreSQL database**:

   Use the provided script to start a Docker container (if Docker is installed):

    ```bash
    ./start-database.sh
    ```

   Or configure a local PostgreSQL instance manually.

4. **Set up environment variables**:

   Copy `.env.example` to `.env` and fill in the necessary environment variables:

    ```bash
    cp .env.example .env
    ```

   Then edit the `.env` file to configure:
   * Database connection string (`DATABASE_URL`)
   * AI model API keys

5. **Database migration**:

    ```bash
    pnpm db:push
    ```

6. **Start development server**:

    ```bash
    pnpm dev
    ```

   Open `http://localhost:3000` in your browser.

7. **Other useful commands**:

   * Type checking: `pnpm typecheck`
   * Code linting: `pnpm check`
   * Code auto-fixing: `pnpm check:write`
   * Database management UI: `pnpm db:studio`

## 📦 Deployment

Multiple deployment options are supported:

* **Vercel**: Recommended for production environments. [Deployment guide](https://create.t3.gg/en/deployment/vercel)
* **Netlify**: Offers convenient deployment similar to Vercel. [Deployment guide](https://create.t3.gg/en/deployment/netlify)
* **Docker**: Suitable for self-hosting scenarios. [Containerization guide](https://create.t3.gg/en/deployment/docker)

## 📝 Development Notes

This project uses the T3 Stack ecosystem and follows modern React and Next.js best practices. When developing, ensure that:

1. Database operations are only performed in server components
2. TanStack Query is used for client-side data management
3. Environment variables follow the correct pattern (refer to `src/env.js`)
4. Type-safe development practices are followed

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Please ensure you follow the project's code style and commit message conventions.

---
