import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Create schema for maintenance schedule form validation
const maintenanceScheduleFormSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Véhicule requis"),
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledMileage: z.coerce.number().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly", "yearly", "mileage"]),
  frequencyValue: z.coerce.number().min(1, "Valeur de fréquence requise"),
  isActive: z.boolean().default(true),
});

type MaintenanceScheduleFormValues = z.infer<typeof maintenanceScheduleFormSchema>;

interface MaintenanceScheduleFormProps {
  initialData?: Partial<MaintenanceScheduleFormValues>;
  isEdit?: boolean;
  scheduleId?: number;
  vehicleId?: number;
}

export function MaintenanceScheduleForm({ 
  initialData, 
  isEdit = false, 
  scheduleId,
  vehicleId 
}: MaintenanceScheduleFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch vehicles for dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ["/api/vehicles"],
  });
  
  const vehicles = vehiclesData?.vehicles || [];
  
  const form = useForm<MaintenanceScheduleFormValues>({
    resolver: zodResolver(maintenanceScheduleFormSchema),
    defaultValues: {
      vehicleId: initialData?.vehicleId || vehicleId || 0,
      title: initialData?.title || "",
      description: initialData?.description || "",
      scheduledDate: initialData?.scheduledDate || "",
      scheduledMileage: initialData?.scheduledMileage || undefined,
      frequency: initialData?.frequency || "monthly",
      frequencyValue: initialData?.frequencyValue || 1,
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  });
  
  const createMaintenanceScheduleMutation = useMutation({
    mutationFn: async (values: MaintenanceScheduleFormValues) => {
      return apiRequest(
        isEdit ? "PATCH" : "POST", 
        isEdit ? `/api/maintenance-schedules/${scheduleId}` : "/api/maintenance-schedules", 
        values
      );
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Maintenance mise à jour" : "Maintenance planifiée",
        description: isEdit 
          ? "La maintenance a été mise à jour avec succès." 
          : "La maintenance a été planifiée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance-schedules"] });
      
      if (vehicleId) {
        setLocation(`/vehicles/${vehicleId}`);
      } else {
        setLocation("/maintenance");
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de ${isEdit ? "la mise à jour" : "la planification"} de la maintenance: ${error.message}`,
      });
    },
  });
  
  function onSubmit(values: MaintenanceScheduleFormValues) {
    createMaintenanceScheduleMutation.mutate(values);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Modifier la maintenance" : "Planifier une maintenance"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Véhicule</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                      disabled={!!vehicleId || isEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un véhicule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.registrationNumber} - {vehicle.brand} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input placeholder="Vidange huile moteur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fréquence</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une fréquence" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Quotidienne</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="monthly">Mensuelle</SelectItem>
                        <SelectItem value="quarterly">Trimestrielle</SelectItem>
                        <SelectItem value="yearly">Annuelle</SelectItem>
                        <SelectItem value="mileage">Kilométrage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequencyValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur de fréquence</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        placeholder={
                          form.watch("frequency") === "mileage" 
                            ? "10000 (km)" 
                            : "1 (unité)"
                        }
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date prévue (première fois)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="scheduledMileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilométrage prévu (première fois)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        placeholder="100000" 
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Actif</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Activer ou désactiver cette planification de maintenance
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description des tâches à effectuer lors de cette maintenance"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => vehicleId ? setLocation(`/vehicles/${vehicleId}`) : setLocation("/maintenance")}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createMaintenanceScheduleMutation.isPending}
            >
              {createMaintenanceScheduleMutation.isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                  Traitement...
                </>
              ) : (
                isEdit ? "Mettre à jour" : "Planifier"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
