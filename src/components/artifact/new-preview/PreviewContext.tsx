"use client";

import React, { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";
import type { PreviewState } from "./types";
import type { ArtifactLanguage } from "@/lib/artifact-types";

interface PreviewContextType {
  state: PreviewState;
  dispatch: React.Dispatch<PreviewAction>;
  currentLanguage: ArtifactLanguage | null;
  setCurrentLanguage: (language: ArtifactLanguage) => void;
}

type PreviewAction =
  | { type: "SET_VIEW_MODE"; payload: "code" | "preview" }
  | { type: "SET_EXECUTING"; payload: boolean }
  | { type: "SET_COPY_STATUS"; payload: "idle" | "copied" }
  | { type: "SET_HTML_VIEW_MODE"; payload: "desktop" | "tablet" | "mobile" }
  | { type: "SET_CONSOLE_OUTPUT"; payload: string }
  | { type: "SET_CONSOLE_ERROR"; payload: string }
  | { type: "SET_STATUS"; payload: "idle" | "streaming" | "error" | "loading" }
  | { type: "RESET_CONSOLE" };

const initialState: PreviewState = {
  viewMode: "code",
  isExecuting: false,
  copyStatus: "idle",
  htmlViewMode: "desktop",
  consoleOutput: "",
  consoleError: "",
  status: "idle",
};

function previewReducer(
  state: PreviewState,
  action: PreviewAction
): PreviewState {
  switch (action.type) {
    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.payload };
    case "SET_EXECUTING":
      return { ...state, isExecuting: action.payload };
    case "SET_COPY_STATUS":
      return { ...state, copyStatus: action.payload };
    case "SET_HTML_VIEW_MODE":
      return { ...state, htmlViewMode: action.payload };
    case "SET_CONSOLE_OUTPUT":
      return { ...state, consoleOutput: action.payload };
    case "SET_CONSOLE_ERROR":
      return { ...state, consoleError: action.payload };
    case "SET_STATUS":
      return { ...state, status: action.payload };
    case "RESET_CONSOLE":
      return { ...state, consoleOutput: "", consoleError: "" };
    default:
      return state;
  }
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(previewReducer, initialState);
  const [currentLanguage, setCurrentLanguage] =
    React.useState<ArtifactLanguage | null>(null);

  return (
    <PreviewContext.Provider
      value={{
        state,
        dispatch,
        currentLanguage,
        setCurrentLanguage,
      }}
    >
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error("usePreview must be used within a PreviewProvider");
  }
  return context;
}

// Action creators for easier usage
export const previewActions = {
  setViewMode: (mode: "code" | "preview") => ({
    type: "SET_VIEW_MODE" as const,
    payload: mode,
  }),
  setExecuting: (executing: boolean) => ({
    type: "SET_EXECUTING" as const,
    payload: executing,
  }),
  setCopyStatus: (status: "idle" | "copied") => ({
    type: "SET_COPY_STATUS" as const,
    payload: status,
  }),
  setHtmlViewMode: (mode: "desktop" | "tablet" | "mobile") => ({
    type: "SET_HTML_VIEW_MODE" as const,
    payload: mode,
  }),
  setConsoleOutput: (output: string) => ({
    type: "SET_CONSOLE_OUTPUT" as const,
    payload: output,
  }),
  setConsoleError: (error: string) => ({
    type: "SET_CONSOLE_ERROR" as const,
    payload: error,
  }),
  setStatus: (status: "idle" | "streaming" | "error" | "loading") => ({
    type: "SET_STATUS" as const,
    payload: status,
  }),
  resetConsole: () => ({ type: "RESET_CONSOLE" as const }),
};
