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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { WorkOrderTable } from "@/components/maintenance/work-order-table";
import { FuelRecordTable } from "@/components/fuel/fuel-record-table";
import { formatDate, formatDistance, getStatusColor, translateStatus } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export default function VehicleDetails({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  const vehicleId = parseInt(params.id);
  
  type Vehicle = {
    id: number;
    brand: string;
    model: string;
    registrationNumber: string;
    year: number;
    mileage: number;
    status: string;
    nextMaintenanceDate?: string;
    nextMaintenanceMileage?: number;
    fuelType: string;
    // add any other fields you use from vehicle
  };

  const { data: vehicle, isLoading } = useQuery<Vehicle>({
    queryKey: [`/api/vehicles/${vehicleId}`],
  });
  
  const { data: maintenanceSchedules } = useQuery<any[]>({
    queryKey: [`/api/maintenance-schedules/vehicle/${vehicleId}`],
  });
  
  const deleteVehicleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/vehicles/${vehicleId}`);
    },
    onSuccess: () => {
      toast({
        title: "Véhicule supprimé",
        description: "Le véhicule a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setLocation("/vehicles");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: `Erreur lors de la suppression du véhicule: ${error.message}`,
      });
    },
  });
  
  const handleDelete = () => {
    deleteVehicleMutation.mutate();
    setIsDeleteDialogOpen(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!vehicle) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Véhicule non trouvé</h2>
        <p className="text-muted-foreground mt-2">
          Le véhicule que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <Button 
          className="mt-4" 
          onClick={() => setLocation("/vehicles")}
        >
          Retour à la liste
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader 
        title={`${vehicle.brand} ${vehicle.model} - ${vehicle.registrationNumber}`}
        subtitle={`Année ${vehicle.year} • ${formatDistance(vehicle.mileage)}`}
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/maintenance/work-orders/new?vehicleId=${vehicleId}`)}
            >
              <i className="fas fa-tools mr-2"></i>
              Créer un OT
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setLocation(`/fuel/new?vehicleId=${vehicleId}`)}
            >
              <i className="fas fa-gas-pump mr-2"></i>
              Ajouter un plein
            </Button>
            
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
                    Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteVehicleMutation.isPending}
                  >
                    {deleteVehicleMutation.isPending ? "Suppression..." : "Supprimer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(vehicle.status)}>
              {translateStatus(vehicle.status)}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Prochaine maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vehicle.nextMaintenanceDate ? (
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium">{formatDate(vehicle.nextMaintenanceDate)}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucune date planifiée</div>
              )}
              
              {vehicle.nextMaintenanceMileage ? (
                <div>
                  <div className="text-sm text-muted-foreground">Kilométrage</div>
                  <div className="font-medium">{formatDistance(vehicle.nextMaintenanceMileage)}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucun kilométrage planifié</div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Carburant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Type</div>
            <div className="font-medium capitalize">
              {vehicle.fuelType === "diesel" ? "Diesel" : 
               vehicle.fuelType === "petrol" ? "Essence" : 
               vehicle.fuelType === "electric" ? "Électrique" : 
               vehicle.fuelType === "hybrid" ? "Hybride" : "Autre"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="maintenance">Planifications</TabsTrigger>
          <TabsTrigger value="work-orders">Ordres de travail</TabsTrigger>
          <TabsTrigger value="fuel">Carburant</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Informations du véhicule</CardTitle>
              <CardDescription>Modifier les informations du véhicule</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleForm
                initialData={{
                  ...vehicle,
                  status: vehicle.status as "maintenance" | "operational" | "out_of_service" | undefined,
                  fuelType: (
                    vehicle.fuelType === "diesel" ||
                    vehicle.fuelType === "petrol" ||
                    vehicle.fuelType === "electric" ||
                    vehicle.fuelType === "hybrid" ||
                    vehicle.fuelType === "other"
                  )
                    ? vehicle.fuelType
                    : "other",
                }}
                isEdit={true}
                vehicleId={vehicleId}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Planifications de maintenance</CardTitle>
                <CardDescription>Maintenance préventive programmée</CardDescription>
              </div>
              <Button 
                onClick={() => setLocation(`/maintenance/new?vehicleId=${vehicleId}`)}
              >
                <i className="fas fa-plus mr-2"></i>
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              {maintenanceSchedules && maintenanceSchedules.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceSchedules.map((schedule: any) => (
                    <div key={schedule.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{schedule.title}</h3>
                        <Badge variant={schedule.isActive ? "success" : "neutral"}>
                          {schedule.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2">{schedule.description}</p>
                      
                      <Separator className="my-4" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Fréquence</div>
                          <div className="font-medium">
                            {schedule.frequency === "daily" && "Quotidienne"}
                            {schedule.frequency === "weekly" && "Hebdomadaire"}
                            {schedule.frequency === "monthly" && "Mensuelle"}
                            {schedule.frequency === "quarterly" && "Trimestrielle"}
                            {schedule.frequency === "yearly" && "Annuelle"}
                            {schedule.frequency === "mileage" && "Kilométrage"}
                            {schedule.frequencyValue > 1 && ` (${schedule.frequencyValue})`}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Prochaine maintenance</div>
                          <div className="font-medium">
                            {schedule.scheduledDate ? formatDate(schedule.scheduledDate) : "Non défini"}
                            {schedule.scheduledMileage && ` ou ${formatDistance(schedule.scheduledMileage)}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/maintenance/${schedule.id}?vehicleId=${vehicleId}`)}
                        >
                          <i className="fas fa-edit mr-2"></i>
                          Modifier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setLocation(`/maintenance/work-orders/new?vehicleId=${vehicleId}&scheduleId=${schedule.id}`)}
                        >
                          <i className="fas fa-tools mr-2"></i>
                          Créer OT
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted">
                    <i className="fas fa-calendar-alt text-muted-foreground"></i>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-foreground">Aucune planification</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Commencez par ajouter une planification de maintenance pour ce véhicule.
                  </p>
                  <div className="mt-6">
                    <Button 
                      onClick={() => setLocation(`/maintenance/new?vehicleId=${vehicleId}`)}
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Ajouter une planification
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="work-orders">
          <Card>
            <CardHeader>
              <CardTitle>Ordres de travail</CardTitle>
              <CardDescription>Historique des interventions</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkOrderTable vehicleId={vehicleId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle>Suivi carburant</CardTitle>
              <CardDescription>Consommation et statistiques</CardDescription>
            </CardHeader>
            <CardContent>
              <FuelRecordTable vehicleId={vehicleId} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Carte grise, assurance, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-muted">
                  <i className="fas fa-file-alt text-muted-foreground"></i>
                </div>
                <h3 className="mt-2 text-sm font-medium text-foreground">Aucun document</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Commencez par ajouter des documents pour ce véhicule.
                </p>
                <div className="mt-6">
                  <Button variant="outline">
                    <i className="fas fa-upload mr-2"></i>
                    Ajouter un document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
