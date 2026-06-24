import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  icon?: string;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-emerald-600 font-medium mt-1">{trend}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </Card>
  );
}
