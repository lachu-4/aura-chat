import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Suggestions } from "@/components/chat/Suggestions";
import { PromptInput } from "@/components/chat/PromptInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread } from "@/lib/threads.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/c/")({
  component: NewChatLanding,
});

function NewChatLanding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createThread);
  const [pending, setPending] = useState(false);

  const startWith = useMutation({
    mutationFn: async (text: string) => {
      const row = await create({ data: {} });
      return { id: row!.id, text };
    },
    onSuccess: ({ id, text }) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      sessionStorage.setItem(`atlas:initial:${id}`, text);
      navigate({ to: "/c/$threadId", params: { threadId: id } });
    },
    onError: () => {
      toast.error("Could not start a new chat");
      setPending(false);
    },
  });

  const handleSend = (text: string) => {
    setPending(true);
    startWith.mutate(text);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center min-h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand to-primary grid place-items-center shadow-lg shadow-brand/30 mb-5"
          >
            <Sparkles className="h-7 w-7 text-brand-foreground" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance text-center gradient-text"
          >
            How can I help you today?
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="text-sm text-muted-foreground mt-2 mb-8 text-center"
          >
            Ask anything. Atlas writes code, explains ideas, and drafts your work.
          </motion.p>
          <Suggestions onPick={handleSend} />
        </div>
      </div>
      <div className="border-t bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <PromptInput onSend={handleSend} disabled={pending} />
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            Atlas can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
