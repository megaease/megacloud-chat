// lib/react-scaffold/templates.ts
export interface ReactScaffoldFile {
	path: string;
	content: string;
	language: "json" | "javascript" | "typescript" | "jsx" | "tsx" | "css" | "html";
}

export interface ReactScaffoldTemplate {
	name: string;
	description: string;
	files: ReactScaffoldFile[];
	dependencies: string[];
	devDependencies: string[];
}

// Base Vite React template
export const baseReactTemplate: ReactScaffoldTemplate = {
	name: "base-react",
	description: "Basic Vite React app with TypeScript",
	dependencies: [
		"react",
		"react-dom",
	],
	devDependencies: [
		"@types/react",
		"@types/react-dom",
		"@vitejs/plugin-react",
		"typescript",
		"vite",
	],
	files: [
		{
			path: "package.json",
			content: JSON.stringify({
				name: "react-app",
				private: true,
				version: "0.0.0",
				type: "module",
				scripts: {
					dev: "vite",
					build: "tsc && vite build",
					lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
					preview: "vite preview",
				},
				dependencies: {
					react: "^18.2.0",
					"react-dom": "^18.2.0",
				},
				devDependencies: {
					"@types/react": "^18.2.43",
					"@types/react-dom": "^18.2.17",
					"@typescript-eslint/eslint-plugin": "^6.14.0",
					"@typescript-eslint/parser": "^6.14.0",
					"@vitejs/plugin-react": "^4.2.1",
					"eslint": "^8.55.0",
					"eslint-plugin-react-hooks": "^4.6.0",
					"eslint-plugin-react-refresh": "^0.4.5",
					"typescript": "^5.2.2",
					"vite": "^5.0.8",
				},
			}, null, 2),
			language: "json",
		},
		{
			path: "tsconfig.json",
			content: JSON.stringify({
				compilerOptions: {
					target: "ES2020",
					useDefineForClassFields: true,
					lib: ["ES2020", "DOM", "DOM.Iterable"],
					module: "ESNext",
					skipLibCheck: true,
					moduleResolution: "bundler",
					allowImportingTsExtensions: true,
					resolveJsonModule: true,
					isolatedModules: true,
					noEmit: true,
					jsx: "react-jsx",
					strict: true,
					noUnusedLocals: true,
					noUnusedParameters: true,
					noFallthroughCasesInSwitch: true,
				},
				include: ["src"],
				references: [{ path: "./tsconfig.node.json" }],
			}, null, 2),
			language: "json",
		},
		{
			path: "tsconfig.node.json",
			content: JSON.stringify({
				compilerOptions: {
					composite: true,
					skipLibCheck: true,
					module: "ESNext",
					moduleResolution: "bundler",
					allowSyntheticDefaultImports: true,
				},
				include: ["vite.config.ts"],
			}, null, 2),
			language: "json",
		},
		{
			path: "vite.config.ts",
			content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`,
			language: "typescript",
		},
		{
			path: ".eslintrc.cjs",
			content: `module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}`,
			language: "javascript",
		},
		{
			path: "index.html",
			content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
			language: "html",
		},
		{
			path: "src/main.tsx",
			content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
			language: "typescript",
		},
		{
			path: "src/App.tsx",
			content: `import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App`,
			language: "typescript",
		},
		{
			path: "src/index.css",
			content: `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}`,
			language: "css",
		},
		{
			path: "src/App.css",
			content: `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}`,
			language: "css",
		},
		{
			path: "src/assets/react.svg",
			content: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="37.07" height="36" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 198"><path fill="#00D8FF" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621c6.238-30.281 2.16-54.676-11.769-62.708c-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848a155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233C50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165a167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266c13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923a168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586c13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488c29.348-9.723 48.443-25.443 48.443-41.52c0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345c-3.24-10.257-7.612-21.163-12.963-32.432c5.106-11 9.31-21.767 12.459-31.957c2.619.758 5.16 1.557 7.61 2.4c23.69 8.156 38.14 20.213 38.14 29.504c0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787c-1.524 8.219-4.59 13.698-8.382 15.893c-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345ZM82.802 87.83a312.156 312.156 0 0 1 5.372-4.955c-6.777 7.575-13.361 15.837-19.527 24.47c-11.677.975-22.946 2.458-33.419 4.405c-1.03-3.997-1.91-7.902-2.626-11.69c-4.755-24.732-1.643-44.986 6.736-50.8c8.803-5.098 27.653 2.143 47.06 17.524a139.23 139.23 0 0 1 4.877 4.19c-5.933 5.9-11.767 12.4-17.473 19.356Zm10.666 8.598a278.27 278.27 0 0 1 7.805-10.266c8.168 1.033 16.584 1.622 25.072 1.622c8.488 0 16.904-.589 25.072-1.622a274.09 274.09 0 0 1 7.686 10.164a300.82 300.82 0 0 1 6.782 11.8a297.562 297.562 0 0 1-6.782 11.867a271.047 271.047 0 0 1-7.686 10.165c-8.168-1.033-16.584-1.622-25.072-1.622c-8.488 0-16.904.59-25.072 1.622a280.3 280.3 0 0 1-7.805-10.266a291.427 291.427 0 0 1-6.772-11.8a288.18 288.18 0 0 1 6.772-11.834Zm52.845-40.246c5.934-5.899 11.77-12.4 17.473-19.356c11.677-.975 22.946-2.458 33.419-4.405c1.03 3.997 1.91 7.902 2.626 11.69c4.755 24.732 1.643 44.986-6.736 50.8c-8.757 5.062-27.317-1.9-46.435-16.72a138.387 138.387 0 0 1-5.347-4.558ZM128.116 122.36c9.884 0 19.438-.45 28.526-1.286a258.156 258.156 0 0 1 5.438 10.858a260.32 260.32 0 0 1 5.324 11.69a258.49 258.49 0 0 1-10.762 19.834c-9.163.852-18.8 1.287-28.526 1.287c-9.747 0-19.33-.424-28.424-1.255a252.9 252.9 0 0 1-10.882-19.773a254.38 254.38 0 0 1-5.314-11.67a251.827 251.827 0 0 1 5.335-11.704a254.98 254.98 0 0 1 10.882-19.762c9.094-.831 18.677-1.255 28.424-1.255ZM63.318 98.424C48.236 93.03 38.14 85.825 38.14 76.7c0-9.272 14.324-21.243 37.812-29.355c2.313-.795 4.716-1.548 7.193-2.258c3.17 10.27 7.377 21.056 12.493 32.074c-5.168 11.11-9.418 21.98-12.612 32.322c-2.48-.706-4.853-1.45-7.108-2.239Zm8.026 68.454c-6.708-3.848-9.555-18.264-7.29-36.912c.63-4.764 1.685-9.78 3.133-14.936c10.376 2.435 21.714 4.18 33.606 5.19c7.117 8.96 14.463 17.03 21.856 24.01c-1.72 1.658-3.394 3.23-5.006 4.705c-16.486 14.9-32.008 20.56-40.3 16.943Zm68.883-22.095c-3.558 3.09-7.244 6.02-11.028 8.784c-3.783-2.764-7.468-5.693-11.016-8.772c3.65.174 7.367.263 11.133.263c3.767 0 7.493-.089 11.144-.263c-3.558 3.08-7.244 6.009-11.028 8.773Zm25.066-11.878c-3.661.684-7.485 1.256-11.443 1.712c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957a162.177 162.177 0 0 1-8.55-1.711Zm-2.89-43.2c7.817-11.846 14.883-23.094 21.025-33.66c10.522 2.435 20.39 5.556 29.24 9.28c2.257.864 4.435 1.773 6.522 2.716c-3.448 13.988-12.5 28.898-25.963 42.484c-1.535 1.549-3.122 3.068-4.755 4.552a291.828 291.828 0 0 0-20.352-23.984a291.828 291.828 0 0 0-5.718-1.388Zm-43.86-54.328c-3.764.174-7.493.263-11.26.263c-3.766 0-7.483-.089-11.133-.263c3.548-3.08 7.234-6.009 11.017-8.773c3.784 2.764 7.47 5.693 11.028 8.773Zm11.028-8.773c3.783 2.764 7.468 5.693 11.016 8.773c-3.65-.174-7.377-.263-11.144-.263c-3.766 0-7.493.089-11.133.263c3.548-3.08 7.234-6.009 11.017-8.773Zm-45.896 65.633c-3.662-.684-7.486-1.256-11.444-1.712c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957a162.177 162.177 0 0 1-8.548 1.713Zm-2.89-43.2c-7.817 11.846-14.883 23.094-21.025 33.66c-10.522-2.435-20.39-5.556-29.24-9.28c-2.257-.864-4.435-1.773-6.522-2.716c3.448-13.988 12.5-28.898 25.963-42.484c1.535-1.549 3.122-3.068 4.755-4.552a291.828 291.828 0 0 0 20.352 23.984a291.828 291.828 0 0 0 5.718 1.388Zm-22.5 78.704c-23.288-8.04-37.59-19.88-37.59-29.325c0-9.446 14.302-21.286 37.59-29.325c2.313-.795 4.716-1.548 7.193-2.258c3.17 10.27 7.377 21.056 12.493 32.074c-5.168 11.11-9.418 21.98-12.612 32.322c-2.48-.706-4.853-1.45-7.108-2.239Zm52.844 43.245c-6.708 3.848-21.123.702-36.912-12.577a139.246 139.246 0 0 1-5.342-4.923c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345a156.9 156.9 0 0 1-1.535 6.842c-5.354 20.848-13.7 35.46-22.342 40.25Zm-2.89-43.2c-3.65.174-7.367.263-11.133.263c-3.767 0-7.493-.089-11.144-.263c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957Zm25.066-11.878c-3.661.684-7.485 1.256-11.443 1.712c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957a162.177 162.177 0 0 1-8.55-1.711Zm43.86-54.328c7.817-11.846 14.883-23.094 21.025-33.66c10.522 2.435 20.39 5.556 29.24 9.28c2.257.864 4.435 1.773 6.522 2.716c-3.448 13.988-12.5 28.898-25.963 42.484c-1.535 1.549-3.122 3.068-4.755 4.552a291.828 291.828 0 0 0-20.352-23.984a291.828 291.828 0 0 0-5.718-1.388Z"/></svg>`,
			language: "html",
		},
	],
};

// Template with Tailwind CSS
export const tailwindReactTemplate: ReactScaffoldTemplate = {
	name: "tailwind-react",
	description: "Vite React app with TypeScript and Tailwind CSS",
	dependencies: [
		"react",
		"react-dom",
	],
	devDependencies: [
		"@types/react",
		"@types/react-dom",
		"@vitejs/plugin-react",
		"autoprefixer",
		"postcss",
		"tailwindcss",
		"typescript",
		"vite",
	],
	files: [
		...baseReactTemplate.files,
		{
			path: "tailwind.config.js",
			content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
			language: "javascript",
		},
		{
			path: "postcss.config.js",
			content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
			language: "javascript",
		},
		{
			path: "src/index.css",
			content: `@tailwind base;
@tailwind components;
@tailwind utilities;`,
			language: "css",
		},
		{
			path: "src/App.tsx",
			content: `import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Vite + React + Tailwind
        </h1>
        
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2">
              <svg className="w-full h-full" viewBox="0 0 256 198" xmlns="http://www.w3.org/2000/svg">
                <path fill="currentColor" d="M210.483 73.824a171.49 171.49 0 0 0-8.24-2.597c.465-1.9.893-3.777 1.273-5.621c6.238-30.281 2.16-54.676-11.769-62.708c-13.355-7.7-35.196.329-57.254 19.526a171.23 171.23 0 0 0-6.375 5.848a155.866 155.866 0 0 0-4.241-3.917C100.759 3.829 77.587-4.822 63.673 3.233C50.33 10.957 46.379 33.89 51.995 62.588a170.974 170.974 0 0 0 1.892 8.48c-3.28.932-6.445 1.924-9.474 2.98C17.309 83.498 0 98.307 0 113.668c0 15.865 18.582 31.778 46.812 41.427a145.52 145.52 0 0 0 6.921 2.165a167.467 167.467 0 0 0-2.01 9.138c-5.354 28.2-1.173 50.591 12.134 58.266c13.744 7.926 36.812-.22 59.273-19.855a145.567 145.567 0 0 0 5.342-4.923a168.064 168.064 0 0 0 6.92 6.314c21.758 18.722 43.246 26.282 56.54 18.586c13.731-7.949 18.194-32.003 12.4-61.268a145.016 145.016 0 0 0-1.535-6.842c1.62-.48 3.21-.974 4.76-1.488c29.348-9.723 48.443-25.443 48.443-41.52c0-15.417-17.868-30.326-45.517-39.844Zm-6.365 70.984c-1.4.463-2.836.91-4.3 1.345c-3.24-10.257-7.612-21.163-12.963-32.432c5.106-11 9.31-21.767 12.459-31.957c2.619.758 5.16 1.557 7.61 2.4c23.69 8.156 38.14 20.213 38.14 29.504c0 9.896-15.606 22.743-40.946 31.14Zm-10.514 20.834c2.562 12.94 2.927 24.64 1.23 33.787c-1.524 8.219-4.59 13.698-8.382 15.893c-8.067 4.67-25.32-1.4-43.927-17.412a156.726 156.726 0 0 1-6.437-5.87c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345ZM82.802 87.83a312.156 312.156 0 0 1 5.372-4.955c-6.777 7.575-13.361 15.837-19.527 24.47c-11.677.975-22.946 2.458-33.419 4.405c-1.03-3.997-1.91-7.902-2.626-11.69c-4.755-24.732-1.643-44.986 6.736-50.8c8.803-5.098 27.653 2.143 47.06 17.524a139.23 139.23 0 0 1 4.877 4.19c-5.933 5.9-11.767 12.4-17.473 19.356Zm10.666 8.598a278.27 278.27 0 0 1 7.805-10.266c8.168 1.033 16.584 1.622 25.072 1.622c8.488 0 16.904-.589 25.072-1.622a274.09 274.09 0 0 1 7.686 10.164a300.82 300.82 0 0 1 6.782 11.8a297.562 297.562 0 0 1-6.782 11.867a271.047 271.047 0 0 1-7.686 10.165c-8.168-1.033-16.584-1.622-25.072-1.622c-8.488 0-16.904.59-25.072 1.622a280.3 280.3 0 0 1-7.805-10.266a291.427 291.427 0 0 1-6.772-11.8a288.18 288.18 0 0 1 6.772-11.834Zm52.845-40.246c5.934-5.899 11.77-12.4 17.473-19.356c11.677-.975 22.946-2.458 33.419-4.405c1.03 3.997 1.91 7.902 2.626 11.69c4.755 24.732 1.643 44.986-6.736 50.8c-8.757 5.062-27.317-1.9-46.435-16.72a138.387 138.387 0 0 1-5.347-4.558ZM128.116 122.36c9.884 0 19.438-.45 28.526-1.286a258.156 258.156 0 0 1 5.438 10.858a260.32 260.32 0 0 1 5.324 11.69a258.49 258.49 0 0 1-10.762 19.834c-9.163.852-18.8 1.287-28.526 1.287c-9.747 0-19.33-.424-28.424-1.255a252.9 252.9 0 0 1-10.882-19.773a254.38 254.38 0 0 1-5.314-11.67a251.827 251.827 0 0 1 5.335-11.704a254.98 254.98 0 0 1 10.882-19.762c9.094-.831 18.677-1.255 28.424-1.255ZM63.318 98.424C48.236 93.03 38.14 85.825 38.14 76.7c0-9.272 14.324-21.243 37.812-29.355c2.313-.795 4.716-1.548 7.193-2.258c3.17 10.27 7.377 21.056 12.493 32.074c-5.168 11.11-9.418 21.98-12.612 32.322c-2.48-.706-4.853-1.45-7.108-2.239Zm8.026 68.454c-6.708-3.848-9.555-18.264-7.29-36.912c.63-4.764 1.685-9.78 3.133-14.936c10.376 2.435 21.714 4.18 33.606 5.19c7.117 8.96 14.463 17.03 21.856 24.01c-1.72 1.658-3.394 3.23-5.006 4.705c-16.486 14.9-32.008 20.56-40.3 16.943Zm68.883-22.095c-3.558 3.09-7.244 6.02-11.028 8.784c-3.783-2.764-7.468-5.693-11.016-8.772c3.65.174 7.367.263 11.133.263c3.767 0 7.493-.089 11.144-.263c-3.558 3.08-7.244 6.009-11.028 8.773Zm25.066-11.878c-3.661.684-7.485 1.256-11.443 1.712c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957a162.177 162.177 0 0 1-8.55-1.711Zm-2.89-43.2c7.817-11.846 14.883-23.094 21.025-33.66c10.522 2.435 20.39 5.556 29.24 9.28c2.257.864 4.435 1.773 6.522 2.716c-3.448 13.988-12.5 28.898-25.963 42.484c-1.535 1.549-3.122 3.068-4.755 4.552a291.828 291.828 0 0 0-20.352-23.984a291.828 291.828 0 0 0-5.718-1.388Zm-43.86-54.328c-3.764.174-7.493.263-11.26.263c-3.766 0-7.483-.089-11.133-.263c3.548-3.08 7.234-6.009 11.017-8.773c3.784 2.764 7.47 5.693 11.028 8.773Zm11.028-8.773c3.783 2.764 7.468 5.693 11.016 8.773c-3.65-.174-7.377-.263-11.144-.263c-3.766 0-7.493.089-11.133.263c3.548-3.08 7.234-6.009 11.017-8.773Zm-45.896 65.633c-3.662-.684-7.486-1.256-11.444-1.712c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957a162.177 162.177 0 0 1-8.548 1.713Zm-2.89-43.2c-7.817 11.846-14.883 23.094-21.025 33.66c-10.522-2.435-20.39-5.556-29.24-9.28c-2.257-.864-4.435-1.773-6.522-2.716c3.448-13.988 12.5-28.898 25.963-42.484c1.535-1.549 3.122-3.068 4.755-4.552a291.828 291.828 0 0 0 20.352 23.984a291.828 291.828 0 0 0 5.718 1.388Zm-22.5 78.704c-23.288-8.04-37.59-19.88-37.59-29.325c0-9.446 14.302-21.286 37.59-29.325c2.313-.795 4.716-1.548 7.193-2.258c3.17 10.27 7.377 21.056 12.493 32.074c-5.168 11.11-9.418 21.98-12.612 32.322c-2.48-.706-4.853-1.45-7.108-2.239Zm52.844 43.245c-6.708 3.848-21.123.702-36.912-12.577a139.246 139.246 0 0 1-5.342-4.923c7.214-7.889 14.423-17.06 21.459-27.246c12.376-1.098 24.068-2.894 34.671-5.345a156.9 156.9 0 0 1-1.535 6.842c-5.354 20.848-13.7 35.46-22.342 40.25Zm-2.89-43.2c-3.65.174-7.367.263-11.133.263c-3.767 0-7.493-.089-11.144-.263c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957Zm25.066-11.878c-3.661.684-7.485 1.256-11.443 1.712c3.348-3.753 6.69-7.75 9.996-11.958c3.348 4.207 6.69 8.204 9.996 11.957a162.177 162.177 0 0 1-8.55-1.711Zm43.86-54.328c7.817-11.846 14.883-23.094 21.025-33.66c10.522 2.435 20.39 5.556 29.24 9.28c2.257.864 4.435 1.773 6.522 2.716c-3.448 13.988-12.5 28.898-25.963 42.484c-1.535 1.549-3.122 3.068-4.755 4.552a291.828 291.828 0 0 0-20.352-23.984a291.828 291.828 0 0 0-5.718-1.388Z"/>
              </svg>
            </div>
            <span className="text-sm text-gray-600">React</span>
          </div>
          
          <div className="text-4xl font-bold text-gray-400">+</div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-sm text-gray-600">Vite</span>
          </div>
          
          <div className="text-4xl font-bold text-gray-400">+</div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-sm text-gray-600">Tailwind</span>
          </div>
        </div>
        
        <div className="card bg-gray-50 rounded-lg p-6">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            count is {count}
          </button>
          <p className="mt-4 text-sm text-gray-600">
            Edit <code className="bg-gray-100 px-1 py-0.5 rounded">src/App.tsx</code> and save to test HMR
          </p>
        </div>
        
        <p className="text-sm text-gray-500">
          Click on the Vite, React, and Tailwind logos to learn more
        </p>
      </div>
    </div>
  )
}

export default App`,
			language: "typescript",
		},
	],
};

// Template with React Router
export const routerReactTemplate: ReactScaffoldTemplate = {
	name: "router-react",
	description: "Vite React app with TypeScript and React Router",
	dependencies: [
		"react",
		"react-dom",
		"react-router-dom",
	],
	devDependencies: [
		"@types/react",
		"@types/react-dom",
		"@vitejs/plugin-react",
		"typescript",
		"vite",
	],
	files: [
		...baseReactTemplate.files,
		{
			path: "src/App.tsx",
			content: `import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'

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
                    className={({ isActive }) =>
                      \`border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium \${
                        isActive ? '' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }\`
                    }
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    className={({ isActive }) =>
                      \`border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium \${
                        isActive ? '' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }\`
                    }
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

export default App`,
			language: "typescript",
		},
		{
			path: "src/pages/Home.tsx",
			content: `function Home() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to the Home Page</h2>
          <p className="text-gray-600">
            This is a basic React application with routing setup using React Router.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home`,
			language: "typescript",
		},
		{
			path: "src/pages/About.tsx",
			content: `function About() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
          <p className="text-gray-600">
            This is the about page. You can add more information about your application here.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About`,
			language: "typescript",
		},
	],
};

// Get template by name
export function getTemplate(name: string): ReactScaffoldTemplate | undefined {
	switch (name) {
		case "base-react":
			return baseReactTemplate;
		case "tailwind-react":
			return tailwindReactTemplate;
		case "router-react":
			return routerReactTemplate;
		default:
			return undefined;
	}
}

// Get all available templates
export function getAllTemplates(): ReactScaffoldTemplate[] {
	return [baseReactTemplate, tailwindReactTemplate, routerReactTemplate];
}