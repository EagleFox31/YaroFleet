import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface TopNavProps {
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function TopNav({ onSearchChange, searchPlaceholder = "Rechercher..." }: TopNavProps) {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState("");
  const [, setLocation] = useLocation();
  
  // Fetch unread alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts/unread"],
    enabled: !!user,
  });
  
  useEffect(() => {
    if (onSearchChange) {
      const debounce = setTimeout(() => {
        onSearchChange(searchValue);
      }, 300);
      
      return () => clearTimeout(debounce);
    }
  }, [searchValue, onSearchChange]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };
  
  const handleNewAction = () => {
    // Determine what "new" action to take based on current route
    const path = window.location.pathname;
    
    if (path.startsWith("/vehicles")) {
      setLocation("/vehicles/new");
    } else if (path.startsWith("/maintenance/work-orders")) {
      setLocation("/maintenance/work-orders/new");
    } else if (path.startsWith("/maintenance")) {
      setLocation("/maintenance/new");
    } else if (path.startsWith("/inventory")) {
      setLocation("/inventory/new");
    } else if (path.startsWith("/fuel")) {
      setLocation("/fuel/new");
    } else if (path.startsWith("/technicians")) {
      setLocation("/technicians/new");
    }
  };
  
  return (
    <div className="flex items-center justify-between h-16 px-6 bg-card border-b border-border">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-muted-foreground"></i>
          </div>
          <Input
            type="text"
            className="pl-10 pr-3 py-2"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      {/* Notification and Quick Actions */}
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <i className="fas fa-bell"></i>
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-warning"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2 font-medium border-b border-border">
              Notifications
            </div>
            {alerts.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <i className="fas fa-check-circle mb-2 text-2xl"></i>
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-auto">
                {alerts.map((alert: any) => (
                  <DropdownMenuItem key={alert.id} className="p-3 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                        alert.priority === "critical" ? "bg-warning/10" : "bg-primary/10"
                      )}>
                        <i className={cn(
                          "fas",
                          alert.type === "maintenance" ? "fa-tools" :
                          alert.type === "inventory" ? "fa-dolly-flatbed" :
                          alert.type === "work_order" ? "fa-clipboard-list" :
                          "fa-exclamation-circle",
                          alert.priority === "critical" ? "text-warning" : "text-primary"
                        )}></i>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setLocation("/alerts")}>
                Voir toutes les alertes
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="ghost" size="icon" onClick={handleNewAction}>
          <i className="fas fa-plus"></i>
        </Button>
        
        <div className="border-l border-border h-8 mx-2"></div>
        
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center">
                <span className="text-sm font-medium mr-2">FR</span>
                <i className="fas fa-chevron-down text-xs"></i>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">
                <span className="flex items-center">
                  <span className="mr-2">🇫🇷</span> Français
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" disabled>
                <span className="flex items-center">
                  <span className="mr-2">🇬🇧</span> English
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
