import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Provider for OpenAI's API (https://api.openai.com/v1).
 * Reads OPENAI_API_KEY from server env and authenticates via Bearer token.
 */
export function createOpenAiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "openai",
    baseURL: "https://api.openai.com/v1",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

// Backwards-compat export name used elsewhere in the codebase.
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAiProvider(apiKey);
}
