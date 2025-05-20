import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

export default function TechniciansIndex() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    role: "technician",
    password: ""
  });

  // Define the technician type
  type Technician = {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    // Add other fields if needed
  };

  // Fetch technicians
  const { data: technicians = [], isLoading, refetch } = useQuery<Technician[]>({
    queryKey: ["/api/users/technicians"],
  });

  // Add technician
  const handleAddUser = async () => {
    try {
      await apiRequest("POST", "/api/users", newUser);
      toast({
        title: "Utilisateur ajouté",
        description: "Le nouvel utilisateur a été ajouté avec succès",
      });
      setIsAddUserDialogOpen(false);
      setNewUser({
        name: "",
        username: "",
        email: "",
        role: "technician",
        password: ""
      });
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter l'utilisateur",
      });
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle role change
  const handleRoleChange = (value: string) => {
    setNewUser(prev => ({ ...prev, role: value }));
  };

  // Define table columns
  const columns = [
    {
      header: "Nom",
      accessorKey: "name" as keyof Technician,
      cell: ({ row }: { row: { original: Technician } }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      header: "Identifiant",
      accessorKey: "username" as keyof Technician,
      cell: ({ row }: { row: { original: Technician } }) => <div>{row.original.username}</div>,
    },
    {
      header: "Email",
      accessorKey: "email" as keyof Technician,
      cell: ({ row }: { row: { original: Technician } }) => <div>{row.original.email}</div>,
    },
    {
      header: "Rôle",
      accessorKey: "role" as keyof Technician,
      cell: ({ row }: { row: { original: Technician } }) => {
        const value = row.original.role;
        return (
          <Badge variant={
            value === "admin" ? "destructive" :
            value === "workshop_manager" ? "default" :
            value === "technician" ? "warning" : "secondary"
          }>
            {value === "admin" ? "Administrateur" :
             value === "workshop_manager" ? "Chef d'atelier" :
             value === "technician" ? "Technicien" : "Utilisateur"}
          </Badge>
        );
      },
    },
    {
      header: "Créé le",
      accessorKey: "createdAt" as keyof Technician,
      cell: ({ row }: { row: { original: Technician } }) => <div>{formatDate(row.original.createdAt)}</div>,
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof Technician,
      cell: ({ row }: { row: { original: Technician } }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "Fonction à venir",
                description: "L'édition des utilisateurs sera bientôt disponible",
              });
            }}
          >
            <i className="fas fa-edit text-secondary"></i>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toast({
                title: "Fonction à venir",
                description: "La suppression des utilisateurs sera bientôt disponible",
              });
            }}
          >
            <i className="fas fa-trash-alt text-destructive"></i>
          </Button>
        </div>
      ),
    },
  ];

  // Check if user has permission
  if (!(user?.role === "admin" || user?.role === "workshop_manager")) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Accès non autorisé</h2>
        <p className="text-muted-foreground mt-2">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Techniciens" 
        subtitle="Gestion des techniciens et du personnel de maintenance"
        actions={
          <div>
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <i className="fas fa-user-plus mr-2"></i>
                  Ajouter un utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un utilisateur</DialogTitle>
                  <DialogDescription>
                    Créez un nouvel utilisateur pour accéder au système.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Jean Dupont" 
                      value={newUser.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input 
                      id="username" 
                      name="username" 
                      placeholder="jdupont" 
                      value={newUser.username}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="jean.dupont@example.com" 
                      value={newUser.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select defaultValue={newUser.role} onValueChange={handleRoleChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {user?.role === "admin" && (
                          <>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="workshop_manager">Chef d'atelier</SelectItem>
                          </>
                        )}
                        <SelectItem value="technician">Technicien</SelectItem>
                        <SelectItem value="user">Utilisateur standard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      value={newUser.password}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddUser}>
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Techniciens</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={technicians}
            columns={columns}
            searchPlaceholder="Rechercher un technicien..."
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}