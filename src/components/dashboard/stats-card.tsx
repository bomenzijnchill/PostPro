import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  color?: string;
}

export function StatsCard({ label, value, suffix, color }: StatsCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className={cn("mt-2 text-2xl font-bold font-mono", color)}>
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
