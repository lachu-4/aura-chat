import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS } from "@/lib/models";
import { Cpu } from "lucide-react";

export function ModelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 gap-2 border-0 bg-transparent hover:bg-accent text-sm font-medium px-2 w-auto min-w-0">
        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="w-72">
        {MODELS.map((m) => (
          <SelectItem key={m.id} value={m.id} className="flex-col items-start py-2">
            <div className="font-medium">{m.label}</div>
            <div className="text-xs text-muted-foreground">{m.description}</div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
