import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { constructionSteps } from "@/data/constructionSteps";
import { toast } from "sonner";
import { generateProjectSchedule, calculateTotalProjectDuration } from "@/lib/scheduleGenerator";

interface GenerateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  createSchedule: (data: any) => Promise<any>;
  calculateEndDate: (startDate: string, days: number) => string;
  generateAlerts: (schedule: any) => Promise<void>;
  onSuccess?: () => void;
}

// Étapes de préparation
const preparationSteps = ["planification", "financement", "plans-permis"];

// Durées par défaut
const defaultDurations: Record<string, number> = {
  planification: 15,
  financement: 20,
  "plans-permis": 30,
  "excavation-fondation": 15,
  structure: 15,
  toiture: 7,
  "fenetres-portes": 5,
  electricite: 7,
  plomberie: 7,
  hvac: 7,
  isolation: 5,
  gypse: 15,
  "revetements-sol": 7,
  "cuisine-sdb": 10,
  "finitions-int": 10,
  exterieur: 15,
  "inspections-finales": 5,
};

export function GenerateScheduleDialog({
  open,
  onOpenChange,
  projectId,
  createSchedule,
  calculateEndDate,
  generateAlerts,
  onSuccess,
}: GenerateScheduleDialogProps) {
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculer les jours de préparation nécessaires
  const preparationDays = useMemo(() => {
    return constructionSteps
      .filter(s => preparationSteps.includes(s.id))
      .reduce((total, step) => total + (defaultDurations[step.id] || 5), 0);
  }, []);

  // Calculer si la date visée est réalisable
  const dateAnalysis = useMemo(() => {
    if (!targetDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculer la date de fin de préparation si on commence aujourd'hui
    let prepEndDate = today;
    let businessDaysAdded = 0;
    let currentDate = new Date(today);
    
    while (businessDaysAdded < preparationDays) {
      currentDate = addDays(currentDate, 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysAdded++;
      }
    }
    prepEndDate = currentDate;
    
    // Date la plus tôt possible pour le début des travaux
    const earliestWorkStart = addDays(prepEndDate, 1);
    
    // Vérifier si la date visée est réalisable
    const isDatePossible = targetDate >= earliestWorkStart;
    
    return {
      prepEndDate,
      earliestWorkStart,
      isDatePossible,
      delayDays: isDatePossible ? 0 : Math.ceil((earliestWorkStart.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)),
    };
  }, [targetDate, preparationDays]);

  const handleGenerate = async () => {
    if (!targetDate) {
      toast.error("Veuillez sélectionner une date visée pour le début des travaux");
      return;
    }

    setIsGenerating(true);

    try {
      const targetDateStr = format(targetDate, "yyyy-MM-dd");
      const result = await generateProjectSchedule(projectId, targetDateStr);

      if (!result.success) {
        toast.error(result.error || "Erreur lors de la génération de l'échéancier");
        return;
      }

      if (result.warning) {
        toast.warning(result.warning, { duration: 8000 });
      } else {
        toast.success("Échéancier généré avec succès!");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error("Erreur lors de la génération de l'échéancier");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Générer l'échéancier
          </DialogTitle>
          <DialogDescription>
            La préparation (planification, financement, permis) commencera <strong>aujourd'hui</strong>.
            Choisissez la date visée pour le <strong>début des travaux</strong> (jour 1 de l'excavation).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Date visée pour le début des travaux
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate
                      ? format(targetDate, "PPP", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Alerte si la date est impossible */}
            {dateAnalysis && !dateAnalysis.isDatePossible && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Date impossible!</strong> La préparation nécessite {preparationDays} jours ouvrables.
                  La date la plus tôt pour débuter les travaux est le{" "}
                  <strong>{format(dateAnalysis.earliestWorkStart, "d MMMM yyyy", { locale: fr })}</strong>{" "}
                  (+{dateAnalysis.delayDays} jours).
                </AlertDescription>
              </Alert>
            )}

            {targetDate && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Résumé de l'échéancier :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Préparation: {preparationDays} jours ouvrables (commence aujourd'hui)</li>
                  <li>• {constructionSteps.length} étapes seront créées</li>
                  <li>
                    • Durée totale:{" "}
                    {Object.values(defaultDurations).reduce((a, b) => a + b, 0)}{" "}
                    jours ouvrables
                  </li>
                  {dateAnalysis?.isDatePossible && (
                    <li className="text-green-600 font-medium">
                      ✓ Date réalisable - travaux le {format(targetDate, "d MMM yyyy", { locale: fr })}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!targetDate || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Générer l'échéancier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
