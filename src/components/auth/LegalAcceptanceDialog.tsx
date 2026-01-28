import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Version des documents légaux - à incrémenter lors des mises à jour
export const CURRENT_TERMS_VERSION = "1.0";
export const CURRENT_PRIVACY_VERSION = "1.0";

interface LegalAcceptanceDialogProps {
  open: boolean;
  userId: string;
  onAccepted: () => void;
}

export function LegalAcceptanceDialog({ open, userId, onAccepted }: LegalAcceptanceDialogProps) {
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      toast.error("Veuillez accepter les conditions pour continuer");
      return;
    }

    setIsLoading(true);

    try {
      // Get user's IP and user agent for compliance tracking
      const userAgent = navigator.userAgent;
      
      const { error } = await supabase
        .from("user_consents")
        .upsert({
          user_id: userId,
          terms_version: CURRENT_TERMS_VERSION,
          privacy_version: CURRENT_PRIVACY_VERSION,
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString(),
          user_agent: userAgent,
        }, {
          onConflict: "user_id"
        });

      if (error) {
        console.error("Error saving consent:", error);
        toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
        return;
      }

      toast.success("Merci d'avoir accepté nos conditions");
      onAccepted();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl">
              Acceptation requise
            </DialogTitle>
          </div>
          <DialogDescription>
            Pour utiliser Monprojetmaison.ca, vous devez accepter nos conditions d'utilisation et notre politique de confidentialité.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Boutons pour lire les documents */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <Link to="/conditions" target="_blank">
                <FileText className="h-4 w-4 mr-2" />
                Lire les Conditions d'utilisation
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <Link to="/confidentialite" target="_blank">
                <FileText className="h-4 w-4 mr-2" />
                Lire la Politique de confidentialité
              </Link>
            </Button>
          </div>

          <div className="flex items-start space-x-3 pt-2 border-t">
            <Checkbox
              id="legal-acceptance"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
              className="mt-1"
            />
            <Label 
              htmlFor="legal-acceptance" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              J'accepte les{" "}
              <span className="font-medium text-primary">Conditions d'utilisation</span>
              {" "}et la{" "}
              <span className="font-medium text-primary">Politique de confidentialité</span>
            </Label>
          </div>

          <p className="text-xs text-muted-foreground">
            En acceptant, vous confirmez avoir lu et compris nos conditions. 
            Votre acceptation sera enregistrée pour des raisons légales.
          </p>
        </div>

        <Button 
          onClick={handleAccept} 
          disabled={!accepted || isLoading}
          className="w-full"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Continuer vers l'application
        </Button>
      </DialogContent>
    </Dialog>
  );
}
