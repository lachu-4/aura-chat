import { createFileRoute, useParams } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getThreadMessages, deleteMessage } from "@/lib/threads.functions";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { PromptInput } from "@/components/chat/PromptInput";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useChatContext } from "./c";

export const Route = createFileRoute("/_authenticated/c/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = useParams({ from: "/_authenticated/c/$threadId" });
  const { model } = useChatContext();

  const getMessages = useServerFn(getThreadMessages);
  const delMsg = useServerFn(deleteMessage);

  const { data: initial, isLoading } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: () => getMessages({ data: { threadId } }),
  });

  const initialMessages: UIMessage[] = useMemo(
    () =>
      (initial ?? []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        parts: (m.parts as UIMessage["parts"]) ?? [],
      })),
    [initial],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(input, { ...init, headers });
        },
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { messages, threadId, model, ...body },
        }),
      }),
    [threadId, model],
  );

  const { messages, sendMessage, status, stop, setMessages, regenerate } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => {
      const msg = err.message || "Something went wrong";
      if (msg.includes("429")) toast.error("Rate limited — please slow down");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Add credits to keep chatting.");
      else toast.error(msg);
    },
  });

  // Re-sync after initial load completes
  useEffect(() => {
    if (initial && initial.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // Auto-send pending message from landing
  useEffect(() => {
    const pending = sessionStorage.getItem(`atlas:initial:${threadId}`);
    if (pending) {
      sessionStorage.removeItem(`atlas:initial:${threadId}`);
      sendMessage({ text: pending });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(dist > 200);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!showScrollBtn) el.scrollTop = el.scrollHeight;
  }, [messages, showScrollBtn]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const isStreaming = status === "submitted" || status === "streaming";

  const handleEdit = (idx: number, newText: string) => {
    const trimmed = messages.slice(0, idx);
    setMessages(trimmed);
    sendMessage({ text: newText });
  };

  const handleDelete = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await delMsg({ data: { id } });
    } catch {
      toast.error("Could not delete message");
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {isLoading && messages.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  isStreaming={isStreaming}
                  isLast={idx === messages.length - 1}
                  onRegenerate={
                    m.role === "assistant" && idx === messages.length - 1 ? () => regenerate() : undefined
                  }
                  onEdit={m.role === "user" ? (text) => handleEdit(idx, text) : undefined}
                  onDelete={() => handleDelete(m.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              size="icon"
              variant="outline"
              onClick={scrollToBottom}
              className="h-9 w-9 rounded-full shadow-lg"
              aria-label="Scroll to latest"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="border-t bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <PromptInput
            onSend={(text) => sendMessage({ text })}
            onStop={stop}
            isStreaming={isStreaming}
          />
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            Atlas can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
