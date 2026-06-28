import { motion } from "framer-motion";
import {
  Code2,
  Mail,
  Bug,
  Database,
  FileText,
  Atom,
} from "lucide-react";

const SUGGESTIONS = [
  { icon: Atom, title: "Explain quantum computing", subtitle: "in simple terms" },
  { icon: Code2, title: "Generate React code", subtitle: "for a pricing page" },
  { icon: Mail, title: "Write a professional email", subtitle: "asking for a raise" },
  { icon: Bug, title: "Debug JavaScript", subtitle: "and explain the fix" },
  { icon: Database, title: "Create a SQL query", subtitle: "for monthly revenue" },
  { icon: FileText, title: "Summarize a long document", subtitle: "into key bullet points" },
];

export function Suggestions({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.25 }}
          whileHover={{ y: -2 }}
          onClick={() => onPick(`${s.title} ${s.subtitle}`)}
          className="group text-left rounded-2xl border bg-card/50 hover:bg-card hover:border-brand/40 p-3.5 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 h-9 w-9 rounded-xl bg-accent grid place-items-center group-hover:bg-brand/15 transition-colors">
              <s.icon className="h-4.5 w-4.5 text-brand" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground truncate">{s.subtitle}</div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
