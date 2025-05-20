import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  periodSelector?: {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
  };
  showExport?: boolean;
  onExport?: () => void;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  periodSelector,
  showExport = false,
  onExport,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div>
        <h1 className="text-2xl font-semibold font-sans text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      
      <div className="flex space-x-3">
        {periodSelector && (
          <div className="relative">
            <Select
              value={periodSelector.value}
              onValueChange={periodSelector.onChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une période" />
              </SelectTrigger>
              <SelectContent>
                {periodSelector.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {showExport && (
          <Button
            variant="outline"
            onClick={onExport}
            className="inline-flex items-center"
          >
            <i className="fas fa-download mr-2"></i>
            Exporter
          </Button>
        )}
        
        {actions}
      </div>
    </div>
  );
}
