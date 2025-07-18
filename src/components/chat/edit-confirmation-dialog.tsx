"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IconSparkles, IconCheck, IconX } from "@tabler/icons-react";

interface EditConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (regenerateAI: boolean, deleteSubsequent: boolean) => void;
  hasSubsequentMessages: boolean;
  isLoading?: boolean;
}

export function EditConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  hasSubsequentMessages,
  isLoading = false,
}: EditConfirmationDialogProps) {
  const t = useTranslations("Common");
  const tChat = useTranslations("Chat");
  
  const [regenerateAI, setRegenerateAI] = useState(true);
  const [deleteSubsequent, setDeleteSubsequent] = useState(hasSubsequentMessages);

  const handleConfirm = () => {
    onConfirm(regenerateAI, deleteSubsequent);
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconSparkles className="w-5 h-5 text-blue-600" />
            Message Edited Successfully
          </DialogTitle>
          <DialogDescription>
            Your message has been updated. What would you like to do next?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Regenerate AI response option */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="regenerate-ai"
              checked={regenerateAI}
              onCheckedChange={(checked) => setRegenerateAI(checked as boolean)}
              disabled={isLoading}
            />
            <div className="space-y-1">
              <label
                htmlFor="regenerate-ai"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Regenerate AI response
              </label>
              <p className="text-xs text-muted-foreground">
                Generate a new AI response based on your edited message
              </p>
            </div>
          </div>

          {/* Delete subsequent messages option */}
          {hasSubsequentMessages && (
            <div className="flex items-start space-x-3">
              <Checkbox
                id="delete-subsequent"
                checked={deleteSubsequent}
                onCheckedChange={(checked) => setDeleteSubsequent(checked as boolean)}
                disabled={isLoading}
              />
              <div className="space-y-1">
                <label
                  htmlFor="delete-subsequent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remove subsequent messages
                </label>
                <p className="text-xs text-muted-foreground">
                  Delete all messages that came after this one to maintain conversation flow
                </p>
              </div>
            </div>
          )}

          {/* Info message */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 Tip: Regenerating the AI response ensures the conversation stays coherent with your changes.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="gap-1.5"
          >
            <IconX className="w-4 h-4" />
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="gap-1.5"
          >
            <IconCheck className="w-4 h-4" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
