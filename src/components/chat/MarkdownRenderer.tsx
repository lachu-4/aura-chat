import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-xl border bg-[#1a1a24]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/30 border-b border-white/5">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
          {language || "text"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1.5"
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "0.85rem 1rem",
          fontSize: "0.85rem",
          lineHeight: 1.55,
        }}
        wrapLongLines
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props as {
              children?: React.ReactNode;
              className?: string;
              node?: { properties?: { className?: string[] } };
            };
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children ?? "");
            const isInline = !match && !text.includes("\n");
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-muted text-foreground text-[0.85em] font-mono border border-border/40"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match?.[1] ?? ""} value={text} />;
          },
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline underline-offset-4 hover:text-brand/80 transition-colors"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold bg-muted/50 border-b">{children}</th>
          ),
          td: ({ children }) => <td className="px-3 py-2 border-b border-border/40">{children}</td>,
          h1: ({ children }) => <h1 className="text-2xl font-semibold mt-5 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-3 mb-1.5">{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed my-2 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-brand/60 pl-4 my-3 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-4 border-border" />,
          img: ({ src, alt }) => (
            <img src={src} alt={alt ?? ""} className="my-3 rounded-xl border max-w-full" loading="lazy" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
