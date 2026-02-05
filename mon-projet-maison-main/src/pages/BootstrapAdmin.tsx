import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function BootstrapAdmin() {
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("bootstrap-admin", {
        body: { email: email.trim(), secret },
      });

      if (fnError) {
        setError(fnError.message || "Erreur lors de l'appel à la fonction");
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data?.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Configuration Admin</CardTitle>
          <CardDescription>
            Créez le premier compte administrateur pour accéder au tableau de bord admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-primary bg-primary/10">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Succès !</AlertTitle>
                <AlertDescription className="text-muted-foreground">
                  Le rôle administrateur a été attribué avec succès.
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Prochaines étapes :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Si vous êtes connecté, déconnectez-vous</li>
                  <li>Reconnectez-vous avec le compte {email}</li>
                  <li>Accédez au tableau de bord admin</li>
                </ol>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link to="/admin">Aller au tableau de bord admin</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/auth">Se reconnecter</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email du compte à promouvoir</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Ce compte doit déjà exister (créé via la page d'inscription).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret de bootstrap</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Entrez le secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Le secret défini dans les variables d'environnement du backend.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Attribution en cours...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Créer le compte admin
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
