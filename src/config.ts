/**
 * Configuration loader for the Bark plugin
 */

import * as fs from "fs";
import * as path from "path";
import type { PluginConfig } from "./types.js";

const CONFIG_FILE_NAME = "opencode-message-notify.json";
const CONFIG_DIR = ".config/opencode";

/**
 * Get the user's home directory
 */
function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || "/tmp";
}

/**
 * Get the configuration file path
 */
function getConfigPath(): string {
  const homeDir = getHomeDir();
  return path.join(homeDir, CONFIG_DIR, CONFIG_FILE_NAME);
}

/**
 * Load configuration from the user's config file
 * Falls back to environment variables and defaults
 */
export function loadConfig(): PluginConfig {
  const configPath = getConfigPath();

  // Default configuration
  const defaultConfig: PluginConfig = {
    notifyOnComplete: true,
    notifyOnPermission: true,
    includeUsageStats: true,
    includeMessageContent: true,
    title: "OpenCode",
  };

  // Try to load from config file
  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, "utf-8");
      const fileConfig = JSON.parse(fileContent);
      return { ...defaultConfig, ...fileConfig };
    } catch {
      // If config file is invalid, use defaults
      console.warn(`[opencode-message-notify] Invalid config file at ${configPath}`);
    }
  }

  // Load from environment variable as fallback
  const envToken = process.env.DAY_APP_TOKEN?.trim();
  if (envToken) {
    defaultConfig.token = envToken;
  }

  return defaultConfig;
}
