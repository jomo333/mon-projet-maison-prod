import { ReactNode } from "react";
import { useSessionTracker } from "@/hooks/useSessionTracker";

interface SessionTrackerProviderProps {
  children: ReactNode;
}

export function SessionTrackerProvider({ children }: SessionTrackerProviderProps) {
  useSessionTracker();
  return <>{children}</>;
}
