import React, { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { formatPrice } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface Part {
  id: number;
  name: string;
  reference: string;
  description: string | null;
  quantity: number;
  minQuantity: number;
  location: string | null;
  unitPrice: number;
  supplier: string | null;
}

interface PartTableProps {
  onRowClick?: (part: Part) => void;
}

export function PartTable({ onRowClick }: PartTableProps) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { data, isLoading } = useQuery({
    queryKey: [
      "/api/parts", 
      {
        search: searchTerm,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      }
    ],
  });
  
  const parts = data?.parts || [];
  const totalParts = data?.total || 0;
  
  const handleAddPart = () => {
    setLocation("/inventory/new");
  };
  
  const columns = [
    {
      header: "Référence",
      accessorKey: "reference",
      cell: (value: string) => <div className="text-sm font-medium">{value}</div>,
      sortable: true,
    },
    {
      header: "Nom",
      accessorKey: "name",
      cell: (value: string) => <div className="text-sm">{value}</div>,
      sortable: true,
    },
    {
      header: "Quantité",
      accessorKey: "quantity",
      cell: (value: number, row: Part) => (
        <div className="text-sm">
          {value}
          {value <= row.minQuantity && (
            <Badge variant="warning" className="ml-2 text-xs">
              Bas
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: "Seuil",
      accessorKey: "minQuantity",
      cell: (value: number) => <div className="text-sm">{value}</div>,
      sortable: true,
    },
    {
      header: "Prix unitaire",
      accessorKey: "unitPrice",
      cell: (value: number) => <div className="text-sm">{formatPrice(value)}</div>,
      sortable: true,
    },
    {
      header: "Emplacement",
      accessorKey: "location",
      cell: (value: string | null) => <div className="text-sm">{value || "N/A"}</div>,
    },
    {
      header: "Fournisseur",
      accessorKey: "supplier",
      cell: (value: string | null) => <div className="text-sm">{value || "N/A"}</div>,
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
              setLocation(`/inventory/${value}`);
            }}
          >
            <i className="fas fa-eye text-primary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setLocation(`/inventory/${value}`);
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
        <h2 className="text-xl font-semibold">Inventaire des pièces</h2>
        <Button onClick={handleAddPart}>
          <i className="fas fa-plus mr-2"></i>
          Ajouter une pièce
        </Button>
      </div>
      
      <DataTable
        data={parts}
        columns={columns}
        searchPlaceholder="Rechercher une pièce..."
        pagination={{
          totalItems: totalParts,
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
