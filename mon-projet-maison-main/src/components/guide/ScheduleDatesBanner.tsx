import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";
import { useProjectSchedule, ScheduleItem } from "@/hooks/useProjectSchedule";
import { Badge } from "@/components/ui/badge";
import { getTradeName } from "@/data/tradeTypes";
import { cn } from "@/lib/utils";

interface ScheduleDatesBannerProps {
  currentStepId?: string | null;
}

export const ScheduleDatesBanner = ({ currentStepId }: ScheduleDatesBannerProps) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  
  const { schedules, isLoading } = useProjectSchedule(projectId);

  if (!projectId || isLoading) {
    return null;
  }

  if (!schedules || schedules.length === 0) {
    return null;
  }

  // Find the current step's schedule
  const currentSchedule = currentStepId 
    ? schedules.find(s => s.step_id === currentStepId)
    : null;

  // Get first and last dates for overall project timeline
  const schedulesWithDates = schedules.filter(s => s.start_date && s.end_date);
  if (schedulesWithDates.length === 0) {
    return null;
  }

  const sortedByStart = [...schedulesWithDates].sort((a, b) => 
    new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime()
  );
  const sortedByEnd = [...schedulesWithDates].sort((a, b) => 
    new Date(b.end_date!).getTime() - new Date(a.end_date!).getTime()
  );

  const projectStart = sortedByStart[0].start_date!;
  const projectEnd = sortedByEnd[0].end_date!;

  return (
    <div className="bg-muted/50 border rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Échéancier du projet</h3>
      </div>

      {/* Overall project timeline */}
      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Début:</span>
          <span className="font-medium">
            {format(parseISO(projectStart), "d MMMM yyyy", { locale: fr })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Fin prévue:</span>
          <span className="font-medium">
            {format(parseISO(projectEnd), "d MMMM yyyy", { locale: fr })}
          </span>
        </div>
      </div>

      {/* Current step schedule highlight */}
      {currentSchedule && currentSchedule.start_date && currentSchedule.end_date && (
        <div className="bg-primary/10 border border-primary/20 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: currentSchedule.trade_color }}
            />
            <span className="font-medium">{currentSchedule.step_name}</span>
            <Badge variant="outline" className="ml-auto">
              {getTradeName(currentSchedule.trade_type)}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(parseISO(currentSchedule.start_date), "d MMM", { locale: fr })} - {format(parseISO(currentSchedule.end_date), "d MMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Durée:</span>
              <span>{currentSchedule.estimated_days} jour{currentSchedule.estimated_days > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick schedule preview - next 3 steps */}
      {!currentSchedule && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Prochaines étapes:</span>
          <div className="flex flex-wrap gap-2">
            {sortedByStart.slice(0, 4).map((schedule) => (
              <div 
                key={schedule.id}
                className="flex items-center gap-2 bg-background border rounded-md px-3 py-2 text-sm"
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: schedule.trade_color }}
                />
                <span className="truncate max-w-[150px]">{schedule.step_name}</span>
                <span className="text-muted-foreground text-xs">
                  {format(parseISO(schedule.start_date!), "d MMM", { locale: fr })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
