"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseScrollToBottomOptions {
	/**
	 * 滚动行为，默认为 "smooth"
	 */
	behavior?: ScrollBehavior;
	/**
	 * 距离底部多少像素时认为已滚动到底部，默认为 200
	 */
	bottomThreshold?: number;
	/**
	 * 是否在组件挂载时自动滚动到底部，默认为 true
	 */
	scrollOnMount?: boolean;
	/**
	 * 是否在内容变化时自动滚动到底部，默认为 true
	 */
	scrollOnContentChange?: boolean;
	/**
	 * 是否适配 Radix UI 的 ScrollArea 组件，默认为 false
	 */
	adaptRadixScrollArea?: boolean;
	/**
	 * 滚动到底部时的延迟时间（毫秒），默认为 0
	 */
	scrollDelay?: number;
}

/**
 * 自定义 Hook，用于管理滚动到底部的行为
 * @param options 选项配置
 * @returns 滚动状态和控制方法，以及 scrollAreaRef 和 messagesEndRef
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

	// 获取真正的滚动容器元素（处理 Radix UI ScrollArea 的情况）
	const getScrollContainer = useCallback((): HTMLElement | null => {
		if (!scrollAreaRef.current) return null; // Use scrollAreaRef.current directly

		if (adaptRadixScrollArea) {
			// 对于 Radix UI 的 ScrollArea 组件，需要获取其内部的 viewport
			const radixViewport = scrollAreaRef.current.querySelector?.(
				"[data-radix-scroll-area-viewport]",
			) as HTMLElement;

			if (radixViewport) return radixViewport;
		}

		return scrollAreaRef.current; // Use scrollAreaRef.current directly
	}, [adaptRadixScrollArea]); // scrollAreaRef itself is stable

	// 检测滚动位置
	const checkScrollPosition = useCallback(() => {
		const scrollContainer = getScrollContainer();
		if (!scrollContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const isNearBottom =
			scrollHeight - scrollTop - clientHeight < bottomThreshold;

		setHasScrolledUp(!isNearBottom);
		setAutoScroll(isNearBottom);
	}, [getScrollContainer, bottomThreshold]);

	// 滚动到底部的函数
	const scrollToBottom = useCallback(() => {
		// 清除之前可能存在的延迟滚动
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

	// 初始化和清理滚动事件监听
	useEffect(() => {
		const scrollContainer = getScrollContainer();
		if (!scrollContainer) return;

		// 监听滚动事件
		scrollContainer.addEventListener("scroll", checkScrollPosition);

		// 初始滚动到底部
		if (scrollOnMount) {
			scrollToBottom();
		}

		return () => {
			// Check if scrollContainer still exists before removing listener
			if (scrollContainer) {
				scrollContainer.removeEventListener("scroll", checkScrollPosition);
			}
			// 清理可能存在的超时
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

	// 监听内容变化，自动滚动到底部
	useEffect(() => {
		if (!scrollOnContentChange) return;

		const scrollContainer = getScrollContainer();
		if (!scrollContainer) return;

		// 清理之前的 observer
		if (observerRef.current) {
			observerRef.current.disconnect();
		}

		// 创建 MutationObserver 实例
		observerRef.current = new MutationObserver(() => {
			if (autoScroll) {
				scrollToBottom();
			}
		});

		// 开始观察
		observerRef.current.observe(scrollContainer, {
			childList: true, // 观察直接子节点变化
			subtree: true, // 观察所有后代节点变化
			characterData: true, // 观察文本内容变化
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
