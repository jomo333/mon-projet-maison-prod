import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TaskDate {
  id: string;
  project_id: string;
  step_id: string;
  task_id: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useTaskDates(projectId: string | null) {
  const queryClient = useQueryClient();

  const taskDatesQuery = useQuery({
    queryKey: ["task-dates", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("task_dates")
        .select("*")
        .eq("project_id", projectId);
      
      if (error) throw error;
      return data as TaskDate[];
    },
    enabled: !!projectId,
  });

  const upsertTaskDateMutation = useMutation({
    mutationFn: async ({
      stepId,
      taskId,
      startDate,
      endDate,
      notes,
    }: {
      stepId: string;
      taskId: string;
      startDate?: string | null;
      endDate?: string | null;
      notes?: string | null;
    }) => {
      if (!projectId) throw new Error("Project ID required");

      // Check if record exists
      const { data: existing } = await supabase
        .from("task_dates")
        .select("id")
        .eq("project_id", projectId)
        .eq("step_id", stepId)
        .eq("task_id", taskId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const updateData: Record<string, unknown> = {};
        if (startDate !== undefined) updateData.start_date = startDate;
        if (endDate !== undefined) updateData.end_date = endDate;
        if (notes !== undefined) updateData.notes = notes;

        const { error } = await supabase
          .from("task_dates")
          .update(updateData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("task_dates")
          .insert({
            project_id: projectId,
            step_id: stepId,
            task_id: taskId,
            start_date: startDate || null,
            end_date: endDate || null,
            notes: notes || null,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-dates", projectId] });
    },
  });

  const getTaskDate = (stepId: string, taskId: string): TaskDate | undefined => {
    return taskDatesQuery.data?.find(
      (td) => td.step_id === stepId && td.task_id === taskId
    );
  };

  return {
    taskDates: taskDatesQuery.data || [],
    isLoading: taskDatesQuery.isLoading,
    getTaskDate,
    upsertTaskDate: upsertTaskDateMutation.mutate,
    upsertTaskDateAsync: upsertTaskDateMutation.mutateAsync,
  };
}
