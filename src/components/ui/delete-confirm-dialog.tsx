"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface DeleteConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	itemName: string;
	itemType?: string;
}

export function DeleteConfirmDialog({
	open,
	onOpenChange,
	onConfirm,
	itemName,
	itemType = "Artifact",
}: DeleteConfirmDialogProps) {
	const t = useTranslations("ArtifactManager");
	const tCommon = useTranslations("Common");
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirm = async () => {
		setIsDeleting(true);
		try {
			await onConfirm();
		} finally {
			setIsDeleting(false);
			onOpenChange(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<Trash2 className="h-5 w-5 text-destructive" />
						{t("deleteConfirmTitle", { type: itemType })}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("deleteConfirmDescription", { name: itemName, type: itemType })}
						<br />
						<span className="text-destructive font-medium">
							{t("deleteConfirmWarning")}
						</span>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						{tCommon("cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? t("deleting") : t("confirmDelete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

// Hook for easier usage
export function useDeleteConfirm() {
	const [isOpen, setIsOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
	const [itemInfo, setItemInfo] = useState({ name: "", type: "Artifact" });

	const confirm = (
		action: () => void,
		itemName: string,
		itemType = "Artifact",
	) => {
		setPendingAction(() => action);
		setItemInfo({ name: itemName, type: itemType });
		setIsOpen(true);
	};

	const handleConfirm = () => {
		if (pendingAction) {
			pendingAction();
		}
	};

	const handleCancel = () => {
		setIsOpen(false);
		setPendingAction(null);
	};

	return {
		isOpen,
		confirm,
		handleConfirm,
		handleCancel,
		itemInfo,
	};
}
