import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { WorkOrderForm } from "@/components/maintenance/work-order-form";
import { useLocation } from "wouter";

export default function WorkOrderNew() {
  const [location] = useLocation();
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  const [scheduleId, setScheduleId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // Parse URL parameters
    const url = new URL(window.location.href);
    const vehicleIdParam = url.searchParams.get("vehicleId");
    const scheduleIdParam = url.searchParams.get("scheduleId");
    
    if (vehicleIdParam) {
      setVehicleId(parseInt(vehicleIdParam));
    }
    
    if (scheduleIdParam) {
      setScheduleId(parseInt(scheduleIdParam));
    }
  }, [location]);
  
  return (
    <div>
      <PageHeader 
        title="Créer un ordre de travail" 
        subtitle="Nouvel ordre de travail pour intervention ou maintenance"
      />
      
      <WorkOrderForm 
        preselectedVehicleId={vehicleId}
        initialData={scheduleId ? { maintenanceScheduleId: scheduleId, isPreventive: true } : undefined}
      />
    </div>
  );
}
