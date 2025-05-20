import React, { useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Create schema for work order form validation
const workOrderFormSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Véhicule requis"),
  technicianId: z.coerce.number().nullable().optional(),
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  diagnosis: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  startDate: z.string().optional(),
  isPreventive: z.boolean().default(false),
  maintenanceScheduleId: z.coerce.number().nullable().optional(),
});

type WorkOrderFormValues = z.infer<typeof workOrderFormSchema>;

interface WorkOrderFormProps {
  initialData?: Partial<WorkOrderFormValues>;
  isEdit?: boolean;
  workOrderId?: number;
  preselectedVehicleId?: number;
}

export function WorkOrderForm({ initialData, isEdit = false, workOrderId, preselectedVehicleId }: WorkOrderFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch vehicles for dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ["/api/vehicles"],
  });
  
  // Fetch technicians (users with technician role) for dropdown
  const { data: techniciansData } = useQuery({
    queryKey: ["/api/users/technicians"],
  });
  
  // Fetch maintenance schedules for the selected vehicle
  const { data: schedulesData, refetch: refetchSchedules } = useQuery({
    queryKey: ["/api/maintenance-schedules/vehicle", initialData?.vehicleId || preselectedVehicleId],
    enabled: !!(initialData?.vehicleId || preselectedVehicleId),
  });
  
  const vehicles = vehiclesData?.vehicles || [];
  const technicians = techniciansData || [];
  const schedules = schedulesData || [];
  
  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderFormSchema),
    defaultValues: {
      vehicleId: initialData?.vehicleId || preselectedVehicleId || 0,
      technicianId: initialData?.technicianId || null,
      title: initialData?.title || "",
      description: initialData?.description || "",
      diagnosis: initialData?.diagnosis || "",
      status: initialData?.status || "pending",
      priority: initialData?.priority || "medium",
      startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isPreventive: initialData?.isPreventive || false,
      maintenanceScheduleId: initialData?.maintenanceScheduleId || null,
    },
  });
  
  // Watch for changes to vehicleId to update maintenance schedules
  const watchVehicleId = form.watch("vehicleId");
  const watchIsPreventive = form.watch("isPreventive");
  
  useEffect(() => {
    if (watchVehicleId) {
      refetchSchedules();
    }
  }, [watchVehicleId, refetchSchedules]);
  
  const createWorkOrderMutation = useMutation({
    mutationFn: async (values: WorkOrderFormValues) => {
      return apiRequest(
        isEdit ? "PATCH" : "POST", 
        isEdit ? `/api/work-orders/${workOrderId}` : "/api/work-orders", 
        values
      );
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Ordre de travail mis à jour" : "Ordre de travail créé",
        description: isEdit 
          ? "L'ordre de travail a été mis à jour avec succès." 
          : "L'ordre de travail a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setLocation("/maintenance/work-orders");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de ${isEdit ? "la mise à jour" : "la création"} de l'ordre de travail: ${error.message}`,
      });
    },
  });
  
  function onSubmit(values: WorkOrderFormValues) {
    // If not preventive, clear the maintenance schedule ID
    if (!values.isPreventive) {
      values.maintenanceScheduleId = null;
    }
    
    createWorkOrderMutation.mutate(values);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Modifier l'ordre de travail" : "Créer un ordre de travail"}</CardTitle>
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
                      disabled={!!preselectedVehicleId || isEdit}
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
                name="technicianId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technicien</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                      defaultValue={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assigner un technicien" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Non assigné</SelectItem>
                        {technicians.map((tech: any) => (
                          <SelectItem key={tech.id} value={tech.id.toString()}>
                            {tech.name}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priorité</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une priorité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="isPreventive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Maintenance préventive</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Cochez si cet ordre est lié à une maintenance préventive planifiée
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              {watchIsPreventive && (
                <FormField
                  control={form.control}
                  name="maintenanceScheduleId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Plan de maintenance associé</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un plan de maintenance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          {schedules.map((schedule: any) => (
                            <SelectItem key={schedule.id} value={schedule.id.toString()}>
                              {schedule.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description détaillée des travaux à effectuer"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isEdit && (
                <FormField
                  control={form.control}
                  name="diagnosis"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Diagnostic</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Diagnostic après inspection"
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => setLocation("/maintenance/work-orders")}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createWorkOrderMutation.isPending}
            >
              {createWorkOrderMutation.isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                  Traitement...
                </>
              ) : (
                isEdit ? "Mettre à jour" : "Créer"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
