// Foundation for the optional AI Chat Assistant (Section 8, "Good to
// Have"). This module is intentionally provider-agnostic and does
// nothing until ANTHROPIC_API_KEY is set in .env - at that point the
// isConfigured()/chat() functions below are ready to be wired up to
// real report data. No AI SDK is called here yet; only the wiring.
//
// To finish this feature once you have a key:
//   1. npm install @anthropic-ai/sdk
//   2. Uncomment the client + chat() body below
//   3. Feed it real data: pull the relevant reports with the report
//      service / Sequelize queries and pass a summarized version of
//      them in as context (do NOT send raw password hashes or emails -
//      see the privacy note in the backend report).

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// buildContext(scope) is where you'd query the DB for the reports
// relevant to the manager's question (e.g. "last week, all members")
// and turn them into a compact text summary to feed the model as
// context, instead of dumping raw rows.
async function buildContext(/* scope */) {
  return "TODO: summarize relevant reports here once the AI feature is implemented.";
}

async function chat(/* userMessage, contextScope */) {
  if (!isConfigured()) {
    const err = new Error(
      "AI Chat Assistant is not configured yet. Set ANTHROPIC_API_KEY in your .env to enable this feature.",
    );
    err.statusCode = 501;
    throw err;
  }

  // --- Example of the intended integration (left commented out until a key exists) ---
  //
  try {
    const Anthropic = require("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const context = await buildContext(contextScope);
    const response = await client.messages.create({
      model: process.env.AI_MODEL || "claude-sonnet-4-6",
      max_tokens: 1000,
      system: `You are an assistant helping a manager understand their team's weekly
      reports. Use only the context provided; if the answer isn't in the
      context, say so instead of guessing.\n\nContext:\n${context}`,
      messages: [{ role: "user", content: userMessage }],
    });
    return response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
  } catch (error) {
    throw new Error("Not implemented");
  }
}

module.exports = { isConfigured, buildContext, chat };
