import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();

  // Find the share link
  const { data: shareLink } = await supabase
    .from("share_links")
    .select("*, projects(*)")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (!shareLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">deze link is niet meer actief</h1>
          <p className="text-muted-foreground">
            de deellink is verlopen of gedeactiveerd.
          </p>
          <p className="mt-8 text-xs text-muted-foreground/50">
            powered by team5pm
          </p>
        </div>
      </div>
    );
  }

  // Check expiry
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">deze link is verlopen</h1>
          <p className="text-muted-foreground">
            neem contact op met de projectplanner voor een nieuwe link.
          </p>
          <p className="mt-8 text-xs text-muted-foreground/50">
            powered by team5pm
          </p>
        </div>
      </div>
    );
  }

  const project = shareLink.projects as Record<string, string>;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-foreground">team5pm</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">
              planning voor {project?.name}
            </span>
          </div>
          {project?.client_name && (
            <span className="text-sm text-muted-foreground">
              {project.client_name}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">{project?.name}</h1>
        <p className="text-muted-foreground mb-8">
          bekijk de planning voor dit project.
        </p>

        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <p>gedeelde planningweergave wordt in een volgende versie uitgebreid.</p>
          <p className="text-xs mt-2">
            {shareLink.show_hours ? "uren zichtbaar" : "uren verborgen"} ·{" "}
            {shareLink.show_budget ? "budget zichtbaar" : "budget verborgen"}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 inset-x-0 py-4 text-center text-xs text-muted-foreground/50">
        powered by team5pm
      </footer>
    </div>
  );
}
