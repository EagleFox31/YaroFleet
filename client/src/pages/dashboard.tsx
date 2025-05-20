import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { FleetStatusChart } from "@/components/dashboard/fleet-status-chart";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { useQuery } from "@tanstack/react-query";
import { formatPrice, formatNumber } from "@/lib/utils";

// Define AlertItem type to match AlertsPanel's requirements
type AlertItem = {
  id: number;
  message: string;
  title: string;
  priority: string;
  isRead: boolean;
  type?: string;
  createdAt?: string;
  // Add other fields as required by AlertsPanel
};

type FleetStats = {
  operational: number;
  maintenance: number;
  outOfService: number;
};

export default function Dashboard() {
  const [period, setPeriod] = useState("month");
  
  // Fetch fleet statistics
  const { data: fleetStats } = useQuery<FleetStats>({
    queryKey: ["/api/statistics/fleet"],
  });
  
  // Fetch maintenance compliance
  const { data: complianceStats } = useQuery({
    queryKey: ["/api/statistics/maintenance-compliance"],
  });
  
  // Fetch maintenance cost
  const { data: costData } = useQuery<{ cost: number }>({
    queryKey: ["/api/statistics/maintenance-cost", period],
  });
  
  // Fetch alerts
  const { data: alerts = [] } = useQuery<AlertItem[]>({
    queryKey: ["/api/alerts/unread"],
  });
  
  // Fetch fleet status history for chart
  const { data: fleetStatusHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/statistics/fleet-history", period],
  });
  
  // Handler for period selector
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };
  
  return (
    <div>
      <PageHeader 
        title="Tableau de bord" 
        subtitle="Aperçu de la flotte et de la maintenance"
        periodSelector={{
          value: period,
          onChange: handlePeriodChange,
          options: [
            { label: "Cette semaine", value: "week" },
            { label: "Ce mois", value: "month" },
            { label: "Ce trimestre", value: "quarter" },
            { label: "Cette année", value: "year" },
          ],
        }}
        showExport={true}
        onExport={() => console.log("Exporting dashboard data...")}
      />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard 
          title="Véhicules actifs" 
          value={formatNumber(fleetStats?.operational || 0)}
          subValue={`/ ${formatNumber((fleetStats?.operational || 0) + (fleetStats?.maintenance || 0) + (fleetStats?.outOfService || 0))} total`}
          icon="truck"
          trend={{ value: "+3%", positive: true }}
        />
        
        <KPICard 
          title="Maintenances planifiées" 
          value="8"
          subValue="cette semaine"
          icon="calendar-alt"
          trend={{ value: "+12%", positive: false }}
          iconColor="text-warning"
        />
        
        <KPICard 
          title="Ordres de travail en cours" 
          value="12"
          subValue="/ 22 total"
          icon="wrench"
          trend={{ value: "18% en attente", positive: true }}
          iconColor="text-secondary"
        />
        
        <KPICard 
          title="Coût moyen par intervention" 
          value={formatPrice(costData?.cost || 0)}
          subValue={period === "week" ? "cette semaine" : period === "month" ? "ce mois" : period === "quarter" ? "ce trimestre" : "cette année"}
          icon="euro-sign"
          trend={{ value: "-5%", positive: true }}
          iconColor="text-success"
        />
      </div>
      
      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Fleet Status Chart */}
        <FleetStatusChart 
          data={fleetStatusHistory}
          className="lg:col-span-2"
        />
        
        {/* Alerts and Notifications */}
        <AlertsPanel 
          alerts={alerts}
          onMarkAsRead={(id) => console.log(`Marking alert ${id} as read`)}
          onViewAllClick={() => console.log("View all alerts clicked")}
        />
      </div>
      
      {/* Vehicle List */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <VehicleTable />
        </div>
      </div>
    </div>
  );
}
