import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TaskDatePickerProps {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
}

export function TaskDatePicker({
  label,
  value,
  onChange,
  disabled,
}: TaskDatePickerProps) {
  const [open, setOpen] = useState(false);
  
  const date = value ? parseISO(value) : undefined;

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      onChange(format(newDate, "yyyy-MM-dd"));
    } else {
      onChange(null);
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className={cn(
              "justify-start text-left font-normal h-8 text-xs",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {date ? format(date, "d MMM yyyy", { locale: fr }) : "Choisir..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
