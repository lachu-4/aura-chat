import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Atlas" },
      { name: "description", content: "Sign in to Atlas, a premium AI assistant." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/c" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/c` },
        });
        if (error) throw error;
        toast.success("Welcome! Signing you in…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/c" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error(String(result.error));
      if (result.redirected) return;
      navigate({ to: "/c" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-50">
        <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand to-primary grid place-items-center">
            <Sparkles className="h-5 w-5 text-brand-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Atlas</span>
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue your conversations.</p>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-6 h-11"
            onClick={handleGoogle}
            disabled={loading}
          >
            <GoogleIcon className="h-4 w-4" />
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <EmailForm
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                onSubmit={handleEmail}
                loading={loading}
                label="Sign in"
              />
            </TabsContent>
            <TabsContent value="signup">
              <EmailForm
                email={email}
                password={password}
                setEmail={setEmail}
                setPassword={setPassword}
                onSubmit={handleEmail}
                loading={loading}
                label="Create account"
              />
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-6">
          By continuing you agree to our terms and privacy policy.
        </p>
      </motion.div>
    </div>
  );
}

function EmailForm(props: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  label: string;
}) {
  return (
    <form onSubmit={props.onSubmit} className="space-y-3 mt-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={props.email}
          onChange={(e) => props.setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11"
        />
      </div>
      <Button type="submit" className="w-full h-11 mt-2" disabled={props.loading}>
        {props.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : props.label}
      </Button>
    </form>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.5-1.7 4.3-5.5 4.3-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.6 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
