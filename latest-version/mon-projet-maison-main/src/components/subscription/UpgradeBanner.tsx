import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

interface UpgradeBannerProps {
  title?: string;
  message: string;
  onClose?: () => void;
}

export function UpgradeBanner({ title = "Limite atteinte", message, onClose }: UpgradeBannerProps) {
  const navigate = useNavigate();

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive">{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-muted-foreground mb-3">{message}</p>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate("/forfaits")}
          >
            Voir les forfaits
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Fermer
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
