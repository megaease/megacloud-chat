import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import AppProviders from "@/components/app-providers";
import { ReactScanProvider } from "@/components/react-scan-provider";
import { ChatFlowProvider } from "@/context/chat-flow-context";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Megacloud Chat",
	description:
		"A chat app powered by Megacloud with multiple API providers support",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				{/* Pyodide 预加载 - 提升 Python 执行体验 */}
				<link
					rel="preload"
					href="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
					as="script"
				/>
				<link
					rel="preload"
					href="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.asm.wasm"
					as="fetch"
					crossOrigin="anonymous"
				/>
				<script
					src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"
					async
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ReactScanProvider>
					<div className="flex h-dvh w-full">
						<NextIntlClientProvider messages={messages}>
							<ChatFlowProvider>
								<AppProviders>{children}</AppProviders>
							</ChatFlowProvider>
						</NextIntlClientProvider>
					</div>
				</ReactScanProvider>
			</body>
		</html>
	);
}
