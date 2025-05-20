import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { FuelRecordForm } from "@/components/fuel/fuel-record-form";
import { useLocation } from "wouter";

export default function FuelNew() {
  const [location] = useLocation();
  const [vehicleId, setVehicleId] = useState<number | undefined>(undefined);
  
  useEffect(() => {
    // Parse URL parameters
    const url = new URL(window.location.href);
    const vehicleIdParam = url.searchParams.get("vehicleId");
    
    if (vehicleIdParam) {
      setVehicleId(parseInt(vehicleIdParam));
    }
  }, [location]);
  
  return (
    <div>
      <PageHeader 
        title="Enregistrer un plein" 
        subtitle="Ajout d'un nouveau plein de carburant"
      />
      
      <FuelRecordForm vehicleId={vehicleId} />
    </div>
  );
}
