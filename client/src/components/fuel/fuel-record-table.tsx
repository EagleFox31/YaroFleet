import React, { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDate, formatPrice, formatDistance, calculateFuelConsumption, formatFuelConsumption } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface FuelRecord {
  id: number;
  vehicleId: number;
  date: string;
  quantity: number;
  cost: number;
  mileage: number;
  fullTank: boolean;
  notes: string | null;
  vehicle?: {
    registrationNumber: string;
    brand: string;
    model: string;
  };
}

interface FuelRecordTableProps {
  onRowClick?: (record: FuelRecord) => void;
  vehicleId?: number;
}

export function FuelRecordTable({ onRowClick, vehicleId }: FuelRecordTableProps) {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch records for the given vehicle or all records
  const queryKey = vehicleId 
    ? ["/api/fuel-records/vehicle", vehicleId] 
    : ["/api/fuel-records"];
  
  const { data, isLoading } = useQuery({ queryKey });
  
  // Handle data structure differences between endpoints
  const records = data || [];
  const previousRecords = [...records].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate consumption for each record
  const recordsWithConsumption = records.map((record: FuelRecord, index: number) => {
    let consumption = null;
    
    // Find the previous record for the same vehicle to calculate consumption
    const prevRecordIndex = previousRecords.findIndex(r => 
      r.vehicleId === record.vehicleId && 
      new Date(r.date).getTime() < new Date(record.date).getTime() &&
      r.mileage < record.mileage
    );
    
    if (prevRecordIndex !== -1 && record.fullTank) {
      const prevRecord = previousRecords[prevRecordIndex];
      const distance = record.mileage - prevRecord.mileage;
      consumption = calculateFuelConsumption(record.quantity, distance);
    }
    
    return {
      ...record,
      consumption
    };
  });
  
  const handleAddRecord = () => {
    const baseUrl = "/fuel/new";
    setLocation(vehicleId ? `${baseUrl}?vehicleId=${vehicleId}` : baseUrl);
  };
  
  const columns = [
    {
      header: "Date",
      accessorKey: "date",
      cell: (value: string) => <div className="text-sm">{formatDate(value)}</div>,
      sortable: true,
    },
    ...(!vehicleId ? [
      {
        header: "Véhicule",
        accessorKey: "vehicleId",
        cell: (value: number, row: FuelRecord) => (
          <div>
            <div className="text-sm">{row.vehicle?.registrationNumber || `#${value}`}</div>
            {row.vehicle && (
              <div className="text-xs text-muted-foreground">
                {row.vehicle.brand} {row.vehicle.model}
              </div>
            )}
          </div>
        ),
      }
    ] : []),
    {
      header: "Kilométrage",
      accessorKey: "mileage",
      cell: (value: number) => <div className="text-sm">{formatDistance(value)}</div>,
      sortable: true,
    },
    {
      header: "Quantité",
      accessorKey: "quantity",
      cell: (value: number) => <div className="text-sm">{value.toFixed(2)} L</div>,
      sortable: true,
    },
    {
      header: "Coût",
      accessorKey: "cost",
      cell: (value: number) => <div className="text-sm">{formatPrice(value)}</div>,
      sortable: true,
    },
    {
      header: "Consommation",
      accessorKey: "consumption",
      cell: (value: number | null) => (
        <div className="text-sm">
          {formatFuelConsumption(value)}
        </div>
      ),
    },
    {
      header: "Plein",
      accessorKey: "fullTank",
      cell: (value: boolean) => (
        <Badge variant={value ? "success" : "neutral"}>
          {value ? "Complet" : "Partiel"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (value: number, row: FuelRecord) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/fuel/${value}`);
            }}
          >
            <i className="fas fa-eye text-primary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/fuel/${value}`);
            }}
          >
            <i className="fas fa-edit text-secondary"></i>
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Historique des pleins</h2>
        <Button onClick={handleAddRecord}>
          <i className="fas fa-plus mr-2"></i>
          Ajouter un plein
        </Button>
      </div>
      
      <DataTable
        data={recordsWithConsumption}
        columns={columns}
        searchPlaceholder="Rechercher un enregistrement..."
        pagination={!vehicleId && records.length > itemsPerPage ? {
          totalItems: records.length,
          itemsPerPage,
          currentPage,
          onPageChange: setCurrentPage,
        } : undefined}
        onRowClick={onRowClick}
        isLoading={isLoading}
      />
    </div>
  );
}
