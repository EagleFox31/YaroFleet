import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { formatDate, formatDistance, getStatusColor, translateStatus } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { MaintenanceScheduleForm } from "@/components/maintenance/maintenance-schedule-form";

export default function MaintenanceIndex() {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const itemsPerPage = 10;
  
  // Fetch upcoming maintenance schedules
  const { data: upcomingMaintenances, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ["/api/maintenance-schedules", { status: "upcoming" }],
  });
  
  // Fetch overdue maintenance schedules
  const { data: overdueMaintenances, isLoading: isLoadingOverdue } = useQuery({
    queryKey: ["/api/maintenance-schedules", { status: "overdue" }],
  });
  
  // Fetch all maintenance schedules
  const { data: allMaintenances, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/maintenance-schedules", { search: searchTerm }],
  });
  
  const handleCreateMaintenance = () => {
    setLocation("/maintenance/new");
  };
  
  const handleCreateWorkOrder = (scheduleId: number, vehicleId: number) => {
    setLocation(`/maintenance/work-orders/new?scheduleId=${scheduleId}&vehicleId=${vehicleId}`);
  };
  
  const columns = [
    {
      header: "Véhicule",
      accessorKey: "vehicleId",
      cell: (value: number, row: any) => (
        <div>
          <div className="text-sm font-medium">{row.vehicle?.registrationNumber || `#${value}`}</div>
          {row.vehicle && (
            <div className="text-xs text-muted-foreground">
              {row.vehicle.brand} {row.vehicle.model}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Maintenance",
      accessorKey: "title",
      cell: (value: string) => <div className="text-sm font-medium">{value}</div>,
    },
    {
      header: "Fréquence",
      accessorKey: "frequency",
      cell: (value: string, row: any) => (
        <div className="text-sm">
          {value === "daily" && "Quotidienne"}
          {value === "weekly" && "Hebdomadaire"}
          {value === "monthly" && "Mensuelle"}
          {value === "quarterly" && "Trimestrielle"}
          {value === "yearly" && "Annuelle"}
          {value === "mileage" && "Kilométrage"}
          {row.frequencyValue > 1 && ` (${row.frequencyValue})`}
        </div>
      ),
    },
    {
      header: "Prochaine date",
      accessorKey: "scheduledDate",
      cell: (value: string) => <div className="text-sm">{formatDate(value)}</div>,
    },
    {
      header: "Prochain kilométrage",
      accessorKey: "scheduledMileage",
      cell: (value: number) => <div className="text-sm">{value ? formatDistance(value) : "N/A"}</div>,
    },
    {
      header: "Statut",
      accessorKey: "isActive",
      cell: (value: boolean) => (
        <Badge variant={value ? "success" : "neutral"}>
          {value ? "Actif" : "Inactif"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (value: number, row: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/maintenance/${value}`);
            }}
          >
            <i className="fas fa-edit text-secondary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateWorkOrder(value, row.vehicleId);
            }}
          >
            <i className="fas fa-tools text-warning"></i>
          </Button>
        </div>
      ),
    },
  ];
  
  const getFilteredData = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingMaintenances || [];
      case "overdue":
        return overdueMaintenances || [];
      case "all":
        return allMaintenances || [];
      default:
        return [];
    }
  };
  
  const isLoading = 
    (activeTab === "upcoming" && isLoadingUpcoming) ||
    (activeTab === "overdue" && isLoadingOverdue) ||
    (activeTab === "all" && isLoadingAll);
  
  return (
    <div>
      <PageHeader 
        title="Planification de maintenance" 
        subtitle="Gérez les maintenances préventives de votre flotte"
        actions={
          <Button onClick={handleCreateMaintenance}>
            <i className="fas fa-plus mr-2"></i>
            Nouvelle planification
          </Button>
        }
      />
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vue d'ensemble</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {upcomingMaintenances?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Maintenances à venir</div>
            </div>
            
            <div className="border rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-warning">
                {overdueMaintenances?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Maintenances en retard</div>
            </div>
            
            <div className="border rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-success">
                85%
              </div>
              <div className="text-sm text-muted-foreground">Taux de respect</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="upcoming">À venir</TabsTrigger>
              <TabsTrigger value="overdue">En retard</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="upcoming" className="m-0">
            <DataTable
              data={getFilteredData()}
              columns={columns}
              isLoading={isLoading}
              onRowClick={(row) => setLocation(`/maintenance/${row.id}`)}
            />
          </TabsContent>
          
          <TabsContent value="overdue" className="m-0">
            <DataTable
              data={getFilteredData()}
              columns={columns}
              isLoading={isLoading}
              onRowClick={(row) => setLocation(`/maintenance/${row.id}`)}
            />
          </TabsContent>
          
          <TabsContent value="all" className="m-0">
            <DataTable
              data={getFilteredData()}
              columns={columns}
              searchPlaceholder="Rechercher une maintenance..."
              onSearch={setSearchTerm}
              pagination={{
                totalItems: getFilteredData().length,
                itemsPerPage,
                currentPage,
                onPageChange: setCurrentPage,
              }}
              isLoading={isLoading}
              onRowClick={(row) => setLocation(`/maintenance/${row.id}`)}
            />
          </TabsContent>
        </CardContent>
      </Card>
    </div>
  );
}
