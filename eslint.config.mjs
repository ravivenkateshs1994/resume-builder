import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

function stripNextPlugin(config) {
  if (!config.plugins || !Object.prototype.hasOwnProperty.call(config.plugins, "@next/next")) {
    return config;
  }

  const { ["@next/next"]: _nextPlugin, ...plugins } = config.plugins;
  if (Object.keys(plugins).length === 0) {
    const { plugins: _ignored, ...rest } = config;
    return rest;
  }

  return { ...config, plugins };
}

const nextConfigs = [...nextVitals, ...nextTs].map(stripNextPlugin);

export default defineConfig([
  ...nextConfigs,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "public/**",
    "package.json",
    "next-env.d.ts",
    "eslint.config.mjs",
  ]),
]);