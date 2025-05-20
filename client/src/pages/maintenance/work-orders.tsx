import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { WorkOrderTable } from "@/components/maintenance/work-order-table";
import { useQuery } from "@tanstack/react-query";

export default function WorkOrdersIndex() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState("month");
  
  // Fetch work order statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/work-orders/statistics", period],
  });
  
  const handleAddWorkOrder = () => {
    setLocation("/maintenance/work-orders/new");
  };
  
  return (
    <div>
      <PageHeader 
        title="Ordres de travail" 
        subtitle="Suivi des interventions et réparations"
        periodSelector={{
          value: period,
          onChange: setPeriod,
          options: [
            { label: "Cette semaine", value: "week" },
            { label: "Ce mois", value: "month" },
            { label: "Ce trimestre", value: "quarter" },
            { label: "Cette année", value: "year" },
          ],
        }}
        actions={
          <Button onClick={handleAddWorkOrder}>
            <i className="fas fa-plus mr-2"></i>
            Nouvel ordre de travail
          </Button>
        }
        showExport={true}
        onExport={() => console.log("Exporting work orders...")}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {stats?.pending || 0}
            </span>
            <span className="text-sm text-muted-foreground">En attente</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-warning">
              {stats?.inProgress || 0}
            </span>
            <span className="text-sm text-muted-foreground">En cours</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-success">
              {stats?.completed || 0}
            </span>
            <span className="text-sm text-muted-foreground">Terminés</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-secondary">
              {stats?.cancelled || 0}
            </span>
            <span className="text-sm text-muted-foreground">Annulés</span>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <WorkOrderTable />
        </CardContent>
      </Card>
    </div>
  );
}
