import type { Plugin } from "@opencode-ai/plugin"
import type { UsageStats, PluginEvent } from "./types.js"
import { loadConfig } from "./config.js"
import { sendBarkNotification, formatUsageStats } from "./bark.js"

export const DayAppHooksPlugin: Plugin = async ({ project }) => {
    const config = loadConfig();

    // Build notification title
    const title = config.title
      ? `${config.title} ${project?.id || ""}`
      : `OpenCode ${project?.id || ""}`;

    // Track accumulated data
    let messageContents = "";

    let usage: UsageStats = {
      cost: 0,
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    };

    /**
     * Send a notification to Bark
     */
    const send = async (body: string): Promise<void> => {
      await sendBarkNotification(config, title, body);
    };

    return {
      event: async ({ event }) => {
        // Handle message part updates
        if (event.type === "message.part.updated" && event.properties?.part) {
          const { part } = event.properties;

          // Capture text content from the agent
          if (part.type === "text" && part.messageID) {
            messageContents = part.text || "";
          }

          // Accumulate usage statistics from step completion
          if (part.type === "step-finish") {
            // Cost
            usage.cost += part.cost ?? 0;

            // Tokens
            if (part.tokens) {
              usage.input += part.tokens.input ?? 0;
              usage.output += part.tokens.output ?? 0;
              usage.reasoning += part.tokens.reasoning ?? 0;

              if (part.tokens.cache) {
                usage.cacheRead += part.tokens.cache.read ?? 0;
                usage.cacheWrite += part.tokens.cache.write ?? 0;
              }
            }
          }
        }

        // Handle session completion
        if (event.type === "session.idle" && config.notifyOnComplete) {
          let summary = "";

          if (config.includeUsageStats) {
            const statsFormatted = formatUsageStats(usage, messageContents.trim());
            summary = statsFormatted;
          } else if (config.includeMessageContent && messageContents.trim()) {
            summary = messageContents.trim();
          }

          if (!summary.trim()) {
            summary = "✅ Session completed successfully";
          }

          await send(summary);
        }
      },

      /**
       * Handle permission requests
       */
      "permission.ask": async (input: { type?: string }) => {
        if (config.notifyOnPermission) {
          const message = input.type
            ? `🔐 Need Permission: ${input.type}`
            : "🔐 Need Permission";
          await send(message);
        }
      },
    };
  };

export default DayAppHooksPlugin;
