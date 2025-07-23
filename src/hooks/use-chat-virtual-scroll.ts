"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Message } from "@ai-sdk/react";

export interface UseChatVirtualScrollOptions {
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
   * 是否启用调试日志
   */
  debug?: boolean;
}

/**
 * 估算消息高度的简化函数
 */
function estimateMessageHeight(message: Message): number {
  const content = message.content || '';
  
  // 基础高度
  let baseHeight = 80; // 头像 + 边距
  
  // 文本内容高度估算
  const textLines = Math.max(1, Math.ceil(content.length / 80));
  baseHeight += textLines * 24;
  
  // 代码块额外高度
  const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;
  if (codeBlocks > 0) {
    baseHeight += codeBlocks * 200; // 每个代码块约200px
  }
  
  return Math.min(baseHeight, 800); // 限制最大高度
}

/**
 * 专为聊天优化的虚拟滚动hook
 * 核心特性：
 * 1. 默认从最后一条消息开始显示
 * 2. 智能的底部检测和自动滚动
 * 3. 平滑的用户交互体验
 */
export function useChatVirtualScroll(
  messages: Message[],
  options: UseChatVirtualScrollOptions = {}
) {
  const {
    behavior = "smooth",
    bottomThreshold = 80,
    overscan = 5,
    debug = false
  } = options;
  
  // 引用和状态
  const parentRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const hasInitializedRef = useRef(false);
  
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
  });
  
  // 检查是否在底部
  const checkIsAtBottom = useCallback(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement || !virtualizer || messages.length === 0) return true;

    const { scrollTop, clientHeight } = scrollElement;
    const totalSize = virtualizer.getTotalSize();
    const distanceFromBottom = totalSize - (scrollTop + clientHeight);

    return distanceFromBottom <= bottomThreshold;
  }, [virtualizer, bottomThreshold, messages.length]);
  
  // 滚动到底部函数
  const scrollToBottom = useCallback((forceBehavior?: ScrollBehavior) => {
    if (!virtualizer || messages.length === 0) return;

    const scrollBehavior = forceBehavior || behavior;

    if (debug) {
      console.log('[ChatVirtualScroll] Scrolling to bottom:', { 
        behavior: scrollBehavior, 
        messagesCount: messages.length 
      });
    }

    if (scrollBehavior === 'smooth') {
      // 平滑滚动：使用原生scrollTo
      const scrollElement = parentRef.current;
      if (scrollElement) {
        const totalSize = virtualizer.getTotalSize();
        scrollElement.scrollTo({
          top: totalSize,
          behavior: 'smooth'
        });
      }
    } else {
      // 立即滚动：使用virtualizer的scrollToIndex
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
      });
    }

    // 重置用户滚动标志
    isUserScrollingRef.current = false;
    
    // 更新底部状态
    setTimeout(() => {
      setIsAtBottom(checkIsAtBottom());
    }, scrollBehavior === 'smooth' ? 300 : 50);
  }, [virtualizer, messages.length, behavior, checkIsAtBottom, debug]);

  // 初始化：确保聊天从最新消息开始显示
  useEffect(() => {
    if (messages.length > 0 && virtualizer && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      if (debug) {
        console.log('[ChatVirtualScroll] Initializing at bottom, messages:', messages.length);
      }
      
      // 立即滚动到最后一条消息
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
      });
      
      setIsAtBottom(true);
      isUserScrollingRef.current = false;
    }
  }, [messages.length, virtualizer, debug]);

  // 监听滚动事件
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const nowAtBottom = checkIsAtBottom();
      
      // 如果用户向上滚动离开底部，标记为用户滚动
      if (!nowAtBottom && !isUserScrollingRef.current) {
        isUserScrollingRef.current = true;
        if (debug) {
          console.log('[ChatVirtualScroll] User scrolled away from bottom');
        }
      }
      
      // 如果回到底部，重置用户滚动标志
      if (nowAtBottom && isUserScrollingRef.current) {
        isUserScrollingRef.current = false;
        if (debug) {
          console.log('[ChatVirtualScroll] User scrolled back to bottom');
        }
      }
      
      setIsAtBottom(nowAtBottom);
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollElement.removeEventListener('scroll', handleScroll);
  }, [checkIsAtBottom, debug]);

  // 新消息自动滚动
  useEffect(() => {
    if (messages.length === 0) return;

    // 如果用户没有手动滚动，自动滚动到底部
    if (!isUserScrollingRef.current) {
      if (debug) {
        console.log('[ChatVirtualScroll] New message, auto-scrolling');
      }
      
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages.length, scrollToBottom, debug]);

  // 流式响应时的内容跟随
  useEffect(() => {
    if (messages.length === 0 || !virtualizer) return;

    // 如果用户在底部，跟随内容滚动
    if (!isUserScrollingRef.current && isAtBottom) {
      const scrollElement = parentRef.current;
      if (scrollElement) {
        // 使用平滑滚动跟随内容
        const totalSize = virtualizer.getTotalSize();
        scrollElement.scrollTo({
          top: totalSize,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, isAtBottom, virtualizer]);

  // 强制滚动到底部（用于按钮点击）
  const forceScrollToBottom = useCallback(() => {
    if (debug) {
      console.log('[ChatVirtualScroll] Force scroll to bottom');
    }
    isUserScrollingRef.current = false;
    scrollToBottom('smooth');
  }, [scrollToBottom, debug]);

  return {
    // 虚拟化器
    virtualizer,
    parentRef,
    
    // 状态
    isAtBottom,
    
    // 方法
    scrollToBottom: forceScrollToBottom,
    checkIsAtBottom,
  };
}
