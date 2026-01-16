import { format, addDays, isWeekend } from "date-fns";
import { constructionSteps } from "@/data/constructionSteps";
import { getTradeColor } from "@/data/tradeTypes";
import { supabase } from "@/integrations/supabase/client";

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

// Délais fournisseurs par métier (jours avant la date de début)
const supplierLeadDays: Record<string, number> = {
  "fenetres-portes": 42, // 6 semaines
  "cuisine-sdb": 35, // 5 semaines
  "revetements-sol": 14, // 2 semaines
};

// Délais de fabrication
const fabricationLeadDays: Record<string, number> = {
  "cuisine-sdb": 21, // 3 semaines
  "fenetres-portes": 28, // 4 semaines
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

/**
 * Calcule la date de fin en ajoutant des jours ouvrables
 */
export function calculateEndDate(startDate: string, businessDays: number): string {
  let date = new Date(startDate);
  let daysAdded = 0;
  
  while (daysAdded < businessDays) {
    date = addDays(date, 1);
    if (!isWeekend(date)) {
      daysAdded++;
    }
  }
  
  return format(date, "yyyy-MM-dd");
}

/**
 * Génère automatiquement l'échéancier complet pour un projet
 */
export async function generateProjectSchedule(
  projectId: string,
  targetStartDate: string,
  currentStage?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Déterminer à partir de quelle étape commencer
    const stageOrder = [
      "planification",
      "permis", // maps to plans-permis
      "fondation", // maps to excavation-fondation
      "structure",
      "finition",
    ];

    // Mapping des stages utilisateur vers les étapes de construction
    const stageToStepMapping: Record<string, string> = {
      planification: "planification",
      permis: "plans-permis",
      fondation: "excavation-fondation",
      structure: "structure",
      finition: "gypse",
    };

    const startFromStep = currentStage ? stageToStepMapping[currentStage] : "planification";
    
    // Trouver l'index de départ dans constructionSteps
    const startIndex = constructionSteps.findIndex(s => s.id === startFromStep);
    const stepsToSchedule = startIndex >= 0 
      ? constructionSteps.slice(startIndex) 
      : constructionSteps;

    let currentDate = targetStartDate;
    const schedulesToInsert: any[] = [];

    for (const step of stepsToSchedule) {
      const tradeType = stepTradeMapping[step.id] || "autre";
      const duration = defaultDurations[step.id] || 5;
      const endDate = calculateEndDate(currentDate, duration);
      const measurementReq = measurementConfig[step.id];

      schedulesToInsert.push({
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
      });

      // Prochaine étape commence après la fin de celle-ci
      currentDate = calculateEndDate(endDate, 1);
    }

    // Insérer toutes les étapes en une seule requête
    const { error } = await supabase
      .from("project_schedules")
      .insert(schedulesToInsert);

    if (error) {
      console.error("Error inserting schedules:", error);
      return { success: false, error: error.message };
    }

    // Générer les alertes pour chaque étape
    await generateScheduleAlerts(projectId, schedulesToInsert);

    return { success: true };
  } catch (error: any) {
    console.error("Error generating schedule:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Génère les alertes pour les étapes planifiées
 */
async function generateScheduleAlerts(projectId: string, schedules: any[]): Promise<void> {
  const alertsToInsert: any[] = [];

  for (const schedule of schedules) {
    if (!schedule.start_date) continue;

    const startDate = new Date(schedule.start_date);

    // Alerte pour appeler le fournisseur
    if (schedule.supplier_schedule_lead_days > 0) {
      const callDate = addDays(startDate, -schedule.supplier_schedule_lead_days);
      if (callDate >= new Date()) {
        alertsToInsert.push({
          project_id: projectId,
          schedule_id: schedule.id || crypto.randomUUID(),
          alert_type: "supplier_call",
          alert_date: format(callDate, "yyyy-MM-dd"),
          message: `Appeler le fournisseur pour ${schedule.step_name}`,
          is_dismissed: false,
        });
      }
    }

    // Alerte pour le début de fabrication
    if (schedule.fabrication_lead_days > 0) {
      const fabDate = addDays(startDate, -schedule.fabrication_lead_days);
      if (fabDate >= new Date()) {
        alertsToInsert.push({
          project_id: projectId,
          schedule_id: schedule.id || crypto.randomUUID(),
          alert_type: "fabrication_start",
          alert_date: format(fabDate, "yyyy-MM-dd"),
          message: `Début de fabrication pour ${schedule.step_name}`,
          is_dismissed: false,
        });
      }
    }
  }

  if (alertsToInsert.length > 0) {
    // Note: Les alertes nécessitent l'ID du schedule, on les insère après
    // Pour l'instant on skip les alertes car on n'a pas encore les IDs
    // Les alertes seront générées via le hook useProjectSchedule
  }
}

/**
 * Calcule la durée totale estimée du projet en jours ouvrables
 */
export function calculateTotalProjectDuration(currentStage?: string): number {
  const stageToStepMapping: Record<string, string> = {
    planification: "planification",
    permis: "plans-permis",
    fondation: "excavation-fondation",
    structure: "structure",
    finition: "gypse",
  };

  const startFromStep = currentStage ? stageToStepMapping[currentStage] : "planification";
  const startIndex = constructionSteps.findIndex(s => s.id === startFromStep);
  const stepsToCount = startIndex >= 0 
    ? constructionSteps.slice(startIndex) 
    : constructionSteps;

  return stepsToCount.reduce((total, step) => {
    return total + (defaultDurations[step.id] || 5);
  }, 0);
}
