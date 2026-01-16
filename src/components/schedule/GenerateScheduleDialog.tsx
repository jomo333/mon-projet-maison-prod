import { useState } from "react";
import { format, parseISO, addBusinessDays } from "date-fns";
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
import { CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { constructionSteps } from "@/data/constructionSteps";
import { getTradeColor } from "@/data/tradeTypes";
import { toast } from "sonner";

interface GenerateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  createSchedule: (data: any) => Promise<any>;
  calculateEndDate: (startDate: string, days: number) => string;
  generateAlerts: (schedule: any) => Promise<void>;
}

// Mapping des étapes vers les métiers par défaut
const stepTradeMapping: Record<string, string> = {
  planification: "autre",
  financement: "autre",
  "plans-permis": "autre",
  "excavation-fondation": "excavation",
  structure: "charpente",
  toiture: "toiture",
  "fenetres-portes": "fenetre",
  electricite: "electricite",
  plomberie: "plomberie",
  hvac: "hvac",
  isolation: "isolation",
  gypse: "gypse",
  "revetements-sol": "plancher",
  "cuisine-sdb": "armoires",
  "finitions-int": "finitions",
  exterieur: "exterieur",
  "inspections-finales": "inspecteur",
};

// Durées par défaut en jours ouvrables
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

// Délais fournisseurs par métier
const supplierLeadDays: Record<string, number> = {
  "fenetres-portes": 42, // 6 semaines pour les fenêtres
  "cuisine-sdb": 35, // 5 semaines pour armoires
  "revetements-sol": 14, // 2 semaines pour planchers
};

// Délais de fabrication
const fabricationLeadDays: Record<string, number> = {
  "cuisine-sdb": 21, // 3 semaines fabrication armoires
  "fenetres-portes": 28, // 4 semaines fabrication fenêtres
};

// Étapes nécessitant des mesures
const measurementConfig: Record<string, { afterStep: string; notes: string }> = {
  "cuisine-sdb": {
    afterStep: "gypse",
    notes: "Mesures après gypse, avant peinture",
  },
  "revetements-sol": {
    afterStep: "gypse",
    notes: "Mesures après tirage de joints",
  },
};

export function GenerateScheduleDialog({
  open,
  onOpenChange,
  projectId,
  createSchedule,
  calculateEndDate,
  generateAlerts,
}: GenerateScheduleDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    if (!startDate) {
      toast.error("Veuillez sélectionner une date de début des travaux");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      let currentDate = format(startDate, "yyyy-MM-dd");
      const totalSteps = constructionSteps.length;

      for (let i = 0; i < constructionSteps.length; i++) {
        const step = constructionSteps[i];
        const tradeType = stepTradeMapping[step.id] || "autre";
        const duration = defaultDurations[step.id] || 5;
        const endDate = calculateEndDate(currentDate, duration);

        const measurementReq = measurementConfig[step.id];

        const scheduleData = {
          project_id: projectId,
          step_id: step.id,
          step_name: step.title,
          trade_type: tradeType,
          trade_color: getTradeColor(tradeType),
          estimated_days: duration,
          start_date: currentDate,
          end_date: endDate,
          supplier_schedule_lead_days: supplierLeadDays[step.id] || 21,
          fabrication_lead_days: fabricationLeadDays[step.id] || 0,
          measurement_required: !!measurementReq,
          measurement_after_step_id: measurementReq?.afterStep || null,
          measurement_notes: measurementReq?.notes || null,
          status: "scheduled",
        };

        const result = await createSchedule(scheduleData);
        
        // Générer les alertes pour cette étape
        if (result) {
          await generateAlerts(result);
        }

        // Passer à la date suivante (après la fin de l'étape courante)
        currentDate = calculateEndDate(endDate, 1);

        setProgress(Math.round(((i + 1) / totalSteps) * 100));
      }

      toast.success("Échéancier généré avec succès!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error("Erreur lors de la génération de l'échéancier");
    } finally {
      setIsGenerating(false);
      setProgress(0);
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
            L'analyse de votre plan est terminée. Choisissez la date de début
            des travaux pour générer automatiquement l'échéancier complet.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Date de début des travaux
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate
                      ? format(startDate, "PPP", { locale: fr })
                      : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {startDate && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Résumé de l'échéancier :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {constructionSteps.length} étapes seront créées</li>
                  <li>
                    • Durée totale estimée :{" "}
                    {Object.values(defaultDurations).reduce((a, b) => a + b, 0)}{" "}
                    jours ouvrables
                  </li>
                  <li>• Alertes automatiques générées</li>
                </ul>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Génération en cours...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
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
            Plus tard
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!startDate || isGenerating}
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
