import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskDatePicker } from "./TaskDatePicker";
import { useTaskDates } from "@/hooks/useTaskDates";
import { getDateLocale } from "@/lib/i18n";

interface TaskSubcontractorDatesButtonProps {
  stepId: string;
  taskId: string;
  projectId: string;
}

export function TaskSubcontractorDatesButton({ 
  stepId, 
  taskId, 
  projectId 
}: TaskSubcontractorDatesButtonProps) {
  const { t } = useTranslation();
  const dateLocale = getDateLocale();
  const [isOpen, setIsOpen] = useState(false);
  
  const { getTaskDate, upsertTaskDate } = useTaskDates(projectId);
  
  const taskDate = getTaskDate(stepId, taskId);
  const hasAnyDate = taskDate?.start_date || taskDate?.end_date;
  
  const handleDateChange = (field: 'start_date' | 'end_date', value: string | null) => {
    upsertTaskDate({
      stepId,
      taskId,
      startDate: field === 'start_date' ? value : taskDate?.start_date,
      endDate: field === 'end_date' ? value : taskDate?.end_date,
    });
  };

  const formatDateRange = () => {
    if (!hasAnyDate) return null;
    if (taskDate?.start_date && taskDate?.end_date) {
      return `${format(parseISO(taskDate.start_date), "d MMM", { locale: dateLocale })} - ${format(parseISO(taskDate.end_date), "d MMM", { locale: dateLocale })}`;
    }
    if (taskDate?.start_date) {
      return format(parseISO(taskDate.start_date), "d MMM", { locale: dateLocale });
    }
    return format(parseISO(taskDate!.end_date!), "d MMM", { locale: dateLocale });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasAnyDate ? "default" : "outline"}
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Calendar className="h-3.5 w-3.5" />
          {hasAnyDate ? (
            <span className="text-xs hidden sm:inline">{formatDateRange()}</span>
          ) : (
            <span className="text-xs hidden sm:inline">{t("taskDates.addDates")}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-4" 
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{t("taskDates.subcontractorDates")}</h4>
            <p className="text-xs text-muted-foreground">
              {t("taskDates.subcontractorDatesDescription")}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <TaskDatePicker
              label={t("taskDates.startDate")}
              value={taskDate?.start_date || null}
              onChange={(date) => handleDateChange('start_date', date)}
            />
            <TaskDatePicker
              label={t("taskDates.endDate")}
              value={taskDate?.end_date || null}
              onChange={(date) => handleDateChange('end_date', date)}
            />
          </div>
          
          {hasAnyDate && (
            <Badge variant="outline" className="w-full justify-center text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDateRange()}
            </Badge>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
