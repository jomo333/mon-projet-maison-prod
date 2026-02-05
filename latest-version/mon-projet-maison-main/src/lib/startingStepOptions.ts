import { constructionSteps } from "@/data/constructionSteps";

// Options d'étapes de départ pour la création de projet
// Utilise les mêmes ID que constructionSteps
export interface StartingStepOption {
  value: string;
  labelKey: string;
  descriptionKey: string;
  phase: string;
}

// Étapes de préparation (pré-construction)
export const preparationStepIds = ["planification", "plans-permis", "soumissions", "financement"];

// Mapping des step IDs vers les clés i18n
const stepIdToI18nKey: Record<string, string> = {
  "planification": "planification",
  "plans-permis": "plansPermis",
  "soumissions": "soumissions",
  "financement": "financement",
  "excavation": "excavation",
  "fondation": "fondation",
  "structure": "structure",
  "toiture": "toiture",
  "fenetres-portes": "fenetresPortes",
  "isolation": "isolation",
  "plomberie-roughin": "plomberieRoughin",
  "electricite-roughin": "electriciteRoughin",
  "gypse": "gypse",
  "revetements-sol": "revetementsSol",
  "cuisine-sdb": "cuisineSdb",
  "finitions-int": "finitionsInt",
};

// Étapes principales à proposer comme point de départ
// On regroupe certaines étapes pour simplifier le choix utilisateur
export const startingStepOptions: StartingStepOption[] = [
  // Pré-construction
  { 
    value: "planification", 
    labelKey: "startProject.stages.planification.label", 
    descriptionKey: "startProject.stages.planification.description",
    phase: "pre-construction"
  },
  { 
    value: "plans-permis", 
    labelKey: "startProject.stages.plansPermis.label", 
    descriptionKey: "startProject.stages.plansPermis.description",
    phase: "pre-construction"
  },
  { 
    value: "soumissions", 
    labelKey: "startProject.stages.soumissions.label", 
    descriptionKey: "startProject.stages.soumissions.description",
    phase: "pre-construction"
  },
  { 
    value: "financement", 
    labelKey: "startProject.stages.financement.label", 
    descriptionKey: "startProject.stages.financement.description",
    phase: "pre-construction"
  },
  // Gros œuvre
  { 
    value: "excavation", 
    labelKey: "startProject.stages.excavation.label", 
    descriptionKey: "startProject.stages.excavation.description",
    phase: "gros-oeuvre"
  },
  { 
    value: "fondation", 
    labelKey: "startProject.stages.fondation.label", 
    descriptionKey: "startProject.stages.fondation.description",
    phase: "gros-oeuvre"
  },
  { 
    value: "structure", 
    labelKey: "startProject.stages.structure.label", 
    descriptionKey: "startProject.stages.structure.description",
    phase: "gros-oeuvre"
  },
  { 
    value: "toiture", 
    labelKey: "startProject.stages.toiture.label", 
    descriptionKey: "startProject.stages.toiture.description",
    phase: "gros-oeuvre"
  },
  { 
    value: "fenetres-portes", 
    labelKey: "startProject.stages.fenetresPortes.label", 
    descriptionKey: "startProject.stages.fenetresPortes.description",
    phase: "gros-oeuvre"
  },
  // Second œuvre
  { 
    value: "isolation", 
    labelKey: "startProject.stages.isolation.label", 
    descriptionKey: "startProject.stages.isolation.description",
    phase: "second-oeuvre"
  },
  { 
    value: "plomberie-roughin", 
    labelKey: "startProject.stages.plomberieRoughin.label", 
    descriptionKey: "startProject.stages.plomberieRoughin.description",
    phase: "second-oeuvre"
  },
  { 
    value: "electricite-roughin", 
    labelKey: "startProject.stages.electriciteRoughin.label", 
    descriptionKey: "startProject.stages.electriciteRoughin.description",
    phase: "second-oeuvre"
  },
  { 
    value: "gypse", 
    labelKey: "startProject.stages.gypse.label", 
    descriptionKey: "startProject.stages.gypse.description",
    phase: "second-oeuvre"
  },
  // Finitions
  { 
    value: "revetements-sol", 
    labelKey: "startProject.stages.revetementsSol.label", 
    descriptionKey: "startProject.stages.revetementsSol.description",
    phase: "finitions"
  },
  { 
    value: "cuisine-sdb", 
    labelKey: "startProject.stages.cuisineSdb.label", 
    descriptionKey: "startProject.stages.cuisineSdb.description",
    phase: "finitions"
  },
  { 
    value: "finitions-int", 
    labelKey: "startProject.stages.finitionsInt.label", 
    descriptionKey: "startProject.stages.finitionsInt.description",
    phase: "finitions"
  },
];

/**
 * Filtre les étapes de construction à partir d'un step_id de départ
 * @param startingStepId - L'ID de l'étape de départ
 * @returns Les étapes à planifier (à partir de startingStepId)
 */
export function getStepsFromStartingPoint(startingStepId: string | null | undefined) {
  if (!startingStepId) {
    return constructionSteps;
  }

  const startIndex = constructionSteps.findIndex(s => s.id === startingStepId);
  if (startIndex === -1) {
    return constructionSteps;
  }

  return constructionSteps.slice(startIndex);
}

/**
 * Vérifie si une étape fait partie des étapes de préparation
 */
export function isPreparationStep(stepId: string): boolean {
  return preparationStepIds.includes(stepId);
}

/**
 * Obtient l'index d'une étape dans constructionSteps
 */
export function getStepIndex(stepId: string): number {
  return constructionSteps.findIndex(s => s.id === stepId);
}
