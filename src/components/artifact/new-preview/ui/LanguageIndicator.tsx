"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Braces,
  Globe,
  Code,
  Zap,
  Database,
  Palette,
  FileText,
} from "lucide-react";

interface LanguageIndicatorProps {
  language: string;
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const languageConfig = {
  html: {
    icon: Globe,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-200",
    description: "HTML - Hypertext Markup Language",
  },
  css: {
    icon: Palette,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    description: "CSS - Cascading Style Sheets",
  },
  javascript: {
    icon: Zap,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-200",
    description: "JavaScript - Programming Language",
  },
  typescript: {
    icon: Code,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-200",
    description: "TypeScript - Typed JavaScript",
  },
  python: {
    icon: Braces,
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-200",
    description: "Python - Programming Language",
  },
  jsx: {
    icon: Code,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-200",
    description: "JSX - JavaScript XML",
  },
  tsx: {
    icon: Code,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-200",
    description: "TSX - TypeScript XML",
  },
  json: {
    icon: Braces,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    description: "JSON - JavaScript Object Notation",
  },
  markdown: {
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    borderColor: "border-indigo-200",
    description: "Markdown - Markup Language",
  },
  sql: {
    icon: Database,
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-200",
    description: "SQL - Structured Query Language",
  },
  // Default configuration for unknown languages
  default: {
    icon: Code,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-200",
    description: "Unknown Language",
  },
};

export function LanguageIndicator({
  language,
  showIcon = true,
  showTooltip = true,
  className = "",
}: LanguageIndicatorProps) {
  const normalizedLanguage = language.toLowerCase();
  const config =
    languageConfig[normalizedLanguage as keyof typeof languageConfig] ||
    languageConfig.default;
  const Icon = config.icon;

  const badgeContent = (
    <Badge
      variant="outline"
      className={`
        capitalize text-xs font-medium
        ${config.color} 
        ${config.bgColor} 
        ${config.borderColor}
        border
        ${className}
      `}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {language}
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Additional component for displaying language status
interface LanguageStatusProps extends LanguageIndicatorProps {
  status?: "ready" | "loading" | "error" | "unsupported";
}

export function LanguageStatus({
  language,
  status = "ready",
  showIcon = true,
  showTooltip = true,
  className = "",
}: LanguageStatusProps) {
  const normalizedLanguage = language.toLowerCase();
  const config =
    languageConfig[normalizedLanguage as keyof typeof languageConfig] ||
    languageConfig.default;
  const Icon = config.icon;

  const getStatusConfig = () => {
    switch (status) {
      case "loading":
        return {
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          borderColor: "border-orange-200",
          text: "Loading...",
          icon: "⏳",
        };
      case "error":
        return {
          color: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
          text: "Error",
          icon: "❌",
        };
      case "unsupported":
        return {
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
          text: "Unsupported",
          icon: "⚠️",
        };
      default:
        return {
          color: config.color,
          bgColor: config.bgColor,
          borderColor: config.borderColor,
          text: "Ready",
          icon: "✅",
        };
    }
  };

  const statusConfig = getStatusConfig();

  const badgeContent = (
    <Badge
      variant="outline"
      className={`
        capitalize text-xs font-medium
        ${statusConfig.color} 
        ${statusConfig.bgColor} 
        ${statusConfig.borderColor}
        border
        ${className}
      `}
    >
      <span className="mr-1">{statusConfig.icon}</span>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {language}
      <span className="ml-1 text-xs">({statusConfig.text})</span>
    </Badge>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm font-medium">{config.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Status: {statusConfig.text}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
