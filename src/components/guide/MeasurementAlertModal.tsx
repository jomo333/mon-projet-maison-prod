import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO, isPast, isToday } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Bell, Phone, Factory, Ruler, PhoneCall, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduleAlert } from "@/hooks/useProjectSchedule";
import { getDateLocale } from "@/lib/i18n";

interface MeasurementAlertModalProps {
  alerts: ScheduleAlert[];
  projectId: string | undefined;
}

const alertTypeConfig: Record<
  string,
  { icon: React.ElementType; labelKey: string; color: string }
> = {
  supplier_call: {
    icon: Phone,
    labelKey: "supplierCall",
    color: "text-blue-600",
  },
  fabrication_start: {
    icon: Factory,
    labelKey: "fabricationStart",
    color: "text-orange-600",
  },
  measurement: {
    icon: Ruler,
    labelKey: "measurement",
    color: "text-purple-600",
  },
  contact_subcontractor: {
    icon: PhoneCall,
    labelKey: "contactSubcontractor",
    color: "text-amber-600",
  },
};

export const MeasurementAlertModal = ({ alerts, projectId }: MeasurementAlertModalProps) => {
  const { t } = useTranslation();
  const dateLocale = getDateLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Filter active alerts (not dismissed in this session)
  const activeAlerts = alerts.filter(
    (alert) => !alert.is_dismissed && !dismissedAlerts.has(alert.id)
  );

  // Check if we should show the modal
  useEffect(() => {
    if (activeAlerts.length > 0 && projectId) {
      // Check localStorage to see if we've shown this modal recently
      const lastShownKey = `alert_modal_shown_${projectId}`;
      const lastShown = localStorage.getItem(lastShownKey);
      const now = Date.now();
      
      // Show modal if not shown in the last 5 minutes
      if (!lastShown || now - parseInt(lastShown) > 5 * 60 * 1000) {
        setIsOpen(true);
        localStorage.setItem(lastShownKey, now.toString());
      }
    }
  }, [activeAlerts.length, projectId]);

  const getAlertUrgency = (alertDate: string) => {
    const date = parseISO(alertDate);
    if (isPast(date) && !isToday(date)) {
      return { level: "overdue", labelKey: "overdue", variant: "destructive" as const };
    }
    if (isToday(date)) {
      return { level: "today", labelKey: "today", variant: "destructive" as const };
    }
    return { level: "upcoming", labelKey: "upcoming", variant: "secondary" as const };
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  const handleClose = () => {
    // Mark all shown alerts as dismissed for this session
    const newDismissed = new Set(dismissedAlerts);
    activeAlerts.forEach((alert) => newDismissed.add(alert.id));
    setDismissedAlerts(newDismissed);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-lg border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-amber-500 text-white animate-pulse">
              <Bell className="h-6 w-6" />
            </div>
            <span className="text-amber-800 dark:text-amber-300">
              {t("schedule.alertsTitle")} ({activeAlerts.length})
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-amber-700 dark:text-amber-400 text-base">
            {t("schedule.alertsModalDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4 max-h-[50vh] overflow-y-auto">
          {activeAlerts.map((alert) => {
            const config = alertTypeConfig[alert.alert_type];
            const urgency = getAlertUrgency(alert.alert_date);
            const Icon = config?.icon || Bell;
            const isUrgent = urgency.level === "overdue" || urgency.level === "today";

            return (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-lg border-2 bg-white dark:bg-slate-900",
                  isUrgent
                    ? "border-destructive/50 animate-pulse"
                    : "border-amber-300 dark:border-amber-700"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-full shrink-0",
                      config?.color || "text-muted-foreground",
                      isUrgent && "animate-bounce"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={urgency.variant} className="text-xs">
                        {t(`schedule.urgency.${urgency.labelKey}`)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(alert.alert_date), "EEEE d MMMM", {
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">{alert.message}</p>
                    {config?.labelKey && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t(`schedule.alertTypes.${config.labelKey}`)}
                      </p>
                    )}
                  </div>

                  {isUrgent && (
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <AlertDialogFooter>
          <AlertDialogAction
            onClick={handleClose}
            className="bg-amber-600 hover:bg-amber-700 text-white w-full"
          >
            {t("common.understood")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
