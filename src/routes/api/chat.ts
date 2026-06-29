import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { DEFAULT_MODEL } from "@/lib/models";
import type { Database } from "@/integrations/supabase/types";

const SYSTEM_PROMPT = `You are Atlas, a helpful, concise, and friendly AI assistant.
Format responses with Markdown. Use fenced code blocks with language identifiers for code.
Use tables, lists, and headings to organize complex answers. Be accurate and admit uncertainty.`;

type ChatBody = {
  messages?: UIMessage[];
  threadId?: string;
  model?: string;
};

function getUserClient(token: string) {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    global: { headers: { Authorization: `Bearer ${token}`, apikey: key } },
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

const isDev = process.env.NODE_ENV !== "production";
const log = (...args: unknown[]) => {
  if (isDev) console.log("[api/chat]", ...args);
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
          }
          const token = auth.slice(7);

          let body: ChatBody;
          try {
            body = (await request.json()) as ChatBody;
          } catch {
            return new Response("Invalid JSON body", { status: 400 });
          }
          const { messages, threadId, model } = body;
          if (!Array.isArray(messages) || messages.length === 0 || !threadId) {
            return new Response("Bad request: messages[] and threadId required", { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            console.error("[api/chat] Missing LOVABLE_API_KEY");
            return new Response("AI is not configured (missing API key)", { status: 500 });
          }

          const supabase = getUserClient(token);
          const { data: userData, error: userErr } = await supabase.auth.getUser(token);
          if (userErr || !userData.user) {
            return new Response("Unauthorized", { status: 401 });
          }
          const userId = userData.user.id;
          log("user:", userId, "thread:", threadId, "msgs:", messages.length);

          const { data: thread, error: tErr } = await supabase
            .from("threads")
            .select("id,title")
            .eq("id", threadId)
            .maybeSingle();
          if (tErr || !thread) return new Response("Thread not found", { status: 404 });

          const latest = messages[messages.length - 1];
          if (latest?.role === "user") {
            const { error: insErr } = await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "user",
              parts: latest.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
            });
            if (insErr) console.error("[api/chat] persist user msg failed:", insErr.message);

            if (thread.title === "New chat") {
              const text = latest.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join(" ")
                .trim()
                .slice(0, 60);
              if (text) {
                await supabase.from("threads").update({ title: text }).eq("id", threadId);
              }
            }
          }

          const gateway = createLovableAiGatewayProvider(key);
          const selectedModel = model && model.length > 0 ? model : DEFAULT_MODEL;
          log("model:", selectedModel);

          const result = streamText({
            model: gateway(selectedModel),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
            onError: ({ error }) => {
              console.error("[api/chat] streamText error:", error);
            },
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages,
            onFinish: async ({ responseMessage }) => {
              try {
                await supabase.from("messages").insert({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts: responseMessage.parts as unknown as Database["public"]["Tables"]["messages"]["Insert"]["parts"],
                });
              } catch (e) {
                console.error("[api/chat] persist assistant msg failed:", e);
              }
            },
            onError: (err) => {
              console.error("[api/chat] stream onError:", err);
              const msg = err instanceof Error ? err.message : String(err);
              if (msg.includes("429")) return "Rate limited. Please slow down and try again.";
              if (msg.includes("402"))
                return "AI credits exhausted. Add credits to keep chatting.";
              return "The AI service returned an error. Please try again.";
            },
          });
        } catch (err) {
          console.error("[api/chat] handler exception:", err);
          const msg = err instanceof Error ? err.message : "AI gateway error";
          const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
          return new Response(msg, { status });
        }
      },
    },
  },
});
