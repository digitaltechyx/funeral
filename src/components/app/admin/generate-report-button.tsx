"use client";

import { generateTransparencyReportAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

export function GenerateReportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await generateTransparencyReportAction();
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Report Generated Successfully",
        description: "The new transparency report is now available to all members.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: result.summary,
      });
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Generate Transparency Report
        </>
      )}
    </Button>
  );
}
