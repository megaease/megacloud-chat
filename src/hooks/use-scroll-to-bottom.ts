"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseScrollToBottomOptions {
	/**
	 * Scroll behavior, defaults to "smooth"
	 */
	behavior?: ScrollBehavior;
	/**
	 * How many pixels from bottom to consider "scrolled to bottom", defaults to 200
	 */
	bottomThreshold?: number;
	/**
	 * Whether to automatically scroll to bottom when component mounts, defaults to true
	 */
	scrollOnMount?: boolean;
	/**
	 * Whether to automatically scroll to bottom when content changes, defaults to true
	 */
	scrollOnContentChange?: boolean;
	/**
	 * Whether to adapt to Radix UI ScrollArea component, defaults to false
	 */
	adaptRadixScrollArea?: boolean;
	/**
	 * Delay time (ms) when scrolling to bottom, defaults to 0
	 */
	scrollDelay?: number;
}

/**
 * Custom Hook for managing scroll-to-bottom behavior
 * @param options Configuration options
 * @returns Scroll state and control methods, as well as scrollAreaRef and messagesEndRef
 */
export function useScrollToBottom(options: UseScrollToBottomOptions = {}) {
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const isFirstScrollRef = useRef(true);

	const {
		behavior = "smooth",
		bottomThreshold = 200,
		scrollOnMount = true,
		scrollOnContentChange = true,
		adaptRadixScrollArea = false,
		scrollDelay = 0,
	} = options;

	const [autoScroll, setAutoScroll] = useState(true);
	const [hasScrolledUp, setHasScrolledUp] = useState(false);
	const observerRef = useRef<MutationObserver | null>(null);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Get the actual scroll container element (handles Radix UI ScrollArea case)
	const getScrollContainer = useCallback((): HTMLElement | null => {
		if (!scrollAreaRef.current) return null; // Use scrollAreaRef.current directly

		if (adaptRadixScrollArea) {
			// For Radix UI's ScrollArea component, we need to get its inner viewport
			const radixViewport = scrollAreaRef.current.querySelector?.(
				"[data-radix-scroll-area-viewport]",
			) as HTMLElement;

			if (radixViewport) return radixViewport;
		}

		return scrollAreaRef.current; // Use scrollAreaRef.current directly
	}, [adaptRadixScrollArea]); // scrollAreaRef itself is stable

	// Detect scroll position
	const checkScrollPosition = useCallback(() => {
		const scrollContainer = getScrollContainer();
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const isNearBottom =
			scrollHeight - scrollTop - clientHeight < bottomThreshold;

		setHasScrolledUp(!isNearBottom);
		setAutoScroll(isNearBottom);
	}, [getScrollContainer, bottomThreshold]);

	// Function to scroll to bottom
	const scrollToBottom = useCallback(() => {
		// Clear any previous delayed scrolling
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}

		scrollTimeoutRef.current = setTimeout(() => {
			const scrollContainer = getScrollContainer();
			if (!scrollContainer) return;

			scrollContainer.scrollTo({
				top: scrollContainer.scrollHeight,
				behavior: isFirstScrollRef.current ? "auto" : behavior,
			});

			if (isFirstScrollRef.current) {
				isFirstScrollRef.current = false;
			}

			setAutoScroll(true);
			setHasScrolledUp(false);
		}, scrollDelay);
	}, [getScrollContainer, behavior, scrollDelay]);

	// Initialize and clean up scroll event listeners
	useEffect(() => {
		const scrollContainer = getScrollContainer();
		if (!scrollContainer) return;

		// Listen for scroll events
		scrollContainer.addEventListener("scroll", checkScrollPosition);

		// Initial scroll to bottom
		if (scrollOnMount) {
			scrollToBottom();
		}

		return () => {
			// Check if scrollContainer still exists before removing listener
			if (scrollContainer) {
				scrollContainer.removeEventListener("scroll", checkScrollPosition);
			}
			// Clean up any existing timeouts
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
		// Add scrollAreaRef.current to dependencies to re-run when the ref is attached
	}, [
		scrollAreaRef.current,
		getScrollContainer,
		checkScrollPosition,
		scrollToBottom,
		scrollOnMount,
	]);

	// Monitor content changes, auto-scroll to bottom
	useEffect(() => {
		if (!scrollOnContentChange) return;

		const scrollContainer = getScrollContainer();
		if (!scrollContainer) return;

		// Clean up previous observer
		if (observerRef.current) {
			observerRef.current.disconnect();
		}

		// Create MutationObserver instance
		observerRef.current = new MutationObserver(() => {
			if (autoScroll) {
				scrollToBottom();
			}
		});

		// Start observing
		observerRef.current.observe(scrollContainer, {
			childList: true, // Observe direct child node changes
			subtree: true, // Observe all descendant node changes
			characterData: true, // Observe text content changes
		});

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
		// Add scrollAreaRef.current to dependencies
	}, [
		scrollAreaRef.current,
		autoScroll,
		scrollOnContentChange,
		getScrollContainer,
		scrollToBottom,
	]);

	return {
		autoScroll,
		hasScrolledUp,
		scrollToBottom,
		setAutoScroll,
		checkScrollPosition,
		scrollAreaRef, // Return scrollAreaRef
		messagesEndRef, // Return messagesEndRef
	};
}
