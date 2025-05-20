import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { FuelRecordTable } from "@/components/fuel/fuel-record-table";
import { useQuery } from "@tanstack/react-query";
import { formatPrice, formatFuelConsumption } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts/es6";

export default function FuelIndex() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState("month");
  
  // Define the type for fuel statistics
  type FuelStats = {
    totalRecords: number;
    totalQuantity: number;
    totalCost: number;
    averageConsumption: number;
  };

  // Fetch fuel statistics
  const { data: stats } = useQuery<FuelStats>({
    queryKey: ["/api/fuel-records/statistics", period],
  });
  
  // Define the type for fuel history items
  type FuelHistoryItem = {
    date: string;
    consumption: number;
    cost: number;
  };

  // Fetch fuel consumption history for chart
  const { data: fuelHistory = [] } = useQuery<FuelHistoryItem[]>({
    queryKey: ["/api/fuel-records/consumption-history", period],
  });
  
  const handleAddFuelRecord = () => {
    setLocation("/fuel/new");
  };
  
  return (
    <div>
      <PageHeader 
        title="Suivi Carburant" 
        subtitle="Suivi et analyse de la consommation de carburant"
        periodSelector={{
          value: period,
          onChange: setPeriod,
          options: [
            { label: "Ce mois", value: "month" },
            { label: "Ce trimestre", value: "quarter" },
            { label: "Cette année", value: "year" },
          ],
        }}
        actions={
          <Button onClick={handleAddFuelRecord}>
            <i className="fas fa-plus mr-2"></i>
            Ajouter un plein
          </Button>
        }
        showExport={true}
        onExport={() => console.log("Exporting fuel data...")}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-primary">
              {stats?.totalRecords || 0}
            </span>
            <span className="text-sm text-muted-foreground">Pleins enregistrés</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-warning">
              {stats?.totalQuantity?.toFixed(2) || 0} L
            </span>
            <span className="text-sm text-muted-foreground">Litres consommés</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-success">
              {formatPrice(stats?.totalCost || 0)}
            </span>
            <span className="text-sm text-muted-foreground">Coût total</span>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-secondary">
              {formatFuelConsumption(stats?.averageConsumption)}
            </span>
            <span className="text-sm text-muted-foreground">Consommation moyenne</span>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Évolution de la consommation</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {fuelHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="consumption" 
                    name="Consommation (L/100km)" 
                    stroke="hsl(var(--chart-1))" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="cost" 
                    name="Coût (€)" 
                    stroke="hsl(var(--chart-2))" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-muted-foreground text-sm">Aucune donnée disponible</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <FuelRecordTable />
        </CardContent>
      </Card>
    </div>
  );
}
