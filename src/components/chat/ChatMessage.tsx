import { motion } from "framer-motion";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Share2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import type { UIMessage } from "ai";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  message: UIMessage;
  isStreaming?: boolean;
  isLast?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
  onDelete?: () => void;
}

export function ChatMessage({ message, isStreaming, isLast, onRegenerate, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied — share away");
      }
    } catch {
      /* user cancelled */
    }
  };

  if (message.role === "user") {
    if (editing) {
      return (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
          <div className="w-full max-w-2xl">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(8, draft.split("\n").length + 1)}
              className="w-full rounded-2xl border bg-card p-3 text-[15px] outline-none focus:ring-2 focus:ring-brand/30 resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (draft.trim()) {
                    onEdit?.(draft.trim());
                    setEditing(false);
                  }
                }}
              >
                Send
              </Button>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="group flex justify-end"
      >
        <div className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-3xl rounded-tr-md bg-user-bubble text-user-bubble-foreground px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {text}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <IconButton label="Edit" onClick={() => { setDraft(text); setEditing(true); }}>
              <Pencil className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Copy" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </IconButton>
            {onDelete && (
              <IconButton label="Delete" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="group flex gap-3"
    >
      <div className="shrink-0 h-8 w-8 rounded-xl bg-gradient-to-br from-brand to-primary grid place-items-center">
        <Sparkles className="h-4 w-4 text-brand-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("text-[15px] text-foreground", isStreaming && isLast && "typing-cursor")}>
          {text ? <MarkdownRenderer content={text} /> : (
            <div className="flex items-center gap-1.5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
            </div>
          )}
        </div>
        {!isStreaming && text && (
          <div className="flex items-center gap-0.5 mt-1 -ml-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <IconButton label="Copy" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </IconButton>
            {onRegenerate && isLast && (
              <IconButton label="Regenerate" onClick={onRegenerate}>
                <RefreshCw className="h-3.5 w-3.5" />
              </IconButton>
            )}
            <IconButton
              label="Good response"
              onClick={() => { setFeedback("up"); toast.success("Thanks for the feedback"); }}
              active={feedback === "up"}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton
              label="Bad response"
              onClick={() => { setFeedback("down"); toast.success("Thanks — we'll improve"); }}
              active={feedback === "down"}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton label="Share" onClick={share}>
              <Share2 className="h-3.5 w-3.5" />
            </IconButton>
            {onDelete && (
              <IconButton label="Delete" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
        active && "text-brand bg-accent",
      )}
    >
      {children}
    </button>
  );
}
