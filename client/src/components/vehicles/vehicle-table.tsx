import React, { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDate, formatDistance, getStatusColor, translateStatus } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Vehicle {
  id: number;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  status: "operational" | "maintenance" | "out_of_service";
  nextMaintenanceDate?: string;
  nextMaintenanceMileage?: number;
}

interface VehicleTableProps {
  onRowClick?: (vehicle: Vehicle) => void;
}

export function VehicleTable({ onRowClick }: VehicleTableProps) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/vehicles", 
      {
        search: searchTerm,
        status: statusFilter,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      }
    ],
  });
  
  const vehicles = data?.vehicles || [];
  const totalVehicles = data?.total || 0;
  
  const handleAddVehicle = () => {
    setLocation("/vehicles/new");
  };
  
  const columns = [
    {
      header: "Immatriculation",
      accessorKey: "registrationNumber",
      cell: (value: string) => <div className="text-sm font-medium">{value}</div>,
      sortable: true,
    },
    {
      header: "Modèle / Marque",
      accessorKey: "model",
      cell: (value: string, row: Vehicle) => (
        <div>
          <div className="text-sm">{value}</div>
          <div className="text-xs text-muted-foreground">{row.brand}</div>
        </div>
      ),
    },
    {
      header: "Année",
      accessorKey: "year",
      cell: (value: number) => <div className="text-sm">{value}</div>,
      sortable: true,
    },
    {
      header: "Kilométrage",
      accessorKey: "mileage",
      cell: (value: number) => <div className="text-sm">{formatDistance(value)}</div>,
      sortable: true,
    },
    {
      header: "Statut",
      accessorKey: "status",
      cell: (value: string) => (
        <Badge variant="outline" className={getStatusColor(value)}>
          {translateStatus(value)}
        </Badge>
      ),
    },
    {
      header: "Prochaine maintenance",
      accessorKey: "nextMaintenanceDate",
      cell: (value: string, row: Vehicle) => (
        <div>
          <div className="text-sm">{formatDate(value)}</div>
          {row.nextMaintenanceMileage && (
            <div className="text-xs text-muted-foreground">ou {formatDistance(row.nextMaintenanceMileage)}</div>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (value: number, row: Vehicle) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/vehicles/${value}`);
            }}
          >
            <i className="fas fa-eye text-primary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/vehicles/${value}`);
            }}
          >
            <i className="fas fa-edit text-secondary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/maintenance/work-orders/new?vehicleId=${value}`);
            }}
          >
            <i className="fas fa-tools text-warning"></i>
          </Button>
        </div>
      ),
    },
  ];
  
  const filterOptions = [
    {
      name: "Statut",
      options: [
        { label: "Tous les statuts", value: "all" },
        { label: "Opérationnel", value: "operational" },
        { label: "En maintenance", value: "maintenance" },
        { label: "Hors service", value: "out_of_service" },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Véhicules</h2>
        <Button onClick={handleAddVehicle}>
          <i className="fas fa-plus mr-2"></i>
          Ajouter un véhicule
        </Button>
      </div>
      
      <DataTable
        data={vehicles}
        columns={columns}
        searchPlaceholder="Rechercher un véhicule..."
        filterOptions={filterOptions}
        pagination={{
          totalItems: totalVehicles,
          itemsPerPage,
          currentPage,
          onPageChange: setCurrentPage,
        }}
        onSearch={setSearchTerm}
        onRowClick={onRowClick}
        isLoading={isLoading}
      />
    </div>
  );
}
