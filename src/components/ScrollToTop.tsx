import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, search]);

  return null;
}

// Hook pour scroll to top programmatique
export function useScrollToTop() {
  return () => {
    window.scrollTo({ top: 0, behavior: "instant" });
  };
}
