import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToTopBottomProps {
  className?: string;
}

export function ScrollToTopBottom({ className }: ScrollToTopBottomProps) {
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Show scroll up button after scrolling down 300px
      setShowScrollUp(scrollTop > 300);
      
      // Show scroll down button if not at the bottom
      setShowScrollDown(scrollTop + clientHeight < scrollHeight - 100);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: "smooth" 
    });
  };

  // Don't render if neither button should show
  if (!showScrollUp && !showScrollDown) return null;

  return (
    <div 
      className={cn(
        "fixed right-4 bottom-24 z-50 flex flex-col gap-2 transition-opacity duration-300",
        className
      )}
    >
      {showScrollUp && (
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollToTop}
          className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Remonter en haut"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
      {showScrollDown && (
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollToBottom}
          className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Descendre en bas"
        >
          <ChevronDown className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
