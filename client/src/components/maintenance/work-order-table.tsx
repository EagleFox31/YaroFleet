import React, { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatDate, getStatusColor, translateStatus } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface WorkOrder {
  id: number;
  vehicleId: number;
  technicianId: number | null;
  title: string;
  description: string | null;
  diagnosis: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  startDate: string | null;
  endDate: string | null;
  isPreventive: boolean;
  vehicle?: {
    registrationNumber: string;
    brand: string;
    model: string;
  };
  technician?: {
    name: string;
  };
}

interface WorkOrderTableProps {
  onRowClick?: (workOrder: WorkOrder) => void;
  vehicleId?: number;
}

export function WorkOrderTable({ onRowClick, vehicleId }: WorkOrderTableProps) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Use the right endpoint based on whether a vehicleId is provided
  const queryKey = vehicleId 
    ? ["/api/work-orders/vehicle", vehicleId] 
    : [
        "/api/work-orders", 
        {
          search: searchTerm,
          status: statusFilter,
          priority: priorityFilter,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        }
      ];
  
  const { data, isLoading } = useQuery({ queryKey });
  
  // Handle data structure differences between endpoints
  const workOrders = vehicleId 
    ? (data || []) 
    : (data?.workOrders || []);
  
  const totalWorkOrders = vehicleId 
    ? (workOrders.length || 0) 
    : (data?.total || 0);
  
  const handleAddWorkOrder = () => {
    const baseUrl = "/maintenance/work-orders/new";
    setLocation(vehicleId ? `${baseUrl}?vehicleId=${vehicleId}` : baseUrl);
  };
  
  const columns = [
    {
      header: "Titre",
      accessorKey: "title",
      cell: (value: string) => <div className="text-sm font-medium">{value}</div>,
    },
    ...(!vehicleId ? [
      {
        header: "Véhicule",
        accessorKey: "vehicleId",
        cell: (value: number, row: WorkOrder) => (
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
      header: "Technicien",
      accessorKey: "technicianId",
      cell: (value: number | null, row: WorkOrder) => (
        <div className="text-sm">
          {row.technician?.name || (value ? `#${value}` : "Non assigné")}
        </div>
      ),
    },
    {
      header: "Priorité",
      accessorKey: "priority",
      cell: (value: string) => (
        <Badge variant="outline" className={getStatusColor(value)}>
          {translateStatus(value)}
        </Badge>
      ),
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
      header: "Type",
      accessorKey: "isPreventive",
      cell: (value: boolean) => (
        <Badge variant={value ? "success" : "neutral"}>
          {value ? "Préventif" : "Correctif"}
        </Badge>
      ),
    },
    {
      header: "Date",
      accessorKey: "startDate",
      cell: (value: string, row: WorkOrder) => (
        <div>
          <div className="text-sm">{formatDate(value)}</div>
          {row.endDate && (
            <div className="text-xs text-muted-foreground">
              Fin: {formatDate(row.endDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (value: number) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/maintenance/work-orders/${value}`);
            }}
          >
            <i className="fas fa-eye text-primary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/maintenance/work-orders/${value}`);
            }}
          >
            <i className="fas fa-edit text-secondary"></i>
          </Button>
        </div>
      ),
    },
  ];
  
  const filterOptions = [
    {
      name: "Statut",
      options: [
        { label: "Tous les statuts", value: "" },
        { label: "En attente", value: "pending" },
        { label: "En cours", value: "in_progress" },
        { label: "Terminé", value: "completed" },
        { label: "Annulé", value: "cancelled" },
      ],
      value: statusFilter,
      onChange: setStatusFilter,
    },
    {
      name: "Priorité",
      options: [
        { label: "Toutes les priorités", value: "" },
        { label: "Faible", value: "low" },
        { label: "Moyenne", value: "medium" },
        { label: "Haute", value: "high" },
        { label: "Critique", value: "critical" },
      ],
      value: priorityFilter,
      onChange: setPriorityFilter,
    },
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Ordres de travail</h2>
        <Button onClick={handleAddWorkOrder}>
          <i className="fas fa-plus mr-2"></i>
          Ajouter un ordre de travail
        </Button>
      </div>
      
      <DataTable
        data={workOrders}
        columns={columns}
        searchPlaceholder="Rechercher un ordre de travail..."
        filterOptions={!vehicleId ? filterOptions : undefined}
        pagination={
          !vehicleId ? {
            totalItems: totalWorkOrders,
            itemsPerPage,
            currentPage,
            onPageChange: setCurrentPage,
          } : undefined
        }
        onSearch={!vehicleId ? setSearchTerm : undefined}
        onRowClick={onRowClick}
        isLoading={isLoading}
      />
    </div>
  );
}
