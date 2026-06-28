export type ModelOption = {
  id: string;
  label: string;
  description: string;
};

export const MODELS: ModelOption[] = [
  { id: "google/gemini-3-flash-preview", label: "Atlas 3 Flash", description: "Fast, balanced default" },
  { id: "google/gemini-3.5-flash", label: "Atlas 3.5 Flash", description: "Stronger reasoning, still fast" },
  { id: "google/gemini-3.1-pro-preview", label: "Atlas 3 Pro", description: "Deep reasoning & long context" },
  { id: "openai/gpt-5-mini", label: "Nova Mini", description: "Lower-cost OpenAI choice" },
  { id: "openai/gpt-5", label: "Nova", description: "Premium OpenAI quality" },
];

export const DEFAULT_MODEL = MODELS[0].id;
