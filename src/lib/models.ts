export type ModelOption = {
  id: string;
  label: string;
  description: string;
};

export const MODELS: ModelOption[] = [
  { id: "gpt-4o-mini", label: "Nova Mini", description: "Fast, low-cost OpenAI model" },
  { id: "gpt-4o", label: "Nova", description: "Premium OpenAI quality" },
  { id: "gpt-4.1-mini", label: "Nova 4.1 Mini", description: "Balanced speed and quality" },
  { id: "gpt-4.1", label: "Nova 4.1", description: "Higher quality reasoning" },
];

export const DEFAULT_MODEL = MODELS[0].id;
