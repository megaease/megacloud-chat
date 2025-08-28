# Megacloud Chat

A modern, feature-rich AI chat application with comprehensive Model Context Protocol (MCP) server management and artifact system support.

*[查看中文版](./README.zh.md)*

## ✨ Features

### 🤖 AI Chat Capabilities

* **Multi-Model Support**: Seamlessly switch between multiple AI providers including OpenAI, DeepSeek, Anthropic, GLM, OpenRouter, and custom providers
* **Real-time Streaming**: Experience smooth, real-time conversation streaming with typing indicators
* **Chat History Management**: Automatically save and organize conversations with easy search and retrieval
* **Reasoning Display**: View AI model reasoning processes for better understanding of responses
* **Message Editing**: Edit and regenerate messages for improved conversation flow

### 🎨 Artifact System

* **Dynamic Content Creation**: AI can create and manage various types of content including code, documents, and interactive elements
* **Version Control**: Track and manage different versions of artifacts with easy rollback capabilities
* **Multiple Preview Types**: Support for code previews, HTML rendering, React components, and text artifacts
* **Interactive Actions**: Copy, download, refresh, and fullscreen viewing options for artifacts
* **Real-time Updates**: Live streaming updates for artifact creation and modification

### 🔧 MCP Server Management

* **Multi-Protocol Support**: Add and configure both SSE (Server-Sent Events) and STDIO type MCP servers
* **Real-time Status Monitoring**: Track server status with visual indicators (online, offline, error, connecting)
* **Flexible Configuration**: Customize server settings including URLs, commands, environment variables, and headers
* **Connection Management**: Start, stop, and restart server operations with ease
* **Server Organization**: Edit, delete, and organize multiple MCP server configurations

### 🎯 Additional Features

* **Provider Management**: Unified interface for managing multiple AI providers with API key and endpoint configuration
* **Search Functionality**: Powerful search capabilities across conversations and artifacts
* **Responsive Design**: Fully responsive interface that adapts seamlessly to desktop, tablet, and mobile devices
* **Dark/Light Theme**: Built-in theme support with automatic system preference detection
* **Internationalization**: Full i18n support with English and Chinese language options
* **Code Editor**: Integrated code editor with syntax highlighting for various programming languages
* **Tool Integration**: Support for AI tool use and function calling capabilities

## 🚀 Tech Stack

* **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **UI**: [React 19](https://reactjs.org/), [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
* **State Management**: [TanStack Query](https://tanstack.com/query/latest)
* **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
* **Database**: PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
* **AI Integration**: [AI SDK](https://sdk.vercel.ai/), multiple providers support
* **Development Tools**: [Biome](https://biomejs.dev/), [PNPM](https://pnpm.io/)

## 🛠️ Local Development

1. **Clone the repository**:

    ```bash
    git clone <your-repository-url>
    cd megacloud-chat
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

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Please ensure you follow the project's code style and commit message conventions.

---
