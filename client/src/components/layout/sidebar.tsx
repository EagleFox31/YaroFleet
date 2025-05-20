import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getNavIcon } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarItemProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  active?: boolean;
}

const SidebarItem = ({ href, icon, children, active }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md group",
          active
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted group"
        )}
      >
        <i className={cn(`fas fa-${icon} w-5 h-5 mr-3`, active ? "" : "text-muted-foreground")}></i>
        <span>{children}</span>
      </a>
    </Link>
  );
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return null;
  }

  const isActive = (path: string) => {
    return location === path;
  };

  const userInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border px-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <i className="fas fa-truck-moving text-white"></i>
          </div>
          <span className="text-xl font-semibold font-sans text-foreground">Yaro FleetOS</span>
        </div>
      </div>
      
      {/* User */}
      <div className="flex items-center p-4 border-b border-border">
        <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
          <span className="font-medium">{userInitials}</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.role === "admin" ? "Administrateur" : user.role === "workshop_manager" ? "Chef d'atelier" : user.role === "technician" ? "Technicien" : "Utilisateur"}</p>
        </div>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 pt-4">
        <div className="px-3 space-y-1">
          <SidebarItem href="/" icon={getNavIcon("dashboard")} active={isActive("/")}>
            Tableau de bord
          </SidebarItem>
          
          <SidebarItem href="/vehicles" icon={getNavIcon("vehicles")} active={isActive("/vehicles") || location.startsWith("/vehicles/")}>
            Véhicules
          </SidebarItem>
          
          <SidebarItem href="/maintenance" icon={getNavIcon("maintenance")} active={isActive("/maintenance")}>
            Maintenance
          </SidebarItem>
          
          <SidebarItem href="/maintenance/work-orders" icon={getNavIcon("work-orders")} active={isActive("/maintenance/work-orders")}>
            Ordres de travail
          </SidebarItem>
          
          <SidebarItem href="/inventory" icon={getNavIcon("inventory")} active={isActive("/inventory")}>
            Stock pièces
          </SidebarItem>
          
          <SidebarItem href="/fuel" icon={getNavIcon("fuel")} active={isActive("/fuel")}>
            Carburant
          </SidebarItem>
          
          {(user.role === "admin" || user.role === "workshop_manager") && (
            <SidebarItem href="/technicians" icon={getNavIcon("technicians")} active={isActive("/technicians")}>
              Techniciens
            </SidebarItem>
          )}
          
          <SidebarItem href="/reports" icon={getNavIcon("reports")} active={isActive("/reports")}>
            Exports & Rapports
          </SidebarItem>
        </div>
      </ScrollArea>
      
      {/* Settings/Logout */}
      <div className="px-3 py-3 border-t border-border">
        <div className="space-y-1">
          {user.role === "admin" && (
            <SidebarItem href="/settings" icon={getNavIcon("settings")} active={isActive("/settings")}>
              Paramètres
            </SidebarItem>
          )}
          
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-muted"
            onClick={() => logout()}
          >
            <i className="fas fa-sign-out-alt w-5 h-5 mr-3 text-muted-foreground"></i>
            <span>Déconnexion</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
