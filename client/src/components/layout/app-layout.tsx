import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/topnav";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground">Chargement...</span>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  
  // Determine search placeholder based on current route
  const getSearchPlaceholder = () => {
    if (location.startsWith("/vehicles")) {
      return "Rechercher un véhicule...";
    } else if (location.startsWith("/maintenance/work-orders")) {
      return "Rechercher un ordre de travail...";
    } else if (location.startsWith("/maintenance")) {
      return "Rechercher une maintenance...";
    } else if (location.startsWith("/inventory")) {
      return "Rechercher une pièce...";
    } else if (location.startsWith("/fuel")) {
      return "Rechercher un enregistrement...";
    }
    return "Rechercher...";
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin">
        {/* Top Navigation */}
        <TopNav searchPlaceholder={getSearchPlaceholder()} />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
