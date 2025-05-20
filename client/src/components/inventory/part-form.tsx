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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Create schema for part form validation
const partFormSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  reference: z.string().min(1, "Référence requise"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "Quantité invalide"),
  minQuantity: z.coerce.number().min(0, "Seuil minimal invalide"),
  location: z.string().optional(),
  unitPrice: z.coerce.number().min(0, "Prix unitaire invalide"),
  supplier: z.string().optional(),
});

type PartFormValues = z.infer<typeof partFormSchema>;

interface PartFormProps {
  initialData?: Partial<PartFormValues>;
  isEdit?: boolean;
  partId?: number;
}

export function PartForm({ initialData, isEdit = false, partId }: PartFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      reference: initialData?.reference || "",
      description: initialData?.description || "",
      quantity: initialData?.quantity || 0,
      minQuantity: initialData?.minQuantity || 5,
      location: initialData?.location || "",
      unitPrice: initialData?.unitPrice || 0,
      supplier: initialData?.supplier || "",
    },
  });
  
  const createPartMutation = useMutation({
    mutationFn: async (values: PartFormValues) => {
      return apiRequest(
        isEdit ? "PATCH" : "POST", 
        isEdit ? `/api/parts/${partId}` : "/api/parts", 
        values
      );
    },
    onSuccess: () => {
      toast({
        title: isEdit ? "Pièce mise à jour" : "Pièce créée",
        description: isEdit 
          ? "La pièce a été mise à jour avec succès." 
          : "La pièce a été ajoutée avec succès au stock.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setLocation("/inventory");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de ${isEdit ? "la mise à jour" : "l'ajout"} de la pièce: ${error.message}`,
      });
    },
  });
  
  function onSubmit(values: PartFormValues) {
    createPartMutation.mutate(values);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Modifier la pièce" : "Ajouter une pièce"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Filtre à huile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Référence</FormLabel>
                    <FormControl>
                      <Input placeholder="FH-2345" {...field} disabled={isEdit} />
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
                    <FormLabel>Quantité en stock</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="minQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil d'alerte</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix unitaire (€)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplacement</FormLabel>
                    <FormControl>
                      <Input placeholder="Étagère A-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Fournisseur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom du fournisseur" {...field} />
                    </FormControl>
                    <FormMessage />
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
                        placeholder="Description détaillée de la pièce"
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
              onClick={() => setLocation("/inventory")}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={createPartMutation.isPending}
            >
              {createPartMutation.isPending ? (
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
