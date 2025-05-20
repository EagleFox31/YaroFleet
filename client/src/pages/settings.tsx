import React, { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { DataTable } from "@/components/ui/data-table";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin",
  });
  
  // Columns for users table
  const userColumns = [
    {
      header: "Nom",
      accessorKey: "name",
      cell: (value: string) => <div className="font-medium">{value}</div>,
    },
    {
      header: "Utilisateur",
      accessorKey: "username",
      cell: (value: string) => <div>{value}</div>,
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (value: string) => <div>{value}</div>,
    },
    {
      header: "Rôle",
      accessorKey: "role",
      cell: (value: string) => (
        <Badge variant={
          value === "admin" ? "destructive" :
          value === "workshop_manager" ? "primary" :
          value === "technician" ? "warning" : "secondary"
        }>
          {value === "admin" ? "Administrateur" :
           value === "workshop_manager" ? "Chef d'atelier" :
           value === "technician" ? "Technicien" : "Utilisateur"}
        </Badge>
      ),
    },
    {
      header: "Créé le",
      accessorKey: "createdAt",
      cell: (value: string) => <div>{formatDate(value)}</div>,
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (value: number) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Edit user ${value}`);
            }}
          >
            <i className="fas fa-edit text-secondary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`Delete user ${value}`);
            }}
          >
            <i className="fas fa-trash-alt text-destructive"></i>
          </Button>
        </div>
      ),
    },
  ];
  
  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Accès non autorisé</h2>
        <p className="text-muted-foreground mt-2">
          Vous n'avez pas les permissions nécessaires pour accéder aux paramètres.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <PageHeader 
        title="Paramètres" 
        subtitle="Configuration du système et gestion des utilisateurs"
      />
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <CardDescription>Gérer les utilisateurs et leurs permissions</CardDescription>
              </div>
              <Button>
                <i className="fas fa-user-plus mr-2"></i>
                Ajouter un utilisateur
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                data={users}
                columns={userColumns}
                searchPlaceholder="Rechercher un utilisateur..."
                isLoading={isLoadingUsers}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>Informations générales sur votre entreprise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nom de l'entreprise</Label>
                  <Input id="company-name" defaultValue="Société Transport XYZ" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Adresse</Label>
                  <Input id="company-address" defaultValue="123 Rue du Transport, 75000 Paris" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Téléphone</Label>
                  <Input id="company-phone" defaultValue="+33 1 23 45 67 89" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input id="company-email" defaultValue="contact@transport-xyz.fr" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-siret">SIRET</Label>
                  <Input id="company-siret" defaultValue="123 456 789 00012" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-vat">Numéro de TVA</Label>
                  <Input id="company-vat" defaultValue="FR12345678900" />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Enregistrer les modifications</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres système</CardTitle>
              <CardDescription>Configuration générale du système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="system-language">Langue par défaut</Label>
                  <Select defaultValue="fr">
                    <SelectTrigger id="system-language">
                      <SelectValue placeholder="Sélectionner une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">Anglais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-timezone">Fuseau horaire</Label>
                  <Select defaultValue="europe-paris">
                    <SelectTrigger id="system-timezone">
                      <SelectValue placeholder="Sélectionner un fuseau horaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="europe-paris">Europe/Paris (UTC+1)</SelectItem>
                      <SelectItem value="europe-london">Europe/London (UTC+0)</SelectItem>
                      <SelectItem value="america-new_york">America/New_York (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-currency">Devise</Label>
                  <Select defaultValue="eur">
                    <SelectTrigger id="system-currency">
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">Euro (€)</SelectItem>
                      <SelectItem value="usd">Dollar US ($)</SelectItem>
                      <SelectItem value="gbp">Livre Sterling (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-distance">Unité de distance</Label>
                  <Select defaultValue="km">
                    <SelectTrigger id="system-distance">
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="km">Kilomètres (km)</SelectItem>
                      <SelectItem value="miles">Miles (mi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-date-format">Format de date</Label>
                  <Select defaultValue="dd-mm-yyyy">
                    <SelectTrigger id="system-date-format">
                      <SelectValue placeholder="Sélectionner un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="yyyy-mm-dd">AAAA/MM/JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-backup">Sauvegarde automatique</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger id="system-backup">
                      <SelectValue placeholder="Sélectionner une fréquence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                      <SelectItem value="never">Désactivée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Enregistrer les modifications</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
              <CardDescription>Configurer quand et comment les utilisateurs sont notifiés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Maintenance préventive</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications pour les maintenances préventives à venir
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Stock de pièces</h3>
                    <p className="text-sm text-muted-foreground">
                      Alertes lorsque le stock atteint le seuil minimal
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Ordres de travail</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications pour les ordres de travail assignés ou modifiés
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Alertes de sécurité</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications pour les tentatives de connexion suspectes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Emails récapitulatifs</h3>
                    <p className="text-sm text-muted-foreground">
                      Rapports hebdomadaires envoyés par email
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">Notifications push</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications push sur les appareils mobiles
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">SMS</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications par SMS pour les alertes critiques
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Enregistrer les modifications</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
