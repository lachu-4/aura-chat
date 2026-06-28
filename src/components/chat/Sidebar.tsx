import { useState, useMemo } from "react";
import { Link, useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  Sparkles,
  LogOut,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { listThreads, createThread, updateThread, deleteThread } from "@/lib/threads.functions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  user: { email?: string };
  collapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ user, collapsed, onToggle, onOpenSettings, onNavigate }: Props) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const update = useServerFn(updateThread);
  const del = useServerFn(deleteThread);

  const { data: threads = [] } = useQuery({
    queryKey: ["threads"],
    queryFn: () => list(),
  });

  const createM = useMutation({
    mutationFn: () => create({ data: {} }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/c/$threadId", params: { threadId: row!.id } });
      onNavigate?.();
    },
  });

  const updateM = useMutation({
    mutationFn: (vars: { id: string; title?: string; pinned?: boolean; archived?: boolean }) =>
      update({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads"] }),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      if (id === activeId) navigate({ to: "/c" });
      toast.success("Conversation deleted");
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => !t.archived && (!q || t.title.toLowerCase().includes(q)));
  }, [threads, search]);

  const archived = useMemo(() => threads.filter((t) => t.archived), [threads]);
  const pinned = filtered.filter((t) => t.pinned);
  const others = filtered.filter((t) => !t.pinned);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth" });
  };

  if (collapsed) {
    return (
      <aside className="hidden md:flex flex-col items-center w-14 shrink-0 bg-sidebar border-r border-sidebar-border py-3 gap-2">
        <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Expand sidebar">
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => createM.mutate()}
          aria-label="New chat"
          className="rounded-xl"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Settings">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full w-72 shrink-0 bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <Link
          to="/c"
          className="flex items-center gap-2 text-sidebar-foreground"
          onClick={onNavigate}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand to-primary grid place-items-center">
            <Sparkles className="h-4 w-4 text-brand-foreground" />
          </div>
          <span className="font-semibold tracking-tight">Atlas</span>
        </Link>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex h-8 w-8"
          onClick={onToggle}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3">
        <Button
          onClick={() => createM.mutate()}
          className="w-full justify-start gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 border border-sidebar-border"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            className="h-9 pl-8 bg-sidebar-accent/40 border-sidebar-border placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {pinned.length > 0 && (
          <Section label="Pinned">
            {pinned.map((t) => (
              <ThreadRow
                key={t.id}
                t={t}
                active={t.id === activeId}
                renaming={renaming === t.id}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                onSelect={() => onNavigate?.()}
                onStartRename={() => {
                  setRenameDraft(t.title);
                  setRenaming(t.id);
                }}
                onSaveRename={() => {
                  if (renameDraft.trim()) updateM.mutate({ id: t.id, title: renameDraft.trim() });
                  setRenaming(null);
                }}
                onCancelRename={() => setRenaming(null)}
                onPin={() => updateM.mutate({ id: t.id, pinned: !t.pinned })}
                onArchive={() => updateM.mutate({ id: t.id, archived: true })}
                onDelete={() => setConfirmDelete(t.id)}
              />
            ))}
          </Section>
        )}

        <Section label="Recent">
          {others.length === 0 && pinned.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              <MessageSquare className="h-5 w-5 mx-auto mb-2 opacity-50" />
              No conversations yet
            </div>
          ) : (
            others.map((t) => (
              <ThreadRow
                key={t.id}
                t={t}
                active={t.id === activeId}
                renaming={renaming === t.id}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                onSelect={() => onNavigate?.()}
                onStartRename={() => {
                  setRenameDraft(t.title);
                  setRenaming(t.id);
                }}
                onSaveRename={() => {
                  if (renameDraft.trim()) updateM.mutate({ id: t.id, title: renameDraft.trim() });
                  setRenaming(null);
                }}
                onCancelRename={() => setRenaming(null)}
                onPin={() => updateM.mutate({ id: t.id, pinned: !t.pinned })}
                onArchive={() => updateM.mutate({ id: t.id, archived: true })}
                onDelete={() => setConfirmDelete(t.id)}
              />
            ))
          )}
        </Section>

        {archived.length > 0 && (
          <Section label="Archived">
            {archived.map((t) => (
              <ThreadRow
                key={t.id}
                t={t}
                active={t.id === activeId}
                renaming={renaming === t.id}
                renameDraft={renameDraft}
                setRenameDraft={setRenameDraft}
                onSelect={() => onNavigate?.()}
                onStartRename={() => {
                  setRenameDraft(t.title);
                  setRenaming(t.id);
                }}
                onSaveRename={() => {
                  if (renameDraft.trim()) updateM.mutate({ id: t.id, title: renameDraft.trim() });
                  setRenaming(null);
                }}
                onCancelRename={() => setRenaming(null)}
                onPin={() => updateM.mutate({ id: t.id, pinned: !t.pinned })}
                onArchive={() => updateM.mutate({ id: t.id, archived: false })}
                onDelete={() => setConfirmDelete(t.id)}
                archived
              />
            ))}
          </Section>
        )}
      </nav>

      {/* Footer / Profile */}
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand to-primary grid place-items-center text-xs font-semibold text-brand-foreground">
                {(user.email ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate text-sidebar-foreground">{user.email ?? "User"}</div>
                <div className="text-[11px] text-muted-foreground">Free plan</div>
              </div>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onOpenSettings}>
              <SettingsIcon className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conversation and its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) deleteM.mutate(confirmDelete);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 mb-1 text-[11px] uppercase tracking-wider text-muted-foreground/80 font-medium">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ThreadRow(props: {
  t: { id: string; title: string; pinned: boolean; archived: boolean };
  active: boolean;
  renaming: boolean;
  renameDraft: string;
  setRenameDraft: (v: string) => void;
  onSelect: () => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  archived?: boolean;
}) {
  const { t, active, renaming } = props;

  if (renaming) {
    return (
      <div className="px-2">
        <Input
          autoFocus
          value={props.renameDraft}
          onChange={(e) => props.setRenameDraft(e.target.value)}
          onBlur={props.onSaveRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") props.onSaveRename();
            if (e.key === "Escape") props.onCancelRename();
          }}
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "group relative flex items-center rounded-lg mx-1 transition-colors",
          active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60",
        )}
      >
        <Link
          to="/c/$threadId"
          params={{ threadId: t.id }}
          onClick={props.onSelect}
          className="flex-1 min-w-0 px-3 py-2 text-sm text-sidebar-foreground truncate flex items-center gap-2"
        >
          {t.pinned && <Pin className="h-3 w-3 text-brand shrink-0" />}
          <span className="truncate">{t.title}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More options"
              className={cn(
                "h-7 w-7 grid place-items-center rounded-md mr-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-opacity",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={props.onStartRename}>
              <Pencil className="h-4 w-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onPin}>
              {t.pinned ? <><PinOff className="h-4 w-4" /> Unpin</> : <><Pin className="h-4 w-4" /> Pin</>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onArchive}>
              {props.archived ? (
                <><ArchiveRestore className="h-4 w-4" /> Unarchive</>
              ) : (
                <><Archive className="h-4 w-4" /> Archive</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={props.onDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </AnimatePresence>
  );
}
