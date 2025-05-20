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
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Create schema for fuel record form validation
const fuelRecordFormSchema = z.object({
  vehicleId: z.coerce.number().min(1, "Véhicule requis"),
  date: z.string().min(1, "Date requise"),
  quantity: z.coerce.number().min(0.1, "Quantité invalide"),
  cost: z.coerce.number().min(0, "Coût invalide"),
  mileage: z.coerce.number().min(0, "Kilométrage invalide"),
  fullTank: z.boolean().default(true),
  notes: z.string().optional(),
});

type FuelRecordFormValues = z.infer<typeof fuelRecordFormSchema>;

interface FuelRecordFormProps {
  initialData?: Partial<FuelRecordFormValues>;
  isEdit?: boolean;
  recordId?: number;
  vehicleId?: number;
}

export function FuelRecordForm({ 
  initialData, 
  isEdit = false, 
  recordId,
  vehicleId 
}: FuelRecordFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch vehicles for dropdown
  const { data: vehiclesData } = useQuery({
    queryKey: ["/api/vehicles"],
  });
  
  const vehicles = vehiclesData?.vehicles || [];
  
  const form = useForm<FuelRecordFormValues>({
    resolver: zodResolver(fuelRecordFormSchema),
    defaultValues: {
      vehicleId: initialData?.vehicleId || vehicleId || 0,
      date: initialData?.date 
        ? new Date(initialData.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      quantity: initialData?.quantity || 0,
      cost: initialData?.cost || 0,
      mileage: initialData?.mileage || 0,
      fullTank: initialData?.fullTank !== undefined ? initialData.fullTank : true,
      notes: initialData?.notes || "",
    },
  });
  
  const createFuelRecordMutation = useMutation({
    mutationFn: async (values: FuelRecordFormValues) => {
      return apiRequest(
        isEdit ? "PATCH" : "POST", 
        isEdit ? `/api/fuel-records/${recordId}` : "/api/fuel-records", 
        values
      );
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Enregistrement mis à jour" : "Plein enregistré",
        description: isEdit 
          ? "L'enregistrement de carburant a été mis à jour." 
          : "Le plein de carburant a été enregistré avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fuel-records"] });
      
      if (vehicleId) {
        queryClient.invalidateQueries({ queryKey: ["/api/fuel-records/vehicle", vehicleId] });
        setLocation(`/vehicles/${vehicleId}`);
      } else {
        setLocation("/fuel");
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de ${isEdit ? "la mise à jour" : "l'enregistrement"} du plein: ${error.message}`,
      });
    },
  });
  
  function onSubmit(values: FuelRecordFormValues) {
    createFuelRecordMutation.mutate(values);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Modifier le plein" : "Enregistrer un plein"}</CardTitle>
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité (litres)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0.1} step={0.01} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coût (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} {...field} />
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
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fullTank"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Plein complet</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Cochez si le réservoir a été rempli complètement
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes ou commentaires"
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
              onClick={() => vehicleId ? setLocation(`/vehicles/${vehicleId}`) : setLocation("/fuel")}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createFuelRecordMutation.isPending}
            >
              {createFuelRecordMutation.isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                  Traitement...
                </>
              ) : (
                isEdit ? "Mettre à jour" : "Enregistrer"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
