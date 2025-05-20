import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";

export default function VehicleNew() {
  return (
    <div>
      <PageHeader 
        title="Ajouter un véhicule" 
        subtitle="Créer une nouvelle fiche véhicule"
      />
      
      <VehicleForm />
    </div>
  );
}
