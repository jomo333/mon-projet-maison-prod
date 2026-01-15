import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, FolderOpen, Calendar, DollarSign, Trash2, Loader2, Home } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  project_type: string | null;
  square_footage: number | null;
  total_budget: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const MyProjects = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projet supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: formData.get("name") as string,
        description: formData.get("description") as string || null,
        project_type: formData.get("projectType") as string || null,
        square_footage: parseInt(formData.get("squareFootage") as string) || null,
      })
      .select()
      .single();
    
    if (error) {
      toast.error("Erreur lors de la création");
    } else {
      toast.success("Projet créé!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
      navigate(`/projet/${data.id}`);
    }
    
    setIsCreating(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "en_cours":
        return <Badge className="bg-blue-500">En cours</Badge>;
      case "termine":
        return <Badge className="bg-green-500">Terminé</Badge>;
      case "pause":
        return <Badge variant="secondary">En pause</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Mes Projets
              </h1>
              <p className="text-muted-foreground mt-1">
                Retrouvez et gérez tous vos projets de construction
              </p>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau projet</DialogTitle>
                  <DialogDescription>
                    Donnez un nom à votre projet pour commencer
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du projet *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ma maison de rêve"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      placeholder="Construction d'une maison unifamiliale..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectType">Type de projet</Label>
                      <Input
                        id="projectType"
                        name="projectType"
                        placeholder="Maison unifamiliale"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="squareFootage">Superficie (pi²)</Label>
                      <Input
                        id="squareFootage"
                        name="squareFootage"
                        type="number"
                        placeholder="1500"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isCreating}>
                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer le projet
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-display text-lg font-medium mb-2">
                  Aucun projet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre premier projet pour commencer à planifier votre construction
                </p>
                <Button variant="accent" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer mon premier projet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(`/projet/${project.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        <CardTitle className="font-display text-lg line-clamp-1">
                          {project.name}
                        </CardTitle>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {project.square_footage && (
                          <span>{project.square_footage} pi²</span>
                        )}
                        {project.total_budget > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {Number(project.total_budget).toLocaleString()} $
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.updated_at).toLocaleDateString('fr-CA')}
                      </div>
                    </div>
                    <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Supprimer ce projet?")) {
                            deleteMutation.mutate(project.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyProjects;
