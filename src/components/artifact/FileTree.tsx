// components/artifact/FileTree.tsx
"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, FolderOpen, File } from "lucide-react";
import type { ReactAppFile } from "@/lib/artifact-types";

// 文件树节点类型
export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  language?: string;
  content?: string;
}

// 构建文件树结构的函数
export function buildFileTree(files: ReactAppFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  
  for (const file of files) {
    const parts = file.path.split("/");
    let currentLevel = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");
      
      let existingNode = currentLevel.find(node => node.name === part);
      
      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          type: isLast ? "file" : "folder",
          children: isLast ? undefined : [],
        };
        currentLevel.push(existingNode);
      }
      
      if (!isLast && existingNode.children) {
        currentLevel = existingNode.children;
      } else if (isLast) {
        existingNode.language = file.language;
        existingNode.content = file.content;
      }
    }
  }
  
  return root;
}

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedFile?: string;
  onFileSelect: (path: string) => void;
  level?: number;
}

export function FileTree({ nodes, selectedFile, onFileSelect, level = 0 }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent, node: FileTreeNode) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (node.type === "folder") {
        toggleFolder(node.path);
      } else {
        onFileSelect(node.path);
      }
    }
  };

  return (
    <div className="select-none">
      {nodes.map((node) => (
        <div key={node.path}>
          <div
            className={`flex items-center gap-1 px-2 py-1 hover:bg-accent cursor-pointer text-sm rounded-sm transition-colors ${
              selectedFile === node.path ? "bg-accent text-accent-foreground" : ""
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => {
              if (node.type === "folder") {
                toggleFolder(node.path);
              } else {
                onFileSelect(node.path);
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, node)}
            tabIndex={0}
            role="button"
            aria-label={node.type === "folder" ? `Folder ${node.name}` : `File ${node.name}`}
          >
            {node.type === "folder" ? (
              <>
                {expandedFolders.has(node.path) ? (
                  <ChevronDown className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 flex-shrink-0" />
                )}
                <FolderOpen className="h-3 w-3 flex-shrink-0" />
              </>
            ) : (
              <File className="h-3 w-3 flex-shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          {node.type === "folder" && 
           node.children && 
           expandedFolders.has(node.path) && (
            <FileTree
              nodes={node.children}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}