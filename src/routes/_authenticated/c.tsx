import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/chat/Sidebar";
import { ModelPicker } from "@/components/chat/ModelPicker";
import { SettingsDialog } from "@/components/chat/SettingsDialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu, Sun, Moon, Plus, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { DEFAULT_MODEL } from "@/lib/models";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createThread } from "@/lib/threads.functions";

export const Route = createFileRoute("/_authenticated/c")({
  head: () => ({
    meta: [
      { title: "Chat — Atlas" },
      { name: "description", content: "Have a conversation with Atlas, your premium AI assistant." },
    ],
  }),
  component: ChatShell,
});

type Theme = "dark" | "light" | "system";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("light");
  if (t === "light") root.classList.add("light");
  if (t === "system") {
    if (window.matchMedia("(prefers-color-scheme: light)").matches) root.classList.add("light");
  }
}

function ChatShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [model, setModel] = useState<string>(() =>
    (typeof window !== "undefined" && localStorage.getItem("atlas:model")) || DEFAULT_MODEL,
  );
  const [theme, setTheme] = useState<Theme>(() =>
    (typeof window !== "undefined" && (localStorage.getItem("atlas:theme") as Theme)) || "dark",
  );

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("atlas:theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("atlas:model", model);
  }, [model]);

  const create = useServerFn(createThread);
  const createM = useMutation({
    mutationFn: () => create({ data: {} }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/c/$threadId", params: { threadId: row!.id } });
      setMobileOpen(false);
    },
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        createM.mutate();
      }
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createM]);

  return (
    <ChatContext.Provider value={{ model, setModel, openSettings: () => setSettingsOpen(true) }}>
      <div className="flex h-dvh bg-background text-foreground overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:flex h-full">
          <Sidebar
            user={user}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </div>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-80 bg-sidebar border-sidebar-border">
            <Sidebar
              user={user}
              collapsed={false}
              onToggle={() => setMobileOpen(false)}
              onOpenSettings={() => {
                setSettingsOpen(true);
                setMobileOpen(false);
              }}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top nav */}
          <header className="flex items-center gap-2 px-3 md:px-4 h-14 border-b bg-background/80 backdrop-blur sticky top-0 z-20">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="md:hidden flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand to-primary grid place-items-center">
                <Sparkles className="h-3.5 w-3.5 text-brand-foreground" />
              </div>
              <span className="font-semibold tracking-tight">Atlas</span>
            </div>
            <div className="hidden md:block">
              <ModelPicker value={model} onChange={setModel} />
            </div>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => createM.mutate()}
              aria-label="New chat"
              className="md:hidden h-9 w-9"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="h-9 w-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              className="h-9 w-9"
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </header>

          <div className="md:hidden border-b px-3 py-2">
            <ModelPicker value={model} onChange={setModel} />
          </div>

          <main className="flex-1 min-h-0">
            <Outlet />
          </main>
        </div>

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          model={model}
          onModelChange={setModel}
          theme={theme}
          onThemeChange={setTheme}
        />
      </div>
    </ChatContext.Provider>
  );
}

// Context to share model with children
import { createContext, useContext } from "react";
interface ChatCtx {
  model: string;
  setModel: (v: string) => void;
  openSettings: () => void;
}
const ChatContext = createContext<ChatCtx | null>(null);
export function useChatContext() {
  const c = useContext(ChatContext);
  if (!c) throw new Error("useChatContext outside provider");
  return c;
}
