import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface FleetStatusChartProps {
  data: any[];
  title?: string;
  className?: string;
}

export function FleetStatusChart({ data, title = "Statut de la flotte", className }: FleetStatusChartProps) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  
  const handlePeriodChange = (newPeriod: "month" | "quarter" | "year") => {
    setPeriod(newPeriod);
  };
  
  const filteredData = data.filter((item) => {
    // In a real app, filter data based on period
    return true;
  });
  
  return (
    <Card className={cn(className)}>
      <CardHeader className="px-6 pb-0">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex space-x-2 text-sm">
            <Button
              size="sm"
              variant={period === "month" ? "default" : "ghost"}
              onClick={() => handlePeriodChange("month")}
            >
              Mois
            </Button>
            <Button
              size="sm"
              variant={period === "quarter" ? "default" : "ghost"}
              onClick={() => handlePeriodChange("quarter")}
            >
              Trimestre
            </Button>
            <Button
              size="sm"
              variant={period === "year" ? "default" : "ghost"}
              onClick={() => handlePeriodChange("year")}
            >
              Année
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar name="Opérationnel" dataKey="operational" stackId="a" fill="hsl(var(--chart-1))" />
              <Bar name="En maintenance" dataKey="maintenance" stackId="a" fill="hsl(var(--chart-2))" />
              <Bar name="Hors service" dataKey="outOfService" stackId="a" fill="hsl(var(--chart-3))" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-muted-foreground text-sm">Graphique: Évolution du statut de la flotte</div>
              <div className="mt-2 flex justify-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                  <span className="text-xs text-muted-foreground">Opérationnel</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-warning mr-2"></div>
                  <span className="text-xs text-muted-foreground">En maintenance</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
                  <span className="text-xs text-muted-foreground">Hors service</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
