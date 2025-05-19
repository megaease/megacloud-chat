"use client";

import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

export interface UseScrollToBottomOptions {
	/**
	 * Scroll behavior, defaults to "smooth"
	 */
	behavior?: ScrollBehavior;

	/**
	 * How many pixels from bottom to consider "near bottom", defaults to 100
	 */
	bottomThreshold?: number;

	/**
	 * Whether to automatically scroll to bottom on initial mount, defaults to true
	 */
	scrollOnMount?: boolean;

	/**
	 * Whether to force scroll to bottom after content changes, defaults to false
	 */
	forceScrollOnNewContent?: boolean;
}

/**
 * Smart scroll-to-bottom hook
 * Uses MutationObserver to monitor content changes
 */
export function useScrollToBottom(options: UseScrollToBottomOptions = {}) {
	const {
		behavior = "smooth",
		bottomThreshold = 100,
		scrollOnMount = true,
		forceScrollOnNewContent = false,
	} = options;

	// References for container and bottom element
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const endRef = useRef<HTMLDivElement>(null);

	// User scrolling intention
	const isUserScrolling = useRef(false);
	const lastContentHeight = useRef(0);

	// Public state
	const [isAtBottom, setIsAtBottom] = useState(true);

	// Check if near bottom
	const checkIfNearBottom = useCallback(() => {
		const container = scrollAreaRef.current;
		if (!container) return false;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const scrollBottom = scrollTop + clientHeight;
		const distanceFromBottom = scrollHeight - scrollBottom;

		return distanceFromBottom <= bottomThreshold;
	}, [bottomThreshold]);

	// Scroll to bottom
	const scrollToBottom = useCallback(
		(withBehavior: ScrollBehavior = behavior) => {
			const container = scrollAreaRef.current;
			const end = endRef.current;

			if (!container || !end) return;

			// Use scrollIntoView, more reliable
			end.scrollIntoView({
				behavior: withBehavior,
				block: "end",
			});

			// Update state
			setIsAtBottom(true);
			isUserScrolling.current = false;
		},
		[behavior],
	);
	// Add DOM mutation listener
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const container = scrollAreaRef.current;
		if (!container) return;

		// Set initial height
		lastContentHeight.current = container.scrollHeight;

		// Scroll event listener
		const handleScroll = () => {
			const { scrollHeight } = container;

			// If content height didn't change but scroll position did, it's user scrolling
			if (scrollHeight === lastContentHeight.current) {
				const nearBottom = checkIfNearBottom();
				isUserScrolling.current = !nearBottom;
				setIsAtBottom(nearBottom);
			}

			// Update current content height
			lastContentHeight.current = scrollHeight;
		};

		container.addEventListener("scroll", handleScroll, { passive: true });

		// MutationObserver to monitor DOM changes
		const observer = new MutationObserver((mutations) => {
			// Check if child nodes have changed
			const hasChildrenChanged = mutations.some(
				(mutation) =>
					mutation.type === "childList" &&
					(mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0),
			);

			if (hasChildrenChanged) {
				console.log("DOM changes detected: message list updated");

				// If user hasn't manually scrolled, or force scroll is enabled, scroll to bottom
				if (!isUserScrolling.current || forceScrollOnNewContent) {
					// Delay scrolling to ensure DOM updates are complete
					setTimeout(() => {
						scrollToBottom();
					}, 100);
				}
			}
		});

		// Observer configuration
		const observerConfig = {
			childList: true, // Observe changes to child nodes
			subtree: true, // Observe all descendant nodes
		};

		observer.observe(container, observerConfig);

		return () => {
			container.removeEventListener("scroll", handleScroll);
			observer.disconnect();
		};
	}, [
		scrollOnMount,
		checkIfNearBottom,
		scrollToBottom,
		forceScrollOnNewContent,
	]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useLayoutEffect(() => {
		if (scrollOnMount) {
			scrollToBottom("auto");
		}
	}, []);
	const scrollToBottomOnSubmit = useCallback(() => {
		setTimeout(() => {
			isUserScrolling.current = false;
			scrollToBottom();
		}, 100);
	}, [scrollToBottom]);

	return {
		scrollAreaRef,
		endRef,
		isAtBottom,
		scrollToBottom: scrollToBottomOnSubmit,
	};
}
