import React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PartTable } from "@/components/inventory/part-table";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";

export default function InventoryIndex() {
  const [, setLocation] = useLocation();
  
  // Fetch inventory statistics
  const { data: stats } = useQuery({
    queryKey: ["/api/parts/statistics"],
  });
  
  // Fetch low stock parts
  const { data: lowStockParts = [] } = useQuery({
    queryKey: ["/api/parts/low-on-stock"],
  });
  
  const handleAddPart = () => {
    setLocation("/inventory/new");
  };
  
  const totalStockValue = stats?.totalValue || 0;
  const totalItems = stats?.totalItems || 0;
  const lowStockCount = lowStockParts.length;
  
  return (
    <div>
      <PageHeader 
        title="Inventaire des pièces" 
        subtitle="Gestion du stock des pièces détachées"
        actions={
          <Button onClick={handleAddPart}>
            <i className="fas fa-plus mr-2"></i>
            Ajouter une pièce
          </Button>
        }
        showExport={true}
        onExport={() => console.log("Exporting inventory data...")}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-primary">{totalItems}</div>
            <div className="text-sm text-muted-foreground">Pièces en stock</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <div className="text-sm text-muted-foreground">En rupture de stock</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-success">{formatPrice(totalStockValue)}</div>
            <div className="text-sm text-muted-foreground">Valeur du stock</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <PartTable />
        </CardContent>
      </Card>
    </div>
  );
}
