import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkOrderForm } from "@/components/maintenance/work-order-form";
import { formatDate, getStatusColor, translateStatus, formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WorkOrderDetails({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const [partQuantity, setPartQuantity] = useState(1);
  
  const workOrderId = parseInt(params.id);
  
  // Fetch work order details
  const { data: workOrder, isLoading } = useQuery({
    queryKey: [`/api/work-orders/${workOrderId}`],
  });
  
  // Fetch vehicle details
  const { data: vehicle } = useQuery({
    queryKey: [`/api/vehicles/${workOrder?.vehicleId}`],
    enabled: !!workOrder?.vehicleId,
  });
  
  // Fetch technician details
  const { data: technician } = useQuery({
    queryKey: [`/api/users/${workOrder?.technicianId}`],
    enabled: !!workOrder?.technicianId,
  });
  
  // Fetch parts used in this work order
  const { data: partsUsed = [], refetch: refetchPartsUsed } = useQuery({
    queryKey: [`/api/work-orders/${workOrderId}/parts`],
    enabled: !!workOrderId,
  });
  
  // Fetch all available parts for dropdown
  const { data: availableParts = [] } = useQuery({
    queryKey: ["/api/parts", { limit: 100 }],
  });
  
  // Define mutations
  const deleteWorkOrderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/work-orders/${workOrderId}`);
    },
    onSuccess: () => {
      toast({
        title: "Ordre de travail supprimé",
        description: "L'ordre de travail a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      setLocation("/maintenance/work-orders");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
      });
    },
  });
  
  const addPartMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPartId) return;
      
      const selectedPart = (availableParts.parts || []).find((p: any) => p.id === selectedPartId);
      
      return apiRequest("POST", `/api/work-orders/${workOrderId}/parts`, {
        partId: selectedPartId,
        quantity: partQuantity,
        unitPrice: selectedPart?.unitPrice || 0
      });
    },
    onSuccess: () => {
      toast({
        title: "Pièce ajoutée",
        description: "La pièce a été ajoutée avec succès à l'ordre de travail.",
      });
      refetchPartsUsed();
      setIsAddPartDialogOpen(false);
      setSelectedPartId(null);
      setPartQuantity(1);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de l'ajout de la pièce: ${error.message}`,
      });
    },
  });
  
  const removePartMutation = useMutation({
    mutationFn: async (partUsedId: number) => {
      return apiRequest("DELETE", `/api/parts-used/${partUsedId}`);
    },
    onSuccess: () => {
      toast({
        title: "Pièce retirée",
        description: "La pièce a été retirée avec succès de l'ordre de travail.",
      });
      refetchPartsUsed();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors du retrait de la pièce: ${error.message}`,
      });
    },
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/work-orders/${workOrderId}`, {
        status
      });
    },
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de l'ordre de travail a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/work-orders/${workOrderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de la mise à jour du statut: ${error.message}`,
      });
    },
  });
  
  const handleDelete = () => {
    deleteWorkOrderMutation.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  const handleAddPart = () => {
    addPartMutation.mutate();
  };
  
  const handleRemovePart = (partUsedId: number) => {
    removePartMutation.mutate(partUsedId);
  };
  
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };
  
  // Calculate total cost of parts
  const totalPartsCost = partsUsed.reduce((sum: number, part: any) => {
    return sum + (part.quantity * part.unitPrice);
  }, 0);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!workOrder) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Ordre de travail non trouvé</h2>
        <p className="text-muted-foreground mt-2">
          L'ordre de travail que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/maintenance/work-orders")}
        >
          Retour à la liste
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader 
        title={`Ordre de travail #${workOrderId}`}
        subtitle={workOrder.title}
        actions={
          <div className="flex space-x-2">
            <Select 
              value={workOrder.status} 
              onValueChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <i className="fas fa-trash-alt mr-2"></i>
                  Supprimer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                  <DialogDescription>
                    Êtes-vous sûr de vouloir supprimer cet ordre de travail ? Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteWorkOrderMutation.isPending}
                  >
                    {deleteWorkOrderMutation.isPending ? "Suppression..." : "Supprimer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(workOrder.status)}>
              {translateStatus(workOrder.status)}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">
              {vehicle?.registrationNumber || `#${workOrder.vehicleId}`}
              {vehicle && (
                <span className="text-muted-foreground ml-2 text-sm">
                  {vehicle.brand} {vehicle.model}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Technicien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">
              {technician?.name || (workOrder.technicianId ? `#${workOrder.technicianId}` : "Non assigné")}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Date début</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">
              {formatDate(workOrder.startDate)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Date fin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium">
              {workOrder.endDate ? formatDate(workOrder.endDate) : "Non terminé"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Priorité</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(workOrder.priority)}>
              {translateStatus(workOrder.priority)}
            </Badge>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="parts">Pièces détachées</TabsTrigger>
          <TabsTrigger value="edit">Modifier</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Détails de l'intervention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <div className="p-4 border rounded-md">
                  {workOrder.description || "Aucune description fournie."}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Diagnostic</h3>
                <div className="p-4 border rounded-md">
                  {workOrder.diagnosis || "Aucun diagnostic disponible."}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Type d'intervention</h3>
                <Badge variant={workOrder.isPreventive ? "success" : "neutral"}>
                  {workOrder.isPreventive ? "Maintenance préventive" : "Maintenance corrective"}
                </Badge>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Coût total des pièces</h3>
                <div className="text-xl font-bold">{formatPrice(totalPartsCost)}</div>
              </div>
              
              {workOrder.cost !== undefined && workOrder.cost > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Coût total de l'intervention</h3>
                  <div className="text-xl font-bold">{formatPrice(workOrder.cost)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pièces utilisées</CardTitle>
                <CardDescription>Pièces détachées utilisées pour cette intervention</CardDescription>
              </div>
              
              <Dialog open={isAddPartDialogOpen} onOpenChange={setIsAddPartDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={["completed", "cancelled"].includes(workOrder.status)}>
                    <i className="fas fa-plus mr-2"></i>
                    Ajouter une pièce
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une pièce</DialogTitle>
                    <DialogDescription>
                      Sélectionnez une pièce à ajouter à cet ordre de travail.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="part">Pièce</Label>
                      <Select 
                        value={selectedPartId?.toString() || "none"} 
                        onValueChange={(value) => setSelectedPartId(value !== "none" ? parseInt(value) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une pièce" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableParts.parts || []).map((part: any) => (
                            <SelectItem key={part.id} value={part.id.toString()}>
                              {part.name} ({part.reference}) - {formatPrice(part.unitPrice)} - Stock: {part.quantity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantité</Label>
                      <Input 
                        id="quantity" 
                        type="number" 
                        min={1} 
                        value={partQuantity} 
                        onChange={(e) => setPartQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddPartDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleAddPart}
                      disabled={!selectedPartId || addPartMutation.isPending}
                    >
                      {addPartMutation.isPending ? "Ajout en cours..." : "Ajouter"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {partsUsed.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted">
                    <i className="fas fa-tools text-muted-foreground"></i>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-foreground">Aucune pièce utilisée</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aucune pièce n'a été utilisée pour cette intervention.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partsUsed.map((partUsed: any) => (
                      <TableRow key={partUsed.id}>
                        <TableCell>{partUsed.part?.reference || `#${partUsed.partId}`}</TableCell>
                        <TableCell>{partUsed.part?.name || "Pièce inconnue"}</TableCell>
                        <TableCell>{partUsed.quantity}</TableCell>
                        <TableCell>{formatPrice(partUsed.unitPrice)}</TableCell>
                        <TableCell>{formatPrice(partUsed.quantity * partUsed.unitPrice)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemovePart(partUsed.id)}
                            disabled={["completed", "cancelled"].includes(workOrder.status) || removePartMutation.isPending}
                          >
                            <i className="fas fa-trash-alt text-destructive"></i>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-medium">Total</TableCell>
                      <TableCell className="font-bold">{formatPrice(totalPartsCost)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Modifier l'ordre de travail</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkOrderForm initialData={workOrder} isEdit={true} workOrderId={workOrderId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
