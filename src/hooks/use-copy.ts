"use client";

import { useState } from "react";

export function useCopy() {
	const [copied, setCopied] = useState(false);

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			return true;
		} catch (err) {
			console.error("Failed to copy text: ", err);
			setCopied(false);
			return false;
		}
	};

	return { copied, copy };
}
