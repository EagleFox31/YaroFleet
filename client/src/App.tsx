import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { AuthContext, useAuthProvider } from "@/hooks/useAuth";

// Components
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/app-layout";

// Pages
import Login from "@/pages/auth/login";
import Dashboard from "@/pages/dashboard";
import VehiclesIndex from "@/pages/vehicles/index";
import VehicleDetails from "@/pages/vehicles/[id]";
import VehicleNew from "@/pages/vehicles/new";
import MaintenanceIndex from "@/pages/maintenance/index";
import WorkOrdersIndex from "@/pages/maintenance/work-orders";
import WorkOrderNew from "@/pages/maintenance/work-orders/new";
import WorkOrderDetails from "@/pages/maintenance/work-orders/[id]";
import InventoryIndex from "@/pages/inventory/index";
import InventoryNew from "@/pages/inventory/new";
import InventoryDetails from "@/pages/inventory/[id]";
import FuelIndex from "@/pages/fuel/index";
import FuelNew from "@/pages/fuel/new";
import Settings from "@/pages/settings";

function PrivateRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  
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
  
  return <Component {...rest} />;
}

function useAuth() {
  return AuthContext ? React.useContext(AuthContext) : { isAuthenticated: false, isLoading: false };
}

function App() {
  const authProviderValue = useAuthProvider();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthContext.Provider value={authProviderValue}>
          <Toaster />
          <Switch>
            {/* Public routes */}
            <Route path="/login" component={Login} />
            
            {/* Protected routes wrapped in AppLayout */}
            <Route path="/">
              <AppLayout>
                <PrivateRoute component={Dashboard} />
              </AppLayout>
            </Route>
            
            <Route path="/vehicles">
              <AppLayout>
                <PrivateRoute component={VehiclesIndex} />
              </AppLayout>
            </Route>
            
            <Route path="/vehicles/new">
              <AppLayout>
                <PrivateRoute component={VehicleNew} />
              </AppLayout>
            </Route>
            
            <Route path="/vehicles/:id">
              {(params) => (
                <AppLayout>
                  <PrivateRoute component={VehicleDetails} params={params} />
                </AppLayout>
              )}
            </Route>
            
            <Route path="/maintenance">
              <AppLayout>
                <PrivateRoute component={MaintenanceIndex} />
              </AppLayout>
            </Route>
            
            <Route path="/maintenance/work-orders">
              <AppLayout>
                <PrivateRoute component={WorkOrdersIndex} />
              </AppLayout>
            </Route>
            
            <Route path="/maintenance/work-orders/new">
              <AppLayout>
                <PrivateRoute component={WorkOrderNew} />
              </AppLayout>
            </Route>
            
            <Route path="/maintenance/work-orders/:id">
              {(params) => (
                <AppLayout>
                  <PrivateRoute component={WorkOrderDetails} params={params} />
                </AppLayout>
              )}
            </Route>
            
            <Route path="/inventory">
              <AppLayout>
                <PrivateRoute component={InventoryIndex} />
              </AppLayout>
            </Route>
            
            <Route path="/inventory/new">
              <AppLayout>
                <PrivateRoute component={InventoryNew} />
              </AppLayout>
            </Route>
            
            <Route path="/inventory/:id">
              {(params) => (
                <AppLayout>
                  <PrivateRoute component={InventoryDetails} params={params} />
                </AppLayout>
              )}
            </Route>
            
            <Route path="/fuel">
              <AppLayout>
                <PrivateRoute component={FuelIndex} />
              </AppLayout>
            </Route>
            
            <Route path="/fuel/new">
              <AppLayout>
                <PrivateRoute component={FuelNew} />
              </AppLayout>
            </Route>
            
            <Route path="/settings">
              <AppLayout>
                <PrivateRoute component={Settings} />
              </AppLayout>
            </Route>
            
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </AuthContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
