import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas — A premium AI assistant" },
      { name: "description", content: "Chat with Atlas, a fast, accurate AI assistant with markdown, code highlighting, and conversation history." },
      { property: "og:title", content: "Atlas — A premium AI assistant" },
      { property: "og:description", content: "Chat with Atlas, a fast, accurate AI assistant." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate({ to: data.session ? "/c" : "/auth", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-primary grid place-items-center animate-pulse">
          <Sparkles className="h-5 w-5 text-brand-foreground" />
        </div>
        <span className="text-sm">Loading Atlas…</span>
      </div>
    </div>
  );
}
