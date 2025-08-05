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

	// User scrolling intention and content tracking
	const isUserScrolling = useRef(false);
	const lastContentHeight = useRef(0);
	const scrollTimeoutId = useRef<NodeJS.Timeout | null>(null);

	// Public state
	const [isAtBottom, setIsAtBottom] = useState(true);

	// Check if near bottom - unified function
	const checkIfNearBottom = useCallback(() => {
		const container = scrollAreaRef.current;
		if (!container) return false;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const scrollBottom = scrollTop + clientHeight;
		const distanceFromBottom = scrollHeight - scrollBottom;

		return distanceFromBottom <= bottomThreshold;
	}, [bottomThreshold]);

	// Update isAtBottom state consistently
	const updateIsAtBottomState = useCallback(() => {
		const nearBottom = checkIfNearBottom();
		setIsAtBottom(nearBottom);
		return nearBottom;
	}, [checkIfNearBottom]);

	// Scroll to bottom
	const scrollToBottom = useCallback(
		(withBehavior: ScrollBehavior = behavior) => {
			const container = scrollAreaRef.current;
			const end = endRef.current;

			if (!container || !end) return;

			// Clear any pending scroll timeout
			if (scrollTimeoutId.current) {
				clearTimeout(scrollTimeoutId.current);
			}

			// Use scrollIntoView, more reliable
			end.scrollIntoView({
				behavior: withBehavior,
				block: "end",
			});

			// Reset user scrolling flag when we programmatically scroll
			isUserScrolling.current = false;

			// Update state immediately for instant mode, or after animation for smooth mode
			if (withBehavior === "auto") {
				setIsAtBottom(true);
			} else {
				// For smooth scrolling, wait for animation to complete
				scrollTimeoutId.current = setTimeout(() => {
					updateIsAtBottomState();
				}, 300); // Reasonable time for smooth scroll animation
			}
		},
		[behavior, updateIsAtBottomState],
	);
	// Add DOM mutation listener
	useEffect(() => {
		const container = scrollAreaRef.current;
		if (!container) return;

		// Set initial height
		lastContentHeight.current = container.scrollHeight;

		// Check initial position
		updateIsAtBottomState();

		// Scroll event listener
		const handleScroll = () => {
			// Clear any pending scroll timeout since user is manually scrolling
			if (scrollTimeoutId.current) {
				clearTimeout(scrollTimeoutId.current);
				scrollTimeoutId.current = null;
			}

			const nearBottom = updateIsAtBottomState();

			// If user scrolled away from bottom, mark as user scrolling
			if (!nearBottom && !isUserScrolling.current) {
				isUserScrolling.current = true;
			}

			// If user scrolled back to bottom, reset user scrolling flag
			if (nearBottom && isUserScrolling.current) {
				isUserScrolling.current = false;
			}

			// Update current content height
			lastContentHeight.current = container.scrollHeight;
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
				// Use requestAnimationFrame to ensure DOM updates are complete
				requestAnimationFrame(() => {
					const currentHeight = container.scrollHeight;
					const heightChanged = currentHeight !== lastContentHeight.current;

					if (heightChanged) {
						console.log(
							"DOM changes detected: content height changed from",
							lastContentHeight.current,
							"to",
							currentHeight,
						);

						// Update stored height
						lastContentHeight.current = currentHeight;

						// Decide whether to auto-scroll
						const shouldAutoScroll =
							!isUserScrolling.current || forceScrollOnNewContent;

						if (shouldAutoScroll) {
							// Auto-scroll to bottom
							scrollToBottom();
						} else {
							// Just update the state based on current position
							updateIsAtBottomState();
						}
					}
				});
			}
		});

		// Observer configuration
		const observerConfig = {
			childList: true, // Observe changes to child nodes
			subtree: true, // Observe all descendant nodes
		};

		observer.observe(container, observerConfig);

		// Cleanup function
		return () => {
			container.removeEventListener("scroll", handleScroll);
			observer.disconnect();
			if (scrollTimeoutId.current) {
				clearTimeout(scrollTimeoutId.current);
			}
		};
	}, [updateIsAtBottomState, scrollToBottom, forceScrollOnNewContent]); // 移除 checkIfNearBottom 依赖

	// Initial scroll to bottom on mount
	useLayoutEffect(() => {
		if (scrollOnMount) {
			const container = scrollAreaRef.current;
			const end = endRef.current;

			if (container && end) {
				// Use scrollIntoView with auto behavior for instant initial scroll
				end.scrollIntoView({
					behavior: "auto",
					block: "end",
				});

				// Update state and reset user scrolling flag
				setIsAtBottom(true);
				isUserScrolling.current = false;

				// Update stored height
				lastContentHeight.current = container.scrollHeight;
			}
		}
	}, [scrollOnMount]);

	// Enhanced scroll to bottom for external use (e.g., on submit)
	const scrollToBottomOnSubmit = useCallback(() => {
		// Reset user scrolling flag immediately
		isUserScrolling.current = false;
		// Scroll with a small delay to ensure any pending DOM updates
		requestAnimationFrame(() => {
			scrollToBottom();
		});
	}, [scrollToBottom]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (scrollTimeoutId.current) {
				clearTimeout(scrollTimeoutId.current);
			}
		};
	}, []);

	return {
		scrollAreaRef,
		endRef,
		isAtBottom,
		scrollToBottom: scrollToBottomOnSubmit,
	};
}
