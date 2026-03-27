"use client";

import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { profile } = useAuth();

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">instellingen</h1>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>naam</Label>
          <Input
            value={profile?.name ?? ""}
            className="bg-secondary"
            readOnly
          />
        </div>

        <div className="space-y-2">
          <Label>rol</Label>
          <Input
            value={profile?.role ?? ""}
            className="bg-secondary"
            readOnly
          />
        </div>

        <Separator />

        <p className="text-sm text-muted-foreground">
          meer instellingen worden in een volgende versie toegevoegd.
        </p>
      </div>
    </div>
  );
}
