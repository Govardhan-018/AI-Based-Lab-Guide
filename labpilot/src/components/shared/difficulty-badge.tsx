import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS = {
  beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  advanced: "bg-red-50 text-red-700 border-red-200",
};

export function DifficultyBadge({ level }: { level: "beginner" | "intermediate" | "advanced" }) {
  return (
    <Badge variant="outline" className={cn("text-[11px] capitalize", COLORS[level])}>
      {level}
    </Badge>
  );
}
