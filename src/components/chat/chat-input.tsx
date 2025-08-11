"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  IconLoader2,
  IconSend,
  IconSquare,
  IconPaperclip,
} from "@tabler/icons-react";
import {
  PromptInput,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MCPToggle } from "@/components/mcp/mcp-toggle";
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog";
import {
  FileUploadCompound,
  type UploadedFile,
} from "@/components/prompt-kit/file-upload";

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
}: ChatInputProps) {
  const t = useTranslations("Chat");
  const tCommon = useTranslations("Common");

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name?: string;
    contentType?: string;
  } | null>(null);

  const toFileList = (files: File[]): FileList | undefined => {
    if (!files || files.length === 0) return undefined;
    const dt = new DataTransfer();
    for (const f of files) {
      dt.items.add(f);
    }
    return dt.files;
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const attachments = toFileList(selectedFiles);
    handleSubmit(
      e,
      attachments ? { experimental_attachments: attachments } : undefined
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pb-4">
      <form onSubmit={onFormSubmit} className="w-full">
        <PromptInput
          value={input}
          onValueChange={(v) =>
            handleInputChange({
              target: { value: v },
            } as unknown as React.ChangeEvent<HTMLTextAreaElement>)
          }
          onSubmit={() => {
            const form = inputRef.current?.form;
            if (form) form.requestSubmit();
          }}
          className="relative overflow-hidden"
        >
          <FileUploadCompound
            value={uploadedFiles}
            onChange={setUploadedFiles}
            accept="image/*,.pdf"
            onSelectedFilesChange={setSelectedFiles}
          >
            <FileUploadCompound.PreviewBar
              onPreview={(file) =>
                setPreviewFile({
                  url: file.url,
                  name: file.name,
                  contentType: file.contentType,
                })
              }
              onRemove={(file) => {
                setSelectedFiles((prev) =>
                  prev.filter((f) => f.name !== file.name)
                );
              }}
            />

            <PromptInputTextarea
              ref={inputRef}
              placeholder={t("placeholder")}
              className="min-h-30 w-full border-0 bg-transparent px-4 py-4 pr-14 placeholder:text-muted-foreground/70 selection:bg-primary/20 pb-14 text-sm leading-relaxed"
              rows={2}
              autoFocus
            />

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <MCPToggle
                mcpEnabled={mcpEnabled}
                toggleMcpEnabled={toggleMcpEnabled}
              />
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <FileUploadCompound.Trigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-lg bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-xs hover:shadow-sm transition-all duration-200 hover:scale-105 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <IconPaperclip className="h-4 w-4 transition-transform group-hover:rotate-12" />
                      </Button>
                    </FileUploadCompound.Trigger>
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
                        className="h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:text-primary-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-primary/90 disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-primary disabled:hover:shadow-sm active:scale-95"
                        type="button"
                      >
                        <IconSquare className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{t("stopGeneration")}</p>
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
          </FileUploadCompound>
        </PromptInput>
      </form>

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
