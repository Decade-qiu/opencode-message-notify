export const DayAppHooksPlugin = async ({ project }) => {
    const token = process.env.DAY_APP_TOKEN?.trim();
    if (!token) return {};

    const title = `Opencode ${project?.id}`;

    const send = async (body) => {
        if (!body?.trim()) return;
        const t = encodeURIComponent(title);
        const b = encodeURIComponent(body.trim());
        const url = `https://api.day.app/${token}/${t}/${b}`;
        try {
            await fetch(url);
        } catch { }
    };

    // ===== Session statistics =====
    let messageContents = "";

    let usage = {
        cost: 0,
        input: 0,
        output: 0,
        reasoning: 0,
        cacheRead: 0,
        cacheWrite: 0,
    };

    return {
        event: async ({ event }) => {
            if (event.type === "message.part.updated" && event.properties?.part) {
                const { part } = event.properties;

                if (part.type === "text" && part.messageID) {
                    messageContents = part.text;
                }

                // ===== Step settlement (only statistical point) =====
                if (part.type === "step-finish") {
                    // cost
                    usage.cost += part.cost ?? 0;

                    // tokens
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

            // ===== Session end unified notification =====
            if (event.type === "session.idle") {
                const summary = `✅ ${messageContents || "Session completed successfully"}\n\n💰 Cost: ${usage.cost}\n🧮 Tokens:\n  - Input: ${usage.input}\n  - Output: ${usage.output}\n  - Reasoning: ${usage.reasoning}\n  - Cache Read: ${usage.cacheRead}\n  - Cache Write: ${usage.cacheWrite}`.trim();

                await send(summary);
            }
        },

        "permission.ask": async (input) => {
            await send(`Need Perission: ${input.type}`);
        },
    };
};
