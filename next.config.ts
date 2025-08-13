/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** @type {import("next").NextConfig} */
const config: NextConfig = {
	experimental: {
		reactCompiler: true,
	},
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(config);
