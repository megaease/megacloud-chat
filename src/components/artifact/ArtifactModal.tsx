// components/artifact/ArtifactModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useArtifact } from "@/context/artifact-provider-context";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ArtifactModalProps {
  onClose?: () => void;
  chatPanel: React.ReactNode;
  children: React.ReactNode;
}

export function ArtifactModal({
  onClose,
  chatPanel,
  children,
}: ArtifactModalProps) {
  const { artifact, hideArtifact } = useArtifact();

  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setIsMobile(window.innerWidth < 768);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleClose = () => {
    hideArtifact();
    onClose?.();
  };

  if (!artifact.isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        data-testid="artifact-modal"
        className="fixed inset-0 z-50 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { delay: 0.4 } }}
      >
        {/* 移动端聊天面板覆盖层 */}
        {isMobile && showChat && (
          <motion.div
            className="absolute inset-0 bg-white dark:bg-white z-50"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Chat</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChat(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex-1">{chatPanel}</div>
            </div>
          </motion.div>
        )}

        {/* 桌面端：可调整大小的双面板布局 */}
        {!isMobile ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* 左侧聊天面板 */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
              <motion.div
                className="h-full bg-white dark:bg-white border-r"
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: {
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 30,
                  },
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                  transition: { duration: 0.2 },
                }}
              >
                {chatPanel}
              </motion.div>
            </ResizablePanel>

            {/* 可拖动的分隔条 */}
            <ResizableHandle />

            {/* 右侧内容面板 */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <motion.div
                className="h-full bg-background"
                initial={{
                  opacity: 1,
                  x: artifact.boundingBox.left,
                  y: artifact.boundingBox.top,
                  width: artifact.boundingBox.width,
                  height: artifact.boundingBox.height,
                  borderRadius: 12,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  width: "100%",
                  height: "100%",
                  borderRadius: 0,
                  transition: {
                    type: "spring",
                    stiffness: 200,
                    damping: 30,
                    duration: 0.6,
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  transition: {
                    delay: 0.1,
                    type: "spring",
                    stiffness: 600,
                    damping: 30,
                  },
                }}
              >
                {children}
              </motion.div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          /* 移动端：单面板布局 */
          <motion.div
            className="flex-1 bg-background flex flex-col"
            initial={{
              opacity: 1,
              x: artifact.boundingBox.left,
              y: artifact.boundingBox.top,
              width: artifact.boundingBox.width,
              height: artifact.boundingBox.height,
              borderRadius: 12,
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              width: windowDimensions.width,
              height: windowDimensions.height,
              borderRadius: 0,
              transition: {
                type: "spring",
                stiffness: 200,
                damping: 30,
                duration: 0.6,
              },
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: {
                delay: 0.1,
                type: "spring",
                stiffness: 600,
                damping: 30,
              },
            }}
          >
            {/* 为移动端渲染 children，传递额外的 props */}
            {React.isValidElement(children)
              ? React.cloneElement(children, {
                  onClose: handleClose,
                  onChatToggle: () => setShowChat(!showChat),
                  showChatButton: true,
                  isMobile: true,
                } as Record<string, unknown>)
              : children}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
