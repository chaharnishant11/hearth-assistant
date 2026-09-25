import Anthropic from "@anthropic-ai/sdk";

// Pin the public API: the shell running the dev server may set ANTHROPIC_BASE_URL to something else.
export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://api.anthropic.com",
});

export const CLAUDE_MODEL = "claude-opus-5";
