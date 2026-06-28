import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODELS } from "@/lib/models";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  model: string;
  onModelChange: (v: string) => void;
  theme: "dark" | "light" | "system";
  onThemeChange: (v: "dark" | "light" | "system") => void;
}

export function SettingsDialog({ open, onOpenChange, model, onModelChange, theme, onThemeChange }: Props) {
  const [temp, setTemp] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2048]);

  useEffect(() => {
    if (!open) return;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your Atlas experience.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => onThemeChange(v as "dark" | "light" | "system")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={onModelChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Temperature</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{temp[0].toFixed(2)}</span>
            </div>
            <Slider min={0} max={1} step={0.05} value={temp} onValueChange={setTemp} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Max tokens</Label>
              <span className="text-xs tabular-nums text-muted-foreground">{maxTokens[0]}</span>
            </div>
            <Slider min={256} max={8192} step={256} value={maxTokens} onValueChange={setMaxTokens} />
          </div>

          <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Keyboard shortcuts</div>
            <div className="grid grid-cols-2 gap-y-1">
              <span>New chat</span><kbd className="text-right">⌘/Ctrl + K</kbd>
              <span>Send message</span><kbd className="text-right">Enter</kbd>
              <span>New line</span><kbd className="text-right">Shift + Enter</kbd>
              <span>Toggle sidebar</span><kbd className="text-right">⌘/Ctrl + B</kbd>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => toast.success("Saved to your downloads (demo)")}
              className="flex-1"
            >
              Export chats
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info("Choose a JSON file to import (demo)")}
              className="flex-1"
            >
              Import chats
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
