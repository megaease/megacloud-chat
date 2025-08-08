"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  IconLoader2,
  IconSend,
  IconSquare,
  IconPaperclip,
  IconX,
  IconFileText,
  IconPhoto,
  IconVideo,
  IconMusic,
  IconFile,
} from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MCPToggle } from "@/components/mcp/mcp-toggle";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList }
  ) => void;
  handleStopGeneration: () => void;
  mcpEnabled: boolean;
  toggleMcpEnabled: () => boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isUploading?: boolean;
  className?: string;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  handleStopGeneration,
  mcpEnabled,
  toggleMcpEnabled,
  status,
  isUploading = false,
  className = "",
}: ChatInputProps) {
  const t = useTranslations("Chat");
  const tCommon = useTranslations("Common");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; url: string; contentType: string }>
  >([]);
  const [uploadingFiles, setUploadingFiles] = useState<
    Map<string, { name: string; contentType: string; previewUrl?: string }>
  >(new Map());
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    contentType: string;
  } | null>(null);

  // 获取文件类型图标
  const getFileTypeIcon = (contentType: string) => {
    if (contentType.startsWith("image/")) {
      return <IconPhoto className="h-4 w-4" />;
    }
    if (contentType === "application/pdf") {
      return <IconFileText className="h-4 w-4" />;
    }
    if (contentType.includes("text/")) {
      return <IconFileText className="h-4 w-4" />;
    }
    return <IconFile className="h-4 w-4" />;
  };

  // 判断是否为图片文件
  const isImageFile = (contentType: string) => {
    return contentType.startsWith("image/");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input?.trim() || uploadedFiles.length > 0) {
        const event = new Event("submit", {
          cancelable: true,
          bubbles: true,
        }) as unknown as React.FormEvent<HTMLFormElement>;

        // 将已上传的文件转换为附件格式
        const attachments = uploadedFiles;
        handleSubmit(event, {
          experimental_attachments: attachments as unknown as FileList,
        });

        // 清空已上传的文件
        setUploadedFiles([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      // 过滤支持的文件类型
      const supportedFiles = selectedFiles.filter((file) => {
        const isImage = file.type.startsWith("image/");
        const isPDF = file.type === "application/pdf";
        return isImage || isPDF;
      });

      if (supportedFiles.length !== selectedFiles.length) {
        console.warn(
          "Some files were filtered out due to unsupported file types"
        );
      }

      // 立即上传文件
      for (const file of supportedFiles) {
        const fileName = file.name;
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        setUploadingFiles(
          (prev) =>
            new Map([
              ...prev,
              [
                fileName,
                { name: fileName, contentType: file.type, previewUrl },
              ],
            ])
        );

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to upload ${file.name}`);
          }

          const data = await response.json();

          setUploadedFiles((prev) => [
            ...prev,
            {
              name: data.pathname,
              url: data.url,
              contentType: data.contentType,
            },
          ]);
        } catch (error) {
          console.error("Upload failed:", error);
        } finally {
          setUploadingFiles((prev) => {
            const newMap = new Map(prev);
            const fileInfo = newMap.get(fileName);
            if (fileInfo?.previewUrl) {
              URL.revokeObjectURL(fileInfo.previewUrl);
            }
            newMap.delete(fileName);
            return newMap;
          });
        }
      }
    }
  };

  return (
    <div
      className={`relative max-w-4xl text-center w-full mx-auto ${className} mb-2 px-4`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();

          const attachments = uploadedFiles.map((file) => ({
            url: file.url,
            contentType: file.contentType,
            name: file.name,
          }));

          handleSubmit(e, {
            experimental_attachments:
              attachments.length > 0
                ? (attachments as unknown as FileList)
                : undefined,
          });

          // 清空已上传的文件
          setUploadedFiles([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        className="relative"
      >
        <div className="relative rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/90 dark:bg-gray-800/90 shadow-sm transition-all duration-300 ease-in-out focus-within:shadow-md focus-within:border-primary/50 hover:shadow-md group backdrop-blur-sm">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            multiple
            accept="image/*,.pdf"
            aria-label="Upload files"
            title="Upload files"
          />
          {uploadedFiles.length > 0 || uploadingFiles.size > 0 ? (
            <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-200/60 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/50">
              {/* 显示正在上传的文件 */}
              {Array.from(uploadingFiles).map(([fileName, fileInfo]) => (
                <div
                  key={`uploading-${fileName}`}
                  className={`relative group ${
                    isImageFile(fileInfo.contentType)
                      ? "rounded-lg overflow-hidden"
                      : "flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-lg text-sm shadow-sm"
                  }`}
                >
                  {isImageFile(fileInfo.contentType) && fileInfo.previewUrl ? (
                    <div className="relative">
                      <img
                        src={fileInfo.previewUrl}
                        alt={fileInfo.name}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <IconLoader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {getFileTypeIcon(fileInfo.contentType)}
                      <IconLoader2 className="h-3 w-3 animate-spin" />
                      <span className="truncate max-w-32">{fileInfo.name}</span>
                    </>
                  )}
                </div>
              ))}

              {/* 显示已上传的文件 */}
              {uploadedFiles.map((file) => (
                <div
                  key={file.url}
                  className={`relative group ${
                    isImageFile(file.contentType)
                      ? "rounded-lg overflow-hidden shadow-md"
                      : "flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-200/60 dark:border-gray-700/60 rounded-lg text-sm shadow-sm"
                  }`}
                >
                  {isImageFile(file.contentType) ? (
                    <>
                      <div
                        className="cursor-pointer"
                        onClick={() => {
                          setPreviewFile({
                            url: file.url,
                            name: file.name,
                            contentType: file.contentType,
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPreviewFile({
                              url: file.url,
                              name: file.name,
                              contentType: file.contentType,
                            });
                          }
                        }}
                        aria-label={`Open ${file.name}`}
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-20 w-20 rounded-lg object-cover hover:opacity-80 transition-opacity"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60"
                        onClick={() => {
                          setUploadedFiles((prev) =>
                            prev.filter((f) => f.url !== file.url)
                          );
                        }}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1 py-1 transition-colors"
                        onClick={() => {
                          setPreviewFile({
                            url: file.url,
                            name: file.name,
                            contentType: file.contentType,
                          });
                        }}
                        aria-label={`预览 ${file.name}`}
                      >
                        {getFileTypeIcon(file.contentType)}
                        <span className="truncate max-w-32">{file.name}</span>
                      </button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0 rounded-full bg-white/90 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-xs hover:shadow-sm transition-all duration-200"
                        onClick={() => {
                          setUploadedFiles((prev) =>
                            prev.filter((f) => f.url !== file.url)
                          );
                        }}
                      >
                        <IconX className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : null}
          <Textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            className="min-h-30 w-full resize-none border-0 bg-transparent px-4 py-4 pr-14 focus-visible:ring-0 
						focus-visible:ring-offset-0 placeholder:text-muted-foreground/70 selection:bg-primary/20 pb-14 text-sm leading-relaxed"
            rows={2}
            autoFocus
          />

          {/* MCP Toggle */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <MCPToggle
              mcpEnabled={mcpEnabled}
              toggleMcpEnabled={toggleMcpEnabled}
            />
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {/* Upload button */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-xs hover:shadow-sm transition-all duration-200 hover:scale-105 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <IconPaperclip className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Upload images or PDF files</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {status === "submitted" || status === "streaming" ? (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      onClick={handleStopGeneration}
                      variant="ghost"
                      className="h-9 w-9 rounded-lg bg-primary text-primary-foreground 
											hover:text-primary-foreground
											shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-primary disabled:hover:shadow-sm active:scale-95"
                      type="button"
                    >
                      <IconSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Stop generation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input?.trim() || isUploading}
                      className="h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-primary disabled:hover:shadow-sm active:scale-95"
                    >
                      {isUploading ? (
                        <IconLoader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <IconSend className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>{isUploading ? tCommon("loading") : t("send")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </form>

      {/* 文件预览对话框 */}
      <FilePreviewDialog
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || ""}
        fileName={previewFile?.name}
        fileType={previewFile?.contentType || ""}
      />
    </div>
  );
}
