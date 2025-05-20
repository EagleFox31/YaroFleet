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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Create schema for vehicle form validation
const vehicleFormSchema = z.object({
  registrationNumber: z.string().min(1, "Numéro d'immatriculation requis"),
  brand: z.string().min(1, "Marque requise"),
  model: z.string().min(1, "Modèle requis"),
  year: z.coerce.number().min(1900, "Année invalide").max(new Date().getFullYear() + 1, "Année future invalide"),
  mileage: z.coerce.number().min(0, "Kilométrage invalide"),
  fuelType: z.enum(["diesel", "petrol", "electric", "hybrid", "other"]),
  status: z.enum(["operational", "maintenance", "out_of_service"]),
  nextMaintenanceDate: z.string().optional(),
  nextMaintenanceMileage: z.coerce.number().min(0, "Kilométrage invalide").optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  initialData?: Partial<VehicleFormValues>;
  isEdit?: boolean;
  vehicleId?: number;
}

export function VehicleForm({ initialData, isEdit = false, vehicleId }: VehicleFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      registrationNumber: initialData?.registrationNumber || "",
      brand: initialData?.brand || "",
      model: initialData?.model || "",
      year: initialData?.year || new Date().getFullYear(),
      mileage: initialData?.mileage || 0,
      fuelType: initialData?.fuelType || "diesel",
      status: initialData?.status || "operational",
      nextMaintenanceDate: initialData?.nextMaintenanceDate || "",
      nextMaintenanceMileage: initialData?.nextMaintenanceMileage || 0,
    },
  });
  
  const createVehicleMutation = useMutation({
    mutationFn: async (values: VehicleFormValues) => {
      return apiRequest(isEdit ? "PATCH" : "POST", isEdit ? `/api/vehicles/${vehicleId}` : "/api/vehicles", values);
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Véhicule mis à jour" : "Véhicule ajouté",
        description: isEdit ? "Le véhicule a été mis à jour avec succès." : "Le véhicule a été ajouté avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setLocation("/vehicles");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de ${isEdit ? "la mise à jour" : "l'ajout"} du véhicule: ${error.message}`,
      });
    },
  });
  
  function onSubmit(values: VehicleFormValues) {
    createVehicleMutation.mutate(values);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Modifier le véhicule" : "Ajouter un véhicule"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immatriculation</FormLabel>
                    <FormControl>
                      <Input placeholder="AB-123-CD" {...field} />
                    </FormControl>
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
                        <SelectItem value="operational">Opérationnel</SelectItem>
                        <SelectItem value="maintenance">En maintenance</SelectItem>
                        <SelectItem value="out_of_service">Hors service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marque</FormLabel>
                    <FormControl>
                      <Input placeholder="Renault" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <FormControl>
                      <Input placeholder="Master" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Année</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilométrage</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de carburant</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type de carburant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="petrol">Essence</SelectItem>
                        <SelectItem value="electric">Électrique</SelectItem>
                        <SelectItem value="hybrid">Hybride</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nextMaintenanceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prochaine maintenance (date)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nextMaintenanceMileage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prochaine maintenance (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => setLocation("/vehicles")}>
              Annuler
            </Button>
            <Button type="submit" disabled={createVehicleMutation.isPending}>
              {createVehicleMutation.isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                  Traitement...
                </>
              ) : (
                isEdit ? "Mettre à jour" : "Ajouter"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
