"use client";

import React from "react";
import type { ArtifactLanguage } from "@/lib/artifact-types";
import type { PreviewPlugin, PreviewProps } from "./types";

// Default plugins
const defaultPlugins: PreviewPlugin[] = [
  {
    type: "html",
    name: "HTML Preview",
    component: React.lazy(() =>
      import("./renderers/HtmlPreviewRenderer").then((mod) => ({
        default: (props: PreviewProps) => (
          <mod.HtmlPreviewRenderer
            code={props.content}
            className={props.className}
          />
        ),
      }))
    ),
    supportedLanguages: ["html"],
    canExecute: false,
  },
  {
    type: "react",
    name: "React Preview",
    component: React.lazy(() =>
      import("./renderers/ReactPreviewRenderer").then((mod) => ({
        default: (props: PreviewProps) => (
          <mod.ReactPreviewRenderer
            code={props.content}
            className={props.className}
          />
        ),
      }))
    ),
    supportedLanguages: [
      "react",
      "jsx",
      "tsx",
    ] as unknown as ArtifactLanguage[],
    canExecute: false,
  },
  {
    type: "code-execution",
    name: "Code Execution",
    component: React.lazy(() =>
      import("./CodeExecutionPanel").then((mod) => ({
        default: (props: PreviewProps) => (
          <mod.CodeExecutionPanel
            code={props.content}
            language={props.language}
            className={props.className}
          />
        ),
      }))
    ),
    supportedLanguages: ["javascript", "python"],
    canExecute: true,
  },
  {
    type: "markdown",
    name: "Markdown Preview",
    component: React.lazy(() =>
      import("./renderers/MarkdownPreviewRenderer").then((mod) => ({
        default: (props: PreviewProps) => (
          <mod.MarkdownPreviewRenderer
            code={props.content}
            className={props.className}
          />
        ),
      }))
    ),
    supportedLanguages: ["markdown"] as unknown as ArtifactLanguage[],
    canExecute: false,
  },
];

class PreviewPluginRegistry {
  private plugins: Map<string, PreviewPlugin> = new Map();
  private fallbackPlugin: PreviewPlugin | null = null;

  constructor() {
    // Initialize with default plugins
    this.registerDefaultPlugins();
  }

  private registerDefaultPlugins() {
    for (const plugin of defaultPlugins) {
      this.register(plugin);
    }

    // Create a fallback plugin for unsupported languages
    this.fallbackPlugin = {
      type: "fallback",
      name: "Code Viewer",
      component: React.lazy(() =>
        import("./renderers/FallbackRenderer").then((mod) => ({
          default: (props: PreviewProps) => (
            <mod.FallbackRenderer
              code={props.content}
              className={props.className}
            />
          ),
        }))
      ),
      supportedLanguages: [] as ArtifactLanguage[],
      canExecute: false,
    };
  }

  register(plugin: PreviewPlugin): void {
    this.plugins.set(plugin.type, plugin);
  }

  unregister(type: string): void {
    this.plugins.delete(type);
  }

  getPlugin(type: string): PreviewPlugin | undefined {
    return this.plugins.get(type);
  }

  getPluginForLanguage(language: ArtifactLanguage): PreviewPlugin | null {
    // Find the first plugin that supports the given language
    for (const plugin of this.plugins.values()) {
      if (plugin.supportedLanguages.includes(language)) {
        return plugin;
      }
    }
    return this.fallbackPlugin;
  }

  getAllPlugins(): PreviewPlugin[] {
    return Array.from(this.plugins.values());
  }

  getSupportedLanguages(): ArtifactLanguage[] {
    const languages = new Set<ArtifactLanguage>();
    for (const plugin of this.plugins.values()) {
      for (const lang of plugin.supportedLanguages) {
        languages.add(lang);
      }
    }
    return Array.from(languages);
  }

  canExecuteLanguage(language: ArtifactLanguage): boolean {
    const plugin = this.getPluginForLanguage(language);
    return plugin?.canExecute || false;
  }

  canPreviewLanguage(language: ArtifactLanguage): boolean {
    const plugin = this.getPluginForLanguage(language);
    return plugin !== null && plugin.type !== "fallback";
  }

  // Get available plugins for a specific language
  getAvailablePluginsForLanguage(language: ArtifactLanguage): PreviewPlugin[] {
    const result: PreviewPlugin[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.supportedLanguages.includes(language)) {
        result.push(plugin);
      }
    }
    return result;
  }

  // Check if a plugin exists
  hasPlugin(type: string): boolean {
    return this.plugins.has(type);
  }

  // Get plugin by name
  getPluginByName(name: string): PreviewPlugin | undefined {
    for (const plugin of this.plugins.values()) {
      if (plugin.name === name) {
        return plugin;
      }
    }
    return undefined;
  }

  // Clear all plugins (useful for testing)
  clear(): void {
    this.plugins.clear();
  }

  // Reset to default plugins
  reset(): void {
    this.clear();
    this.registerDefaultPlugins();
  }
}

// Create a singleton instance
export const previewPluginRegistry = new PreviewPluginRegistry();

// React hook for using the registry
export function usePreviewPluginRegistry() {
  return {
    registry: previewPluginRegistry,
    register: (plugin: PreviewPlugin) => previewPluginRegistry.register(plugin),
    unregister: (type: string) => previewPluginRegistry.unregister(type),
    getPlugin: (type: string) => previewPluginRegistry.getPlugin(type),
    getPluginForLanguage: (language: ArtifactLanguage) =>
      previewPluginRegistry.getPluginForLanguage(language),
    getAllPlugins: () => previewPluginRegistry.getAllPlugins(),
    getSupportedLanguages: () => previewPluginRegistry.getSupportedLanguages(),
    canExecuteLanguage: (language: ArtifactLanguage) =>
      previewPluginRegistry.canExecuteLanguage(language),
    canPreviewLanguage: (language: ArtifactLanguage) =>
      previewPluginRegistry.canPreviewLanguage(language),
    getAvailablePluginsForLanguage: (language: ArtifactLanguage) =>
      previewPluginRegistry.getAvailablePluginsForLanguage(language),
    hasPlugin: (type: string) => previewPluginRegistry.hasPlugin(type),
    getPluginByName: (name: string) =>
      previewPluginRegistry.getPluginByName(name),
    clear: () => previewPluginRegistry.clear(),
    reset: () => previewPluginRegistry.reset(),
  };
}

// Component for rendering a preview using the registry
interface PluginRendererProps
  extends Omit<PreviewProps, "onExecute" | "isExecuting"> {
  selectedPlugin?: string;
  onPluginChange?: (plugin: string) => void;
  showPluginSelector?: boolean;
}

export function PluginRenderer({
  content,
  language,
  selectedPlugin,
  onPluginChange,
  showPluginSelector = true,
  className = "",
}: PluginRendererProps) {
  const { getAvailablePluginsForLanguage, getPluginForLanguage, getPlugin } =
    usePreviewPluginRegistry();

  const availablePlugins = getAvailablePluginsForLanguage(language);
  const defaultPlugin = getPluginForLanguage(language);

  // If no plugin is selected, use the default one
  const activePluginType = selectedPlugin || defaultPlugin?.type;
  const activePlugin = activePluginType
    ? getPlugin(activePluginType)
    : defaultPlugin;

  if (!activePlugin) {
    return (
      <div className={`p-8 text-center text-muted-foreground ${className}`}>
        <p>No preview available for {language}</p>
      </div>
    );
  }

  const PluginComponent = activePlugin.component;

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {showPluginSelector && availablePlugins.length > 1 && (
        <div className="p-2 border-b bg-muted/30">
          <select
            value={activePluginType}
            onChange={(e) => onPluginChange?.(e.target.value)}
            className="w-full p-2 text-sm border rounded bg-background"
            aria-label="Select preview plugin"
            title="Select preview plugin"
          >
            {availablePlugins.map((plugin) => (
              <option key={plugin.type} value={plugin.type}>
                {plugin.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          <PluginComponent
            content={content}
            language={language}
            className="w-full h-full"
          />
        </React.Suspense>
      </div>
    </div>
  );
}

// Provider component for making the registry available
interface PreviewPluginProviderProps {
  children: React.ReactNode;
  customPlugins?: PreviewPlugin[];
}

export function PreviewPluginProvider({
  children,
  customPlugins = [],
}: PreviewPluginProviderProps) {
  React.useEffect(() => {
    // Register custom plugins
    for (const plugin of customPlugins) {
      previewPluginRegistry.register(plugin);
    }

    return () => {
      // Cleanup: unregister custom plugins
      for (const plugin of customPlugins) {
        previewPluginRegistry.unregister(plugin.type);
      }
    };
  }, [customPlugins]);

  return <>{children}</>;
}
