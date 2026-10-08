import { Plugin } from "@opencode/plugin"
import type { Plugin as V1Plugin } from "@opencode-ai/plugin"
import type { PluginConfig, UsageStats } from "./types.js"
import { loadConfig } from "./config.js"
import { sendBarkNotification, formatUsageStats } from "./bark.js"

const PLUGIN_ID = "opencode-message-notify"

const EMPTY_USAGE: UsageStats = {
  cost: 0,
  input: 0,
  output: 0,
  reasoning: 0,
  cacheRead: 0,
  cacheWrite: 0,
}

const v1Plugin: V1Plugin = async ({ project }) => {
  const config = loadConfig()

  const title = config.title
    ? `${config.title} ${project?.id || ""}`
    : `OpenCode ${project?.id || ""}`

  let messageContents = ""

  let usage: UsageStats = {
    cost: 0,
    input: 0,
    output: 0,
    reasoning: 0,
    cacheRead: 0,
    cacheWrite: 0,
  }

  const send = async (body: string): Promise<void> => {
    await sendBarkNotification(config, title, body)
  }

  return {
    event: async ({ event }) => {
      if (event.type === "message.part.updated" && event.properties?.part) {
        const { part } = event.properties

        if (part.type === "text" && part.messageID) {
          messageContents = part.text || ""
        }

        if (part.type === "step-finish") {
          usage.cost += part.cost ?? 0

          if (part.tokens) {
            usage.input += part.tokens.input ?? 0
            usage.output += part.tokens.output ?? 0
            usage.reasoning += part.tokens.reasoning ?? 0

            if (part.tokens.cache) {
              usage.cacheRead += part.tokens.cache.read ?? 0
              usage.cacheWrite += part.tokens.cache.write ?? 0
            }
          }
        }
      }

      if (event.type === "message.part.updated" && config.notifyOnQuestion) {
        const { part } = event.properties || {}
        if (part?.type === "tool" && part.tool === "question" && part.state?.status === "running") {
          const questions = Array.isArray(part.state?.input?.questions)
            ? part.state.input.questions
            : []
          const total = questions.length
          const firstQuestion = questions[0]?.question
          let message = "❓ Need your input"
          if (total > 0) {
            message = `❓ ${total} question${total > 1 ? "s" : ""}`
            if (firstQuestion) {
              message = `${message}: ${firstQuestion}`
            }
          }
          await send(message)
        }
      }

      if (event.type === "session.idle" && config.notifyOnComplete) {
        let summary = ""

        if (config.includeUsageStats) {
          const statsFormatted = formatUsageStats(usage, messageContents.trim())
          summary = statsFormatted
        } else if (config.includeMessageContent && messageContents.trim()) {
          summary = messageContents.trim()
        }

        if (!summary.trim()) {
          summary = "✅ Session completed successfully"
        }

        await send(summary)
      }
    },

    "permission.ask": async (input: { type?: string }) => {
      if (config.notifyOnPermission) {
        const message = input.type
          ? `🔐 Need Permission: ${input.type}`
          : "🔐 Need Permission"
        await send(message)
      }
    },
  }
}

export default {
  ...Plugin.define({
    id: PLUGIN_ID,
    async setup(ctx) {
      const config: PluginConfig = { ...loadConfig(), ...ctx.options }

      if (!config.token?.trim()) return

      const title = `${config.title} ${ctx.location.project.id}`

      const send = (body: string): Promise<void> => sendBarkNotification(config, title, body)

      // Latest agent text and cumulative usage, tracked per session so
      // concurrent sessions no longer mix into each other's notifications.
      const sessionTexts = new Map<string, string>()
      const sessionUsages = new Map<string, UsageStats>()

      // The event stream is server-global, so one plugin instance per
      // location would otherwise notify once per open project. Terminal
      // events carry no location, so resolve the session's directory.
      const isLocalSession = async (sessionID: string, eventDirectory?: string): Promise<boolean> => {
        if (eventDirectory) return eventDirectory === ctx.location.directory
        try {
          const session = await ctx.session.get({ sessionID })
          return session?.location.directory === ctx.location.directory
        } catch {
          // Prefer a duplicate notification over a missed one.
          return true
        }
      }

      const assembleSummary = (sessionID: string): string => {
        let summary = ""
        if (config.includeUsageStats) {
          summary = formatUsageStats(
            sessionUsages.get(sessionID) ?? EMPTY_USAGE,
            (sessionTexts.get(sessionID) ?? "").trim()
          )
        } else if (config.includeMessageContent && sessionTexts.get(sessionID)?.trim()) {
          summary = sessionTexts.get(sessionID)!.trim()
        }
        return summary
      }

      const notifyTurnEnd = async (sessionID: string, failure?: string): Promise<void> => {
        const summary = assembleSummary(sessionID)
        const body = failure
          ? summary
            ? `${failure}\n\n${summary}`
            : failure
          : summary || "✅ Session completed successfully"
        sessionTexts.delete(sessionID)
        sessionUsages.delete(sessionID)
        await send(body)
      }

      const controller = new AbortController()
      void (async () => {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event.type === "session.text.ended") {
            sessionTexts.set(event.data.sessionID, event.data.text)
          } else if (event.type === "session.usage.updated") {
            sessionUsages.set(event.data.sessionID, {
              cost: event.data.cost,
              input: event.data.tokens.input,
              output: event.data.tokens.output,
              reasoning: event.data.tokens.reasoning,
              cacheRead: event.data.tokens.cache.read,
              cacheWrite: event.data.tokens.cache.write,
            })
          } else if (event.type === "permission.asked" && config.notifyOnPermission) {
            if (await isLocalSession(event.data.sessionID, event.location?.directory)) {
              await send(`🔐 Need Permission: ${event.data.action}`)
            }
          } else if (event.type === "session.execution.succeeded" && config.notifyOnComplete) {
            if (await isLocalSession(event.data.sessionID, event.location?.directory)) {
              await notifyTurnEnd(event.data.sessionID)
            }
          } else if (event.type === "session.execution.failed" && config.notifyOnComplete) {
            if (await isLocalSession(event.data.sessionID, event.location?.directory)) {
              await notifyTurnEnd(event.data.sessionID, `⛔ Task failed: ${event.data.error.message}`)
            }
          }
          // session.execution.interrupted is deliberately not notified: its
          // reasons (user interrupt, shutdown, inactivity) all mean a push
          // would be noise rather than news.
        }
      })().catch((error) => {
        // The abort on unload ends the stream; surface anything else instead
        // of silently muting notifications for the rest of the process.
        if (!controller.signal.aborted) {
          console.error("[opencode-message-notify] event stream ended:", error)
        }
      })

      if (config.notifyOnQuestion) {
        await ctx.tool.hook("execute.before", (event) => {
          if (event.tool !== "question") return

          const input = event.input as { questions?: Array<{ question?: string }> } | undefined
          const questions = Array.isArray(input?.questions) ? input!.questions : []
          const total = questions.length
          const firstQuestion = questions[0]?.question
          let message = "❓ Need your input"
          if (total > 0) {
            message = `❓ ${total} question${total > 1 ? "s" : ""}`
            if (firstQuestion) {
              message = `${message}: ${firstQuestion}`
            }
          }
          return send(message)
        })
      }

      return () => controller.abort()
    },
  }),

  // OpenCode v1 loads this entrypoint; keep the original behavior unchanged.
  server: v1Plugin,
}
