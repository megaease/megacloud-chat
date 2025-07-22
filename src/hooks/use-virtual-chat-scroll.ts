"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Message } from "@ai-sdk/react";

export interface UseVirtualChatScrollOptions {
  /**
   * 滚动行为，默认为 "smooth"
   */
  behavior?: ScrollBehavior;
  
  /**
   * 距离底部多少像素认为是"接近底部"，默认为 80
   */
  bottomThreshold?: number;
  
  /**
   * 预渲染项目数量，默认为 5
   */
  overscan?: number;
  
  /**
   * 流式响应时的滚动间隔（毫秒），默认为 150
   */
  streamingScrollInterval?: number;
  
  /**
   * 是否启用调试日志
   */
  debug?: boolean;
}

/**
 * 消息内容分析器
 */
interface MessageAnalysis {
  textLines: number;
  codeBlocks: number;
  codeLines: number;
  toolInvocations: number;
  attachments: number;
  hasImages: boolean;
  hasLongContent: boolean;
}

/**
 * 分析消息内容结构
 */
function analyzeMessage(message: Message): MessageAnalysis {
  const content = message.content || '';

  // 分析代码块
  const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
  const codeLines = codeBlocks.reduce((total, block) => {
    return total + Math.max(1, block.split('\n').length - 2); // 减去开始和结束的```行
  }, 0);

  // 移除代码块后的纯文本内容
  const textContent = content.replace(/```[\s\S]*?```/g, '');

  // 估算文本行数（考虑换行符和自动换行）
  const explicitLines = textContent.split('\n').length;
  const estimatedWrapLines = Math.ceil(textContent.length / 80); // 假设每行80字符
  const textLines = Math.max(explicitLines, estimatedWrapLines);

  // 工具调用分析
  const toolInvocations = message.toolInvocations?.length || 0;

  // 附件分析
  const attachments = message.experimental_attachments?.length || 0;
  const hasImages = message.experimental_attachments?.some(
    attachment => attachment.contentType?.startsWith('image/')
  ) || false;

  // 长内容检测
  const hasLongContent = content.length > 1000;

  return {
    textLines,
    codeBlocks: codeBlocks.length,
    codeLines,
    toolInvocations,
    attachments,
    hasImages,
    hasLongContent,
  };
}

/**
 * 改进的消息高度估算函数
 */
export function estimateMessageHeight(message: Message): number {
  const analysis = analyzeMessage(message);

  // 基础高度 - 根据角色和消息类型设置
  let baseHeight = 40; // 消息容器基础高度

  // 角色特定的头部高度
  switch (message.role) {
    case "assistant":
      baseHeight += 60; // AI头像 + 名称 + 边距
      break;
    case "user":
      baseHeight += 50; // 用户头像 + 边距
      break;
    case "system":
      baseHeight += 40; // 系统消息样式
      break;
    default:
      baseHeight += 50;
  }

  // 文本内容高度
  if (analysis.textLines > 0) {
    const lineHeight = 24; // 行高
    const textHeight = analysis.textLines * lineHeight;
    baseHeight += Math.min(textHeight, 600); // 限制文本最大高度
  }

  // 代码块高度 - 更精确的计算
  if (analysis.codeBlocks > 0) {
    // 每个代码块的头部（语言标签等）
    baseHeight += analysis.codeBlocks * 40;
    // 代码行高度
    const codeLineHeight = 20;
    const codeHeight = analysis.codeLines * codeLineHeight;
    baseHeight += Math.min(codeHeight, 500); // 限制代码块最大高度
  }

  // 工具调用高度
  if (analysis.toolInvocations > 0) {
    analysis.toolInvocations.forEach((_, index) => {
      const tool = message.toolInvocations?.[index];
      if (tool) {
        baseHeight += 80; // 工具调用头部

        // 工具参数显示
        if (tool.args) {
          const argsLength = JSON.stringify(tool.args).length;
          baseHeight += Math.min(Math.ceil(argsLength / 100) * 20, 120);
        }

        // 工具结果显示
        if (tool.result) {
          const resultLength = JSON.stringify(tool.result).length;
          baseHeight += Math.min(Math.ceil(resultLength / 100) * 20, 200);
        }
      }
    });
  }

  // 附件高度
  if (analysis.attachments > 0) {
    if (analysis.hasImages) {
      // 图片附件通常显示缩略图
      baseHeight += analysis.attachments * 120;
    } else {
      // 文件附件显示为文件名和图标
      baseHeight += analysis.attachments * 60;
    }
  }

  // 长内容的额外边距和样式
  if (analysis.hasLongContent) {
    baseHeight += 20; // 额外的边距和样式
  }

  // 确保最小高度
  return Math.max(baseHeight, 80);
}

/**
 * 节流函数
 */
function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * 优化的虚拟聊天滚动hook
 */
export function useVirtualChatScroll(
  messages: Message[],
  options: UseVirtualChatScrollOptions = {}
) {
  const {
    behavior = "smooth",
    bottomThreshold = 80,
    overscan = 5,
    streamingScrollInterval = 150,
    debug = false
  } = options;
  
  // 引用
  const parentRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 状态
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // 创建虚拟化器
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      const message = messages[index];
      if (!message) return 100;
      return estimateMessageHeight(message);
    }, [messages]),
    overscan,
    measureElement: (element) => {
      return element?.getBoundingClientRect().height ?? 0;
    },
  });
  


  // 改进的底部检测 - 使用单一可靠的方法
  const checkIsAtBottom = useCallback(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement || messages.length === 0) return true;

    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

    if (debug) {
      console.log('[VirtualChatScroll] Bottom check:', { scrollTop, scrollHeight, clientHeight, distanceFromBottom, threshold: bottomThreshold });
    }

    return distanceFromBottom <= bottomThreshold;
  }, [bottomThreshold, messages.length, debug]);

  // 优化的滚动到底部函数
  const scrollToBottom = useCallback((forceBehavior?: ScrollBehavior) => {
    const scrollElement = parentRef.current;
    if (!scrollElement || messages.length === 0) return;

    const scrollBehavior = forceBehavior || behavior;

    try {
      // 清除之前的滚动超时
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      // 方法1: 使用 scrollToIndex，但添加更好的错误处理
      if (virtualizer && messages.length > 0) {
        if (debug) {
          console.log('[VirtualChatScroll] Scrolling to bottom using scrollToIndex, messages count:', messages.length);
        }

        virtualizer.scrollToIndex(messages.length - 1, {
          align: 'end',
          behavior: scrollBehavior,
        });

        // 重置用户滚动标志
        isUserScrollingRef.current = false;

        // 延迟更新状态，确保滚动完成
        scrollTimeoutRef.current = setTimeout(() => {
          const isNowAtBottom = checkIsAtBottom();
          setIsAtBottom(isNowAtBottom);
          if (debug) {
            console.log('[VirtualChatScroll] Scroll completed, isAtBottom:', isNowAtBottom);
          }
        }, scrollBehavior === 'smooth' ? 300 : 50);

        return;
      }
    } catch (error) {
      if (debug) {
        console.log('[VirtualChatScroll] scrollToIndex failed:', error);
      }
    }

    // 方法2: fallback 到传统滚动
    try {
      if (debug) {
        console.log('[VirtualChatScroll] Using fallback scroll method');
      }
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: scrollBehavior,
      });

      isUserScrollingRef.current = false;

      scrollTimeoutRef.current = setTimeout(() => {
        const isNowAtBottom = checkIsAtBottom();
        setIsAtBottom(isNowAtBottom);
        if (debug) {
          console.log('[VirtualChatScroll] Fallback scroll completed, isAtBottom:', isNowAtBottom);
        }
      }, scrollBehavior === 'smooth' ? 300 : 50);
    } catch (error) {
      if (debug) {
        console.log('[VirtualChatScroll] Fallback scroll failed:', error);
      }
    }
  }, [virtualizer, messages.length, behavior, checkIsAtBottom, debug]);

  // 节流的滚动事件处理器
  const throttledScrollHandler = useCallback(
    throttle(() => {
      const scrollElement = parentRef.current;
      if (!scrollElement) return;

      const currentScrollTop = scrollElement.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTopRef.current;
      const isScrollingDown = currentScrollTop > lastScrollTopRef.current;

      // 更新最后滚动位置
      lastScrollTopRef.current = currentScrollTop;

      // 检查是否在底部
      const nowAtBottom = checkIsAtBottom();

      // 如果用户向上滚动且不在底部，标记为用户滚动
      if (isScrollingUp && !nowAtBottom) {
        isUserScrollingRef.current = true;
        if (debug) {
          console.log('[VirtualChatScroll] User scrolled up, marking as user scrolling');
        }
      }

      // 如果滚动到底部，重置用户滚动标志
      if (nowAtBottom && isUserScrollingRef.current) {
        isUserScrollingRef.current = false;
        if (debug) {
          console.log('[VirtualChatScroll] Scrolled back to bottom, resetting user scrolling flag');
        }
      }

      // 更新状态
      setIsAtBottom(nowAtBottom);

      if (debug) {
        console.log('[VirtualChatScroll] Scroll event:', {
          currentScrollTop,
          isScrollingUp,
          isScrollingDown,
          nowAtBottom,
          isUserScrolling: isUserScrollingRef.current
        });
      }
    }, 16), // 60fps
    [checkIsAtBottom, debug]
  );

  // 监听滚动事件
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', throttledScrollHandler, { passive: true });

    return () => {
      scrollElement.removeEventListener('scroll', throttledScrollHandler);
    };
  }, [throttledScrollHandler]);

  // 监听消息变化，自动滚动到底部
  useEffect(() => {
    if (messages.length === 0) return;

    // 如果用户没有手动滚动，自动滚动到底部
    if (!isUserScrollingRef.current) {
      if (debug) {
        console.log('[VirtualChatScroll] Messages changed, auto-scrolling to bottom. Count:', messages.length);
      }

      // 使用 requestAnimationFrame 确保 DOM 更新完成
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } else {
      if (debug) {
        console.log('[VirtualChatScroll] User is scrolling, skipping auto-scroll. Messages count:', messages.length);
      }
    }
  }, [messages.length, scrollToBottom, debug]);

  // 监听消息内容变化（用于流式响应）
  useEffect(() => {
    if (messages.length === 0) return;

    // 获取最后一条消息的内容长度
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // 如果用户在底部且不是手动滚动，持续滚动到底部
    if (!isUserScrollingRef.current && isAtBottom) {
      if (debug) {
        console.log('[VirtualChatScroll] Message content changed, auto-scrolling for streaming');
      }

      // 使用较短的延迟来跟上流式响应
      const timer = setTimeout(() => {
        scrollToBottom('auto'); // 使用instant滚动避免动画延迟
      }, streamingScrollInterval);

      return () => clearTimeout(timer);
    }
  }, [messages, isAtBottom, scrollToBottom, streamingScrollInterval, debug]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 强制滚动到底部的函数（用于用户点击按钮等）
  const forceScrollToBottom = useCallback(() => {
    if (debug) {
      console.log('[VirtualChatScroll] Force scrolling to bottom');
    }
    isUserScrollingRef.current = false;
    scrollToBottom('smooth');
  }, [scrollToBottom, debug]);

  // 立即滚动到底部（无动画）
  const scrollToBottomInstant = useCallback(() => {
    if (debug) {
      console.log('[VirtualChatScroll] Instant scroll to bottom');
    }
    isUserScrollingRef.current = false;
    scrollToBottom('auto');
  }, [scrollToBottom, debug]);

  return {
    // 虚拟化器相关
    virtualizer,
    parentRef,

    // 状态
    isAtBottom,
    isUserScrolling: isUserScrollingRef.current,

    // 方法
    scrollToBottom: forceScrollToBottom,
    scrollToBottomInstant,
    checkIsAtBottom,
  };
}
