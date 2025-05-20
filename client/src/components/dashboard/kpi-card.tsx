import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  iconColor?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  subValue,
  icon,
  trend,
  iconColor = "text-primary",
  className,
}: KPICardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {trend && (
            <Badge variant={trend.positive ? "success" : "warning"} className="text-xs">
              {trend.value}
            </Badge>
          )}
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <span className="text-2xl font-semibold text-foreground">{value}</span>
            {subValue && <span className="text-sm text-muted-foreground ml-2">{subValue}</span>}
          </div>
          <div className={cn("p-2 rounded-md", `bg-${iconColor.split('-')[0]}/10`)}>
            <i className={cn(`fas fa-${icon}`, iconColor)}></i>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
