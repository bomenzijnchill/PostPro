"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("check je inbox voor een bevestigingslink.");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("check je inbox voor een reset-link.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          team5pm
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          post production, planned.
        </p>
      </div>

      {/* Right panel — login card */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="glass w-full max-w-md rounded-lg p-8">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <h1 className="text-3xl font-bold">team5pm</h1>
            <p className="text-sm text-muted-foreground mt-1">
              post production, planned.
            </p>
          </div>

          <h2 className="text-lg font-semibold mb-6">
            {mode === "login" && "inloggen"}
            {mode === "signup" && "account aanmaken"}
            {mode === "forgot" && "wachtwoord resetten"}
          </h2>

          {message && (
            <div className="mb-4 rounded-md bg-accent-teal/10 border border-accent-teal/20 px-4 py-3 text-sm text-accent-teal">
              {message}
            </div>
          )}

          <form
            onSubmit={
              mode === "login"
                ? handleLogin
                : mode === "signup"
                ? handleSignup
                : handleForgotPassword
            }
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">e-mailadres</Label>
              <Input
                id="email"
                type="email"
                placeholder="jouw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password">wachtwoord</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-accent-yellow text-background hover:bg-accent-yellow/90 font-semibold"
              disabled={loading}
            >
              {loading
                ? "laden..."
                : mode === "login"
                ? "inloggen"
                : mode === "signup"
                ? "account aanmaken"
                : "reset link versturen"}
            </Button>
          </form>

          {mode === "login" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">of</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                inloggen met google
              </Button>
            </>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground space-y-1">
            {mode === "login" && (
              <>
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                >
                  wachtwoord vergeten?
                </button>
                <span className="mx-2">·</span>
                <button
                  className="hover:text-foreground transition-colors"
                  onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
                >
                  account aanmaken
                </button>
              </>
            )}
            {(mode === "signup" || mode === "forgot") && (
              <button
                className="hover:text-foreground transition-colors"
                onClick={() => { setMode("login"); setError(""); setMessage(""); }}
              >
                terug naar inloggen
              </button>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground/50">
            een tool van team5pm.
          </p>
        </div>
      </div>
    </div>
  );
}
