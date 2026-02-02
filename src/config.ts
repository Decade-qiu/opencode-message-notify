/**
 * Configuration loader for the Bark plugin
 */

import * as fs from "fs";
import * as path from "path";
import type { PluginConfig } from "./types.js";

const CONFIG_FILE_NAMES = ["opencode-notify.json", "opencode-message-notify.json"];
const CONFIG_DIR = ".config/opencode";

/**
 * Get the user's home directory
 */
function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || "/tmp";
}

/**
 * Get the configuration file path
 * Tries new filename first, falls back to old filename
 */
function getConfigPath(): string | null {
  const homeDir = getHomeDir();
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = path.join(homeDir, CONFIG_DIR, fileName);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  return null;
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
  if (configPath) {
    try {
      const fileContent = fs.readFileSync(configPath, "utf-8");
      const fileConfig = JSON.parse(fileContent);
      return { ...defaultConfig, ...fileConfig };
    } catch {
      console.warn(`[opencode-message-notify] Invalid config file at ${configPath}`);
    }
  }

  // Load from environment variables (env vars override defaults)
  if (process.env.DAY_APP_TOKEN?.trim()) {
    defaultConfig.token = process.env.DAY_APP_TOKEN.trim();
  }
  if (process.env.DAY_APP_TITLE?.trim()) {
    defaultConfig.title = process.env.DAY_APP_TITLE.trim();
  }
  if (process.env.DAY_APP_SUBTITLE?.trim()) {
    defaultConfig.subtitle = process.env.DAY_APP_SUBTITLE.trim();
  }
  if (process.env.DAY_APP_URL?.trim()) {
    defaultConfig.url = process.env.DAY_APP_URL.trim();
  }
  if (process.env.DAY_APP_GROUP?.trim()) {
    defaultConfig.group = process.env.DAY_APP_GROUP.trim();
  }
  if (process.env.DAY_APP_ICON?.trim()) {
    defaultConfig.icon = process.env.DAY_APP_ICON.trim();
  }
  if (process.env.DAY_APP_SOUND?.trim()) {
    defaultConfig.sound = process.env.DAY_APP_SOUND.trim();
  }
  if (process.env.DAY_APP_CALL?.trim()) {
    defaultConfig.call = process.env.DAY_APP_CALL.trim();
  }
  if (process.env.DAY_APP_CIPHERTEXT?.trim()) {
    defaultConfig.ciphertext = process.env.DAY_APP_CIPHERTEXT.trim();
  }
  if (process.env.DAY_APP_LEVEL?.trim()) {
    defaultConfig.level = process.env.DAY_APP_LEVEL.trim() as 'active' | 'timeSensitive' | 'passive' | 'critical';
  }

  return defaultConfig;
}
