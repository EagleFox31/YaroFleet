import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function VehiclesIndex() {
  const [, setLocation] = useLocation();
  
  const handleAddVehicle = () => {
    setLocation("/vehicles/new");
  };
  
  return (
    <div>
      <PageHeader 
        title="Gestion des véhicules" 
        subtitle="Liste et détails des véhicules de la flotte"
        actions={
          <Button onClick={handleAddVehicle}>
            <i className="fas fa-plus mr-2"></i>
            Ajouter un véhicule
          </Button>
        }
        showExport={true}
        onExport={() => console.log("Exporting vehicles data...")}
      />
      
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-6">
          <VehicleTable 
            onRowClick={(vehicle) => setLocation(`/vehicles/${vehicle.id}`)}
          />
        </div>
      </div>
    </div>
  );
}
