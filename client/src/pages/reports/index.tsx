import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/hooks/useAuth";

export default function ReportsIndex() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState("vehicle-usage");
  const [format, setFormat] = useState("excel");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simuler le temps de génération du rapport
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Rapport généré",
        description: "Le rapport a été généré avec succès et est prêt à être téléchargé.",
      });
    }, 2000);
  };

  const reportTypes = [
    { value: "vehicle-usage", label: "Utilisation des véhicules" },
    { value: "maintenance-costs", label: "Coûts de maintenance" },
    { value: "fuel-consumption", label: "Consommation de carburant" },
    { value: "parts-inventory", label: "Inventaire des pièces" },
    { value: "technician-performance", label: "Performance des techniciens" },
  ];

  const formatTypes = [
    { value: "excel", label: "Microsoft Excel (.xlsx)" },
    { value: "csv", label: "CSV (.csv)" },
    { value: "pdf", label: "PDF (.pdf)" },
  ];

  return (
    <div>
      <PageHeader 
        title="Exports & Rapports" 
        subtitle="Générer des rapports et exporter des données"
      />
      
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Générer un rapport</CardTitle>
              <CardDescription>
                Créez des rapports personnalisés en sélectionnant le type et la période
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Type de rapport</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Sélectionner un type de rapport" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Sélectionner un format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formatTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <DatePicker
                    date={startDate}
                    setDate={setStartDate}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <DatePicker
                    date={endDate}
                    setDate={setEndDate}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-file-export mr-2"></i>
                    Générer le rapport
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="exports">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Véhicules</CardTitle>
                <CardDescription>
                  Exporter toutes les données des véhicules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Incluant les informations d'immatriculation, marque, modèle, année, kilométrage et statut.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast({
                  title: "Export lancé",
                  description: "L'export des véhicules est en cours de préparation.",
                })}>
                  <i className="fas fa-download mr-2"></i>
                  Exporter (.xlsx)
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Ordres de travail</CardTitle>
                <CardDescription>
                  Exporter les données des ordres de travail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Incluant les détails des interventions, techniciens assignés, pièces utilisées et coûts.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast({
                  title: "Export lancé",
                  description: "L'export des ordres de travail est en cours de préparation.",
                })}>
                  <i className="fas fa-download mr-2"></i>
                  Exporter (.xlsx)
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Inventaire</CardTitle>
                <CardDescription>
                  Exporter l'inventaire des pièces détachées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Incluant les références, quantités en stock, prix d'achat et fournisseurs.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast({
                  title: "Export lancé",
                  description: "L'export de l'inventaire est en cours de préparation.",
                })}>
                  <i className="fas fa-download mr-2"></i>
                  Exporter (.xlsx)
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Carburant</CardTitle>
                <CardDescription>
                  Exporter les données de consommation de carburant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Incluant les dates, quantités, coûts et véhicules concernés.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast({
                  title: "Export lancé",
                  description: "L'export des données de carburant est en cours de préparation.",
                })}>
                  <i className="fas fa-download mr-2"></i>
                  Exporter (.xlsx)
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs</CardTitle>
                <CardDescription>
                  Exporter la liste des utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Incluant les noms, rôles et coordonnées (sans les mots de passe).
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast({
                  title: "Export lancé",
                  description: "L'export des utilisateurs est en cours de préparation.",
                })}>
                  <i className="fas fa-download mr-2"></i>
                  Exporter (.xlsx)
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Base de données complète</CardTitle>
                <CardDescription>
                  Exporter toutes les données du système
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sauvegarde complète de toutes les données pour archivage ou migration.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => toast({
                  title: "Export lancé",
                  description: "L'export complet de la base de données est en cours de préparation.",
                })}>
                  <i className="fas fa-download mr-2"></i>
                  Exporter (.zip)
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}