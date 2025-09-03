// lib/services/react-app-service.ts
import { Sandbox } from "@e2b/code-interpreter";
import { generateId } from "ai";
import { getTemplate } from "@/lib/react-scaffold/templates";
import { createArtifact, updateArtifact } from "@/server/db/queries/artifacts";
import { saveToChatsTable } from "@/server/db/queries/chats";
import type { ReactAppContent, ReactAppFile } from "@/lib/artifact-types";

// Active sandboxes storage
const activeSandboxes = new Map<string, Sandbox>();

/**
 * Clean up existing sandbox for a chat
 */
export async function cleanupExistingSandbox(chatId: string): Promise<void> {
	// Find and remove any existing sandbox for this chat
	for (const [key, sandbox] of activeSandboxes.entries()) {
		if (key.includes(chatId)) {
			try {
				console.log("Cleaning up existing sandbox:", key);
				await sandbox.kill();
				activeSandboxes.delete(key);
				console.log("✓ Sandbox cleaned up:", key);
			} catch (error) {
				console.warn("Failed to cleanup sandbox:", key, error);
			}
		}
	}
}

export interface ReactAppCreationOptions {
	title: string;
	userId: string;
	chatId: string;
	customComponent?: string;
	autoStart?: boolean;
}

export interface ReactAppResult {
	success: boolean;
	artifactId?: string;
	sandboxId?: string;
	previewUrl?: string;
	kind?: string;
	title?: string;
	error?: string;
	message?: string;
}

export interface SandboxResult {
	success: boolean;
	sandboxId?: string;
	error?: string;
}

export interface FileOperationResult {
	success: boolean;
	error?: string;
}

export interface DependencyOperationResult {
	success: boolean;
	error?: string;
	output?: string;
}

export interface ServerStartResult {
	success: boolean;
	previewUrl?: string;
	error?: string;
}

/**
 * Generate React component based on title
 */
export async function generateReactComponent(title?: string): Promise<string> {
	const lowerTitle = (title || "React App").toLowerCase();

	if (lowerTitle.includes("todo") || lowerTitle.includes("待办事项")) {
		return `import { useState } from 'react';

interface Todo {
	id: string;
	text: string;
	completed: boolean;
}

export default function TodoApp() {
	const [todos, setTodos] = useState<Todo[]>([]);
	const [inputValue, setInputValue] = useState('');

	const addTodo = () => {
		if (inputValue.trim()) {
			const newTodo: Todo = {
				id: Date.now().toString(),
				text: inputValue,
				completed: false,
			};
			setTodos([...todos, newTodo]);
			setInputValue('');
		}
	};

	const toggleTodo = (id: string) => {
		setTodos(todos.map(todo => 
			todo.id === id ? { ...todo, completed: !todo.completed } : todo
		));
	};

	const deleteTodo = (id: string) => {
		setTodos(todos.filter(todo => todo.id !== id));
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-2xl mx-auto px-4">
				<h1 className="text-3xl font-bold text-center mb-8">待办事项应用</h1>
				
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<div className="flex gap-2 mb-4">
						<input
							type="text"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyPress={(e) => e.key === 'Enter' && addTodo()}
							placeholder="添加新的待办事项..."
							className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							onClick={addTodo}
							className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
						>
							添加
						</button>
					</div>
					
					<div className="space-y-2">
						{todos.map(todo => (
							<div
								key={todo.id}
								className="flex items-center gap-3 p-3 bg-gray-50 rounded-md"
							>
								<input
									type="checkbox"
									checked={todo.completed}
									onChange={() => toggleTodo(todo.id)}
									className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
								/>
								<span className={\`flex-1 \${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}\`}>
									{todo.text}
								</span>
								<button
									onClick={() => deleteTodo(todo.id)}
									className="text-red-500 hover:text-red-700 transition-colors"
								>
									删除
								</button>
							</div>
						))}
					</div>
					
					{todos.length === 0 && (
						<p className="text-center text-gray-500 py-4">
							暂无待办事项，添加一个吧！
						</p>
					)}
				</div>
			</div>
		</div>
	);
}`;
	}

	// Default component
	return `import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to React App</h2>
          <p className="text-gray-600">
            This is a complete React application with Vite, TypeScript, React Router, and Tailwind CSS.
          </p>
          <div className="mt-6">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function About() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
          <p className="text-gray-600 mb-4">
            This React app was generated using a template with:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Vite for fast development and building</li>
            <li>TypeScript for type safety</li>
            <li>React Router for navigation</li>
            <li>Tailwind CSS for styling</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">React App</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    to="/"
                    className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    About
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App`;
}

/**
 * Create a React app artifact
 */
export async function createReactAppArtifact(
	title: string,
	userId: string,
	chatId: string,
	files: ReactAppFile[],
): Promise<{ artifactId: string; error?: string }> {
	try {
		const artifactId = generateId();

		const reactAppContent: ReactAppContent = {
			type: "react-app",
			files,
			config: {
				typescript: true,
				tailwind: true,
				router: true,
			},
		};

		await createArtifact({
			id: artifactId,
			title,
			kind: "react-app",
			content: JSON.stringify(reactAppContent),
			userId,
			chatId,
		});

		return { artifactId };
	} catch (error) {
		return {
			artifactId: "",
			error:
				error instanceof Error ? error.message : "Failed to create artifact",
		};
	}
}

/**
 * Generate React app files from template
 */
export async function generateReactAppFiles(
	customComponent?: string,
): Promise<ReactAppFile[]> {
	const templateName = "complete-react";
	const selectedTemplate = getTemplate(templateName);
	if (!selectedTemplate) {
		throw new Error(`Template '${templateName}' not found`);
	}

	// Generate files from template
	const files = selectedTemplate.files.map((file) => ({
		path: file.path,
		content: file.content,
		language: file.language,
	}));

	return files;
}

/**
 * Create a sandbox for the React app
 */
export async function createSandbox(
	userId: string,
	artifactId: string,
): Promise<SandboxResult> {
	try {
		const sandbox = await Sandbox.create({
			apiKey: process.env.E2B_API_KEY,
		});

		activeSandboxes.set(`${userId}-${artifactId}`, sandbox);

		return {
			success: true,
			sandboxId: sandbox.sandboxId,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create sandbox",
		};
	}
}

/**
 * Get sandbox by artifact ID and user ID
 */
export function getSandbox(
	userId: string,
	artifactId: string,
): Sandbox | undefined {
	return activeSandboxes.get(`${userId}-${artifactId}`);
}

/**
 * Write files to sandbox
 */
export async function writeFilesToSandbox(
	sandbox: Sandbox,
	files: ReactAppFile[],
): Promise<FileOperationResult> {
	try {
		for (const file of files) {
			console.log(`Writing file: ${file.path}`);
			await sandbox.files.write(file.path, file.content);
		}

		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to write files",
		};
	}
}

/**
 * Install dependencies in sandbox
 */
export async function installDependencies(
	sandbox: Sandbox,
): Promise<DependencyOperationResult> {
	try {
		const process = await sandbox.commands.run("npm install", {
			cwd: "/home/user",
		});

		if (process.exitCode !== 0) {
			return {
				success: false,
				error: `Failed to install dependencies: ${process.stderr}`,
				output: process.stderr,
			};
		}

		return {
			success: true,
			output: process.stdout,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Failed to install dependencies",
		};
	}
}

/**
 * Start development server
 */
export async function startDevServer(
	sandbox: Sandbox,
): Promise<ServerStartResult> {
	try {
		console.log("Starting dev server in sandbox:", sandbox.sandboxId);

		// Kill any existing vite processes
		try {
			await sandbox.commands.run("pkill -f 'vite' || true", {
				cwd: "/home/user",
			});
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch {
			// Ignore errors
		}

		// Start dev server with stdout/stderr capture for debugging
		const process = await sandbox.commands.run("npm run dev", {
			cwd: "/home/user",
			background: true,
		});

		console.log("Dev server process started");

		// Wait for server to start and check if it's responsive
		let serverStarted = false;
		let lastError = "";

		for (let i = 0; i < 15; i++) {
			await new Promise((resolve) => setTimeout(resolve, 3000));

			try {
				// Try to check if port 5173 is listening
				const checkResult = await sandbox.commands.run(
					"netstat -tlnp | grep :5173 || ss -tlnp | grep :5173",
					{
						cwd: "/home/user",
						timeoutMs: 10000,
					},
				);

				if (checkResult.stdout.includes(":5173")) {
					console.log("Port 5173 is listening");

					// Try to access the server
					try {
						await sandbox.commands.run(
							"curl -s -o /dev/null -w '%{http_code}' http://localhost:5173 | grep -q '200\\|302'",
							{
								cwd: "/home/user",
								timeoutMs: 10000,
							},
						);
						serverStarted = true;
						break;
					} catch (curlError) {
						console.log("Server responding but not ready yet");
					}
				}
			} catch (checkError) {
				lastError =
					checkError instanceof Error ? checkError.message : String(checkError);
				console.log(`Waiting for server... attempt ${i + 1}/15`);
			}
		}

		if (!serverStarted) {
			// Get more diagnostic information
			let diagnostics = "";
			try {
				const logResult = await sandbox.commands.run(
					"ls -la package.json vite.config.ts && cat package.json | grep -A5 -B5 scripts",
					{
						cwd: "/home/user",
					},
				);
				diagnostics += `\nProject files:\n${logResult.stdout}`;
			} catch (e) {
				diagnostics += "\nCould not check project files";
			}

			try {
				const npmResult = await sandbox.commands.run("npm list vite", {
					cwd: "/home/user",
				});
				diagnostics += `\nVite installation:\n${npmResult.stdout}`;
			} catch (e) {
				diagnostics += "\nCould not check vite installation";
			}

			return {
				success: false,
				error: `Dev server failed to start within 45 seconds. Last error: ${lastError}${diagnostics}`,
			};
		}

		// Get the public URL for port 5173
		const previewUrl = sandbox.getHost(5173);
		console.log("✓ Dev server started at:", previewUrl);

		return {
			success: true,
			previewUrl,
		};
	} catch (error) {
		console.error("Dev server start error:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to start dev server",
		};
	}
}

/**
 * Complete React app creation workflow
 */
export async function createReactApp({
	title,
	userId,
	chatId,
	customComponent,
	autoStart = true,
}: ReactAppCreationOptions): Promise<ReactAppResult> {
	console.log("Creating React app:", {
		title,
		userId,
		customComponent: !!customComponent,
		autoStart,
	});

	try {
		// Step 1: Generate files
		console.log("Step 1: Generating React app files...");
		const files = await generateReactAppFiles();

		// Add custom App component if provided
		const appComponent =
			customComponent || (await generateReactComponent(title));
		files.push({
			path: "src/App.tsx",
			content: appComponent,
			language: "typescript",
		});
		console.log("✓ Generated", files.length, "files");

		// Step 2: Create artifact
		console.log("Step 2: Creating artifact...");

		// Ensure chat exists before creating artifact
		await saveToChatsTable({ userId, chatId, title: `${title} - React App` });
		console.log("✓ Chat ensured");

		const { artifactId, error: createError } = await createReactAppArtifact(
			title,
			userId,
			chatId,
			files,
		);

		if (createError) {
			throw new Error(`Failed to create artifact: ${createError}`);
		}
		console.log("✓ Artifact created:", artifactId);

		// Step 3: Create sandbox
		console.log("Step 3: Creating sandbox...");

		// Clean up any existing sandbox for this chat
		await cleanupExistingSandbox(chatId);

		const { sandboxId, error: sandboxError } = await createSandbox(
			userId,
			artifactId,
		);

		if (sandboxError || !sandboxId) {
			throw new Error(`Failed to create sandbox: ${sandboxError}`);
		}

		const sandbox = getSandbox(userId, artifactId);
		if (!sandbox) {
			throw new Error("Sandbox not found after creation");
		}
		console.log("✓ Sandbox created:", sandboxId);

		// Step 4: Write files
		console.log("Step 4: Writing files...");
		const { error: writeError } = await writeFilesToSandbox(sandbox, files);
		if (writeError) {
			throw new Error(`Failed to write files: ${writeError}`);
		}
		console.log("✓ Files written");

		// Step 5: Install dependencies
		console.log("Step 5: Installing dependencies...");
		const { error: installError } = await installDependencies(sandbox);
		if (installError) {
			throw new Error(`Failed to install dependencies: ${installError}`);
		}
		console.log("✓ Dependencies installed");

		// Step 6: Start server (if requested)
		let previewUrl: string | undefined = "";
		if (autoStart) {
			console.log("Step 6: Starting dev server...");
			const { previewUrl: url, error: serverError } =
				await startDevServer(sandbox);
			if (serverError) {
				throw new Error(`Failed to start dev server: ${serverError}`);
			}
			previewUrl = url;
			console.log("✓ Dev server started at:", previewUrl);

			// Persist previewUrl into artifact content so the UI can show it without extra API calls
			try {
				// Build updated content with previewUrl
				const updatedContent: ReactAppContent = {
					type: "react-app",
					files,
					config: {
						typescript: true,
						tailwind: true,
						router: true,
					},
					previewUrl,
				};

				await updateArtifact({
					artifactId,
					userId,
					content: JSON.stringify(updatedContent),
					changeDescription: "Add previewUrl after dev server start",
				});
				console.log("✓ Artifact updated with previewUrl");
			} catch (e) {
				console.warn("Failed to update artifact with previewUrl:", e);
			}
		}

		return {
			success: true,
			artifactId,
			sandboxId,
			previewUrl,
			kind: "react-app",
			title,
			message: `✅ React 应用 "${title}" 创建成功！${previewUrl ? ` 预览地址: ${previewUrl}` : ""}`,
		};
	} catch (error) {
		console.error("React app creation failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}
