// Smoke check for the OpenCode v2 plugin entrypoint.
// Uses the event shapes the real OpenCode v2 server emits (verified against
// a live server): turn ends fire session.execution.succeeded/.failed, which
// carry no location, while session.text.ended / permission.asked may carry
// one. Fails if the v2 event wiring, location filtering, cleanup, or the v1
// server() fallback breaks.

import assert from "node:assert/strict"

const barkCalls = []
globalThis.fetch = async (url) => {
  barkCalls.push(decodeURIComponent(String(url)))
  return { ok: true }
}

async function waitFor(check) {
  const deadline = Date.now() + 2000
  while (!check()) {
    if (Date.now() > deadline) throw new Error("timed out waiting for Bark calls")
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

function createEventFeed() {
  const feed = []
  const wakeups = []
  return {
    push(event) {
      feed.push(event)
      for (const wake of wakeups.splice(0)) wake()
    },
    // AsyncIterable mirroring the server stream: blocks when drained,
    // ends on abort, and can be fed more events later.
    subscribe({ signal } = {}) {
      return (async function* () {
        let index = 0
        while (!signal?.aborted) {
          if (index < feed.length) {
            yield feed[index++]
            continue
          }
          await new Promise((resolve) => {
            wakeups.push(resolve)
            signal?.addEventListener("abort", resolve, { once: true })
          })
        }
      })()
    },
  }
}

const { default: plugin } = await import("../dist/index.js")

// Dual v1/v2 entrypoint shape (v2 calls setup(), v1 calls server()).
assert.equal(typeof plugin.setup, "function", "default export must expose a v2 setup()")
assert.equal(typeof plugin.server, "function", "default export must expose a v1 server()")

const sessions = {
  ses_1: { location: { directory: "/repo" } },
  ses_2: { location: { directory: "/repo" } },
  ses_3: { location: { directory: "/elsewhere" } },
}

const feed = createEventFeed()
let questionHook
const cleanup = await plugin.setup({
  location: { directory: "/repo", project: { id: "proj_1" } },
  options: {
    token: "TESTTOKEN",
    title: "OC",
    notifyOnComplete: true,
    notifyOnPermission: true,
    notifyOnQuestion: true,
    includeUsageStats: true,
    includeMessageContent: true,
  },
  event: { subscribe: feed.subscribe },
  tool: {
    hook: async (_name, callback) => {
      questionHook = callback
    },
  },
  session: {
    get: async ({ sessionID }) => sessions[sessionID],
  },
})

// A completed turn sends the agent's message plus cumulative usage.
// session.execution.succeeded carries no location, so this also exercises
// the session.get() location lookup.
feed.push({ type: "session.text.ended", location: { directory: "/repo" }, data: { sessionID: "ses_1", text: "All done, shipped it." } })
feed.push({
  type: "session.usage.updated",
  data: { sessionID: "ses_1", cost: 0.0235, tokens: { input: 100, output: 50, reasoning: 10, cache: { read: 20, write: 5 } } },
})
feed.push({ type: "session.execution.succeeded", data: { sessionID: "ses_1" } })
await waitFor(() => barkCalls.length >= 1)
assert(
  barkCalls[0].startsWith("https://api.day.app/TESTTOKEN/"),
  `turn-end notification must use the configured token, got ${barkCalls[0]}`
)
assert(barkCalls[0].includes("OC proj_1"), "notification title must use plugin options over env/config")
assert(barkCalls[0].includes("All done, shipped it."), "turn-end notification must include the agent text")
assert(barkCalls[0].includes("Cost: 0.0235"), "turn-end notification must include session usage cost")
assert(barkCalls[0].includes("Input: 100"), "turn-end notification must include input tokens")

// A permission prompt notifies.
feed.push({ type: "permission.asked", data: { sessionID: "ses_2", action: "edit" } })
await waitFor(() => barkCalls.length >= 2)
assert(barkCalls[1].includes("Need Permission: edit"), "permission.asked must be notified")

// Sessions from another location (event location present or resolved via
// session.get) must not notify: one subscription sees the whole server.
feed.push({ type: "session.text.ended", location: { directory: "/elsewhere" }, data: { sessionID: "ses_3", text: "other project" } })
feed.push({
  type: "session.usage.updated",
  data: { sessionID: "ses_3", cost: 9, tokens: { input: 1, output: 1, reasoning: 1, cache: { read: 1, write: 1 } } },
})
feed.push({ type: "session.execution.succeeded", data: { sessionID: "ses_3" } })
feed.push({ type: "permission.asked", location: { directory: "/elsewhere" }, data: { sessionID: "ses_3", action: "edit" } })

// A failed turn notifies with the failure, not a success message. The loop
// processes events in order, so the failed notification below also proves
// the foreign-location events above were skipped without notifying.
feed.push({ type: "session.execution.failed", data: { sessionID: "ses_2", error: { type: "provider", message: "boom" } } })
await waitFor(() => barkCalls.length >= 3)
assert.equal(barkCalls.length, 3, "foreign-location sessions must not notify")
assert(barkCalls[2].includes("Task failed: boom"), "failed turn must include the error message")
assert(!barkCalls[2].includes("Session completed successfully"), "failed turn must not claim success")

// The question tool sends a notification; other tools stay silent.
assert.ok(questionHook, "execute.before hook must be registered")
await questionHook({ tool: "question", input: { questions: [{ question: "Which option?" }] } })
assert(barkCalls[3]?.includes("1 question"), "question tool call must be notified")
assert(barkCalls[3]?.includes("Which option?"), "question notification must include the question text")
await questionHook({ tool: "read", input: {} })
assert.equal(barkCalls.length, 4, "non-question tools must not notify")

// Cleanup stops event delivery.
cleanup()
feed.push({ type: "permission.asked", data: { sessionID: "ses_2", action: "shell" } })
await new Promise((resolve) => setTimeout(resolve, 150))
assert.equal(barkCalls.length, 4, "cleanup must stop notifications")

// Without a token the plugin stays inert: no subscription notifications,
// no tool hook.
const inertFeed = createEventFeed()
let hookRegistered = false
const inertCleanup = await plugin.setup({
  location: { directory: "/repo", project: { id: "proj_1" } },
  options: { token: "" },
  event: { subscribe: inertFeed.subscribe },
  tool: {
    hook: async () => {
      hookRegistered = true
    },
  },
  session: { get: async ({ sessionID }) => sessions[sessionID] },
})
inertFeed.push({ type: "session.execution.succeeded", data: { sessionID: "ses_1" } })
inertFeed.push({ type: "permission.asked", data: { sessionID: "ses_1", action: "edit" } })
await new Promise((resolve) => setTimeout(resolve, 150))
assert.equal(barkCalls.length, 4, "no token must mean no notifications")
assert.equal(hookRegistered, false, "no token must mean no tool hook")
inertCleanup?.()

// v1 fallback still returns the v1 hook shape.
const v1Hooks = await plugin.server({ project: { id: "proj_1" } })
assert.equal(typeof v1Hooks.event, "function", "v1 server() must return an event handler")
assert.equal(typeof v1Hooks["permission.ask"], "function", "v1 server() must return a permission.ask handler")

console.log("smoke ok: v2 wiring + location filter + cleanup + v1 fallback")
