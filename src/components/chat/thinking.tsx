"use client";

import { IconLoader2, IconWaveSquare } from "@tabler/icons-react";
import { motion } from "framer-motion";

export function Thinking() {
	return (
		<motion.div
			className="flex items-center justify-center gap-2 max-w-xs w-auto mx-auto py-1.5 px-3 rounded-full border border-primary/10 shadow-sm dark:border-primary/30"
			style={{
				background: "rgba(var(--background), 0.6)",
				backdropFilter: "blur(8px)",
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
			}}
			initial={{ opacity: 0, y: 5 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
		>
			<WaveformAnimation />
			<div className="relative">
				<motion.span
					className="text-primary text-xs font-medium dark:text-primary/90"
					animate={{ opacity: [0.8, 1, 0.8] }}
					transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
				>
					Thinking...
				</motion.span>
			</div>
		</motion.div>
	);
}

function WaveformAnimation() {
	return (
		<div className="flex items-end h-3 space-x-0.5">
			{[0.3, 0.6, 0.4, 0.8, 0.5].map((height, index, arr) => (
				<motion.div
					key={`${height}-${index}-${arr.length}`}
					className="w-0.5 bg-primary/90 dark:bg-primary/80 rounded-full"
					initial={{ height: "30%" }}
					animate={{
						height: [
							`${height * 100}%`,
							`${(1 - height) * 100}%`,
							`${height * 100}%`,
						],
					}}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						delay: index * 0.1,
						ease: "easeInOut",
					}}
				/>
			))}
		</div>
	);
}
