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
	 * 滚动行为，默认为"smooth"
	 */
	behavior?: ScrollBehavior;

	/**
	 * 距离底部多少像素时认为已经"接近底部"，默认为 100
	 */
	bottomThreshold?: number;

	/**
	 * 初次挂载时是否自动滚动到底部，默认为 true
	 */
	scrollOnMount?: boolean;

	/**
	 * 是否在内容变化后强制滚动到底部，默认为 false
	 */
	forceScrollOnNewContent?: boolean;
}

/**
 * 智能滚动到底部的钩子函数
 * 使用 MutationObserver 监听内容变化
 */
export function useScrollToBottom(options: UseScrollToBottomOptions = {}) {
	const {
		behavior = "smooth",
		bottomThreshold = 100,
		scrollOnMount = true,
		forceScrollOnNewContent = false,
	} = options;

	// 容器和底部元素的引用
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const endRef = useRef<HTMLDivElement>(null);

	// 用户滚动意图
	const isUserScrolling = useRef(false);
	const lastContentHeight = useRef(0);

	// 公开状态
	const [isAtBottom, setIsAtBottom] = useState(true);

	// 检查是否接近底部
	const checkIfNearBottom = useCallback(() => {
		const container = scrollAreaRef.current;
		if (!container) return false;

		const { scrollTop, scrollHeight, clientHeight } = container;
		const scrollBottom = scrollTop + clientHeight;
		const distanceFromBottom = scrollHeight - scrollBottom;

		return distanceFromBottom <= bottomThreshold;
	}, [bottomThreshold]);

	// 滚动到底部
	const scrollToBottom = useCallback(
		(withBehavior: ScrollBehavior = behavior) => {
			const container = scrollAreaRef.current;
			const end = endRef.current;

			if (!container || !end) return;

			// 使用 scrollIntoView，更可靠
			end.scrollIntoView({
				behavior: withBehavior,
				block: "end",
			});

			// 更新状态
			setIsAtBottom(true);
			isUserScrolling.current = false;
		},
		[behavior],
	);
	// 添加 DOM 变化监听
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const container = scrollAreaRef.current;
		if (!container) return;

		// 设置初始高度
		lastContentHeight.current = container.scrollHeight;

		// 滚动事件监听
		const handleScroll = () => {
			const { scrollHeight } = container;

			// 如果内容高度没变但滚动位置变了，说明是用户滚动
			if (scrollHeight === lastContentHeight.current) {
				const nearBottom = checkIfNearBottom();
				isUserScrolling.current = !nearBottom;
				setIsAtBottom(nearBottom);
			}

			// 更新当前内容高度
			lastContentHeight.current = scrollHeight;
		};

		container.addEventListener("scroll", handleScroll, { passive: true });

		// MutationObserver 监听 DOM 变化
		const observer = new MutationObserver((mutations) => {
			// 检查是否有子节点变化
			const hasChildrenChanged = mutations.some(
				(mutation) =>
					mutation.type === "childList" &&
					(mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0),
			);

			if (hasChildrenChanged) {
				console.log("DOM 变化检测到：消息列表更新");

				// 如果用户没有手动滚动，或者强制滚动开启，滚动到底部
				if (!isUserScrolling.current || forceScrollOnNewContent) {
					// 延迟滚动，确保 DOM 更新完成
					setTimeout(() => {
						scrollToBottom();
					}, 100);
				}
			}
		});

		// 观察配置
		const observerConfig = {
			childList: true, // 观察子节点变化
			subtree: true, // 观察所有后代节点
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
