import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartForm } from "@/components/inventory/part-form";
import { formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Part = {
  id: number;
  name: string;
  reference: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  description?: string;
  location?: string;
  supplier?: string;
  [key: string]: any;
};

export default function PartDetails({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateStockDialogOpen, setIsUpdateStockDialogOpen] = useState(false);
  const [stockUpdateAmount, setStockUpdateAmount] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  
  const partId = parseInt(params.id);
  
  const { data: part, isLoading } = useQuery<Part>({
    queryKey: [`/api/parts/${partId}`],
  });
  
  const { data: usageHistory = [] } = useQuery<any[]>({
    queryKey: [`/api/parts/${partId}/usage-history`],
  });
  
  const deletePartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/parts/${partId}`);
    },
    onSuccess: () => {
      toast({
        title: "Pièce supprimée",
        description: "La pièce a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setLocation("/inventory");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de la suppression: ${error.message}`,
      });
    },
  });
  
  const updateStockMutation = useMutation({
    mutationFn: async () => {
      const newQuantity = (part?.quantity || 0) + stockUpdateAmount;
      return apiRequest("PATCH", `/api/parts/${partId}`, {
        quantity: newQuantity >= 0 ? newQuantity : 0
      });
    },
    onSuccess: () => {
      toast({
        title: "Stock mis à jour",
        description: `Le stock a été ${stockUpdateAmount >= 0 ? "augmenté" : "diminué"} de ${Math.abs(stockUpdateAmount)} unité(s).`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/parts/${partId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setIsUpdateStockDialogOpen(false);
      setStockUpdateAmount(0);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de la mise à jour du stock: ${error.message}`,
      });
    },
  });
  
  const handleDelete = () => {
    deletePartMutation.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  const handleUpdateStock = () => {
    updateStockMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!part) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Pièce non trouvée</h2>
        <p className="text-muted-foreground mt-2">
          La pièce que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/inventory")}
        >
          Retour à l'inventaire
        </Button>
      </div>
    );
  }
  
  const isLowStock = part.quantity <= part.minQuantity;
  
  return (
    <div>
      <PageHeader 
        title={part.name}
        subtitle={`Référence: ${part.reference}`}
        actions={
          <div className="flex space-x-2">
            <Dialog open={isUpdateStockDialogOpen} onOpenChange={setIsUpdateStockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <i className="fas fa-boxes mr-2"></i>
                  Ajuster le stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajuster le stock</DialogTitle>
                  <DialogDescription>
                    Ajoutez ou retirez des pièces du stock.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Stock actuel</Label>
                    <div className="text-lg font-medium">{part.quantity} unité(s)</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stockAmount">Ajustement</Label>
                    <Input 
                      id="stockAmount" 
                      type="number" 
                      value={stockUpdateAmount}
                      onChange={(e) => setStockUpdateAmount(parseInt(e.target.value) || 0)}
                      placeholder="Entrez une valeur (+ pour ajouter, - pour retirer)"
                    />
                    <p className="text-sm text-muted-foreground">
                      Entrez une valeur positive pour ajouter ou négative pour retirer du stock.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Nouveau stock</Label>
                    <div className="text-lg font-medium">
                      {Math.max(0, (part.quantity + stockUpdateAmount))} unité(s)
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUpdateStockDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleUpdateStock} disabled={stockUpdateAmount === 0 || updateStockMutation.isPending}>
                    {updateStockMutation.isPending ? "Mise à jour..." : "Confirmer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
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
                    Êtes-vous sûr de vouloir supprimer cette pièce ? Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deletePartMutation.isPending}
                  >
                    {deletePartMutation.isPending ? "Suppression..." : "Supprimer"}
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
            <CardTitle className="text-sm text-muted-foreground">Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-2xl font-bold">{part.quantity}</span>
              {isLowStock && (
                <Badge variant="warning" className="ml-2">
                  Stock bas
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Seuil d'alerte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{part.minQuantity}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Prix unitaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(part.unitPrice)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="usage">Utilisation</TabsTrigger>
          <TabsTrigger value="edit">Modifier</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Informations sur la pièce</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <div className="p-4 border rounded-md">
                    {part.description || "Aucune description fournie."}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Emplacement</h3>
                  <div className="p-4 border rounded-md">
                    {part.location || "Emplacement non spécifié."}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Fournisseur</h3>
                  <div className="p-4 border rounded-md">
                    {part.supplier || "Fournisseur non spécifié."}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Valeur en stock</h3>
                  <div className="p-4 border rounded-md">
                    <span className="text-xl font-bold">
                      {formatPrice(part.quantity * part.unitPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Historique d'utilisation</CardTitle>
              <CardDescription>Utilisation de cette pièce dans les ordres de travail</CardDescription>
            </CardHeader>
            <CardContent>
              {usageHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted">
                    <i className="fas fa-history text-muted-foreground"></i>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-foreground">Aucune utilisation</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cette pièce n'a pas encore été utilisée dans un ordre de travail.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {usageHistory.map((usage: any) => (
                    <div key={usage.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Ordre de travail #{usage.workOrderId}</div>
                          <div className="text-sm text-muted-foreground">
                            {usage.workOrder?.title || "Ordre de travail"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{usage.quantity} unité(s)</div>
                          <div className="text-sm text-muted-foreground">
                            {formatPrice(usage.unitPrice * usage.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Modifier la pièce</CardTitle>
            </CardHeader>
            <CardContent>
              <PartForm initialData={part} isEdit={true} partId={partId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
