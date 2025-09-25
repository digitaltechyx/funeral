"use server";

import { generateTransparencyReport as genReport } from "@/ai/flows/generate-transparency-report";
import { auditLogsForAI } from '@/lib/data';
import { revalidatePath } from "next/cache";

// In a real app, this would be stored in a database.
// For this demo, we'll use a simple in-memory store.
let latestReportSummary = "No transparency report has been generated yet. The admin can generate one from their dashboard.";

export async function generateTransparencyReportAction() {
  try {
    const report = await genReport({ auditLogs: auditLogsForAI });
    if (report && report.summary) {
        latestReportSummary = report.summary;
        // Revalidate the user dashboard path to show the new report
        revalidatePath('/dashboard');
        return { success: true, summary: report.summary };
    }
    throw new Error("Generated report summary was empty.");
  } catch (error) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, summary: `Failed to generate transparency report: ${errorMessage}` };
  }
}

export async function getLatestTransparencyReport() {
    return { summary: latestReportSummary };
}
