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
  const url = `https://api.day.app/${config.token}/${encodedTitle}/${encodedBody}`;

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
