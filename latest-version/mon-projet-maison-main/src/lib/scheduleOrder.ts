import { constructionSteps } from "@/data/constructionSteps";

/**
 * Get the execution order index for a step_id based on constructionSteps
 * Returns a high number if not found to push unknown steps to the end
 */
export const getStepExecutionOrder = (stepId: string): number => {
  const index = constructionSteps.findIndex((step) => step.id === stepId);
  return index === -1 ? 999 : index;
};

/**
 * Sort schedules by their execution order defined in constructionSteps
 * This ensures proper coordination of construction phases
 */
export const sortSchedulesByExecutionOrder = <T extends { step_id: string }>(
  schedules: T[]
): T[] => {
  return [...schedules].sort((a, b) => {
    const orderA = getStepExecutionOrder(a.step_id);
    const orderB = getStepExecutionOrder(b.step_id);
    return orderA - orderB;
  });
};
