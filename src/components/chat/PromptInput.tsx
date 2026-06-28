import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send, Paperclip, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  onSend: (text: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

const MAX = 8000;

export function PromptInput({ onSend, onStop, isStreaming, disabled }: Props) {
  const [value, setValue] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [value]);

  const submit = () => {
    const v = value.trim();
    if (!v || isStreaming || disabled) return;
    onSend(v);
    setValue("");
    requestAnimationFrame(() => ref.current?.focus());
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        toast.info("File attachments are coming soon");
      }}
      className={cn(
        "relative rounded-3xl border bg-card/80 backdrop-blur transition-all",
        "shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:border-border focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/15",
        dragOver && "border-brand ring-2 ring-brand/40",
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX))}
        onKeyDown={handleKey}
        placeholder="Message Atlas…"
        rows={1}
        disabled={disabled}
        className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground/70 disabled:opacity-50"
        aria-label="Message"
      />
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => toast.info("File attachments are coming soon")}
            aria-label="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => toast.info("Voice input is coming soon")}
            aria-label="Voice input"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[11px] tabular-nums text-muted-foreground transition-opacity",
              value.length === 0 && "opacity-0",
            )}
          >
            {value.length}/{MAX}
          </span>
          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              onClick={onStop}
              className="h-10 w-10 rounded-full"
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={submit}
              disabled={!value.trim() || disabled}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-brand to-primary text-brand-foreground hover:opacity-90 disabled:from-muted disabled:to-muted disabled:text-muted-foreground"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
