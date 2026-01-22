/**
 * Bark notification service
 */

import type { PluginConfig, UsageStats } from "./types.js";

/**
 * Send a notification via Bark app
 */
export async function sendBarkNotification(
  config: PluginConfig,
  title: string,
  body: string
): Promise<void> {
  if (!config.token?.trim()) {
    return;
  }

  if (!body.trim()) {
    return;
  }

  const encodedTitle = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(body.trim());

  // Build URL path
  let path = `/${config.token}/${encodedTitle}`;
  if (config.subtitle?.trim()) {
    path += `/${encodeURIComponent(config.subtitle.trim())}`;
  }
  path += `/${encodedBody}`;

  // Build query parameters
  const params = new URLSearchParams();
  if (config.url?.trim()) {
    params.append("url", config.url.trim());
  }
  if (config.group?.trim()) {
    params.append("group", config.group.trim());
  }
  if (config.icon?.trim()) {
    params.append("icon", config.icon.trim());
  }
  if (config.sound?.trim()) {
    params.append("sound", config.sound.trim());
  }
  if (config.call !== undefined && config.call !== null) {
    params.append("call", String(config.call));
  }
  if (config.ciphertext?.trim()) {
    params.append("ciphertext", config.ciphertext.trim());
  }
  if (config.level?.trim()) {
    params.append("level", config.level.trim());
  }

  const queryString = params.toString();
  const url = `https://api.day.app${path}${queryString ? `?${queryString}` : ""}`;

  try {
    await fetch(url);
  } catch {
    // Silently fail - notifications should not break the plugin
  }
}

/**
 * Format usage statistics as a string
 */
export function formatUsageStats(usage: UsageStats, messageContent: string): string {
  const parts: string[] = [];

  if (messageContent.trim()) {
    parts.push(messageContent.trim());
  }

  if (usage.cost > 0) {
    parts.push(`💰 Cost: ${usage.cost.toFixed(4)}`);
  }

  const tokenDetails: string[] = [];
  if (usage.input > 0) tokenDetails.push(`Input: ${usage.input.toLocaleString()}`);
  if (usage.output > 0) tokenDetails.push(`Output: ${usage.output.toLocaleString()}`);
  if (usage.reasoning > 0) tokenDetails.push(`Reasoning: ${usage.reasoning.toLocaleString()}`);

  if (tokenDetails.length > 0) {
    parts.push(`🧮 Tokens\n  - ${tokenDetails.join("\n  - ")}`);
  }

  if (usage.cacheRead > 0 || usage.cacheWrite > 0) {
    const cacheDetails: string[] = [];
    if (usage.cacheRead > 0) cacheDetails.push(`Read: ${usage.cacheRead.toLocaleString()}`);
    if (usage.cacheWrite > 0) cacheDetails.push(`Write: ${usage.cacheWrite.toLocaleString()}`);
    parts.push(`💾 Cache\n  - ${cacheDetails.join("\n  - ")}`);
  }

  return parts.join("\n\n");
}
