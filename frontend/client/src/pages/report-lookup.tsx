import { useState, useEffect } from "react";
import { FileSearch, Search, Eye, ChevronRight, Download, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import apiService from "../services/apiService";
import { GrainData } from "../types";

type ReportUI = {
  id: string;
  batch: string;
  date: string;
  purity: number;
  grade: "A" | "B" | "C";
  location: string;
  raw: GrainData; // Keep reference to raw data for "View" action
};

// Helper to convert API data to Report UI model
function toReportUI(data: GrainData): ReportUI {
  return {
    id: data.reportId || data._id || "Unknown",
    batch: data.reportId || data._id?.substring(0, 8).toUpperCase() || "N/A",
    date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "N/A",
    purity: data.purity,
    grade: data.grade || "B",
    location: data.aiOutputs?.price?.market || "Main Warehouse",
    raw: data,
  };
}

export default function ReportLookupPage() {
  const [q, setQ] = useState("");
  const [reports, setReports] = useState<ReportUI[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const fetchRecentReports = async (searchQuery: string = "") => {
    setLoading(true);
    try {
      const data = await apiService.getReports(20, searchQuery);
      if (Array.isArray(data)) {
        setReports(data.map(toReportUI));
      } else if (data && typeof data === 'object' && (data as any)._id) {
        // Handle single result if search returned one object
        setReports([toReportUI(data as any)]);
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!q.trim()) return;
    setHasSearched(true);
    fetchRecentReports(q.trim());
  };

  const handleViewReport = (report: ReportUI) => {
    // Set the global grainData query to this specific report
    queryClient.setQueryData(["grainData"], report.raw);
    // Navigate to dashboard
    setLocation("/purity");
  };

  const handleDownloadReportPDF = (report: ReportUI) => {
    // Trigger backend download directly
    if (report.raw._id) {
      apiService.downloadReportPdf(report.raw._id);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-2xl bg-foreground/5">
              <FileSearch className="size-4.5 text-primary" strokeWidth={2.2} />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-[-0.02em]" data-testid="text-page-title">
              Report Lookup
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground" data-testid="text-page-description">
            View recent scans or search by ID and market location.
          </p>
        </div>
      </header>

      <div>
        <div className="mb-4 ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Search & Filters
        </div>
        <Card className="card-premium rounded-3xl border bg-card p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative w-full md:w-[420px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search: Report ID, Location, Grade..."
                  className="h-11 rounded-2xl pl-9"
                  data-testid="input-report-search"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-11 rounded-2xl"
                data-testid="button-clear-search"
                onClick={() => {
                  setQ("");
                  setReports([]);
                  setHasSearched(false);
                }}
              >
                Clear
              </Button>
              <Button
                className="h-11 rounded-2xl"
                data-testid="button-open-report"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Archive Results
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="grid grid-cols-7 bg-slate-900/[0.03] dark:bg-white/[0.03] px-4 py-3 text-xs font-semibold text-muted-foreground border-b border-slate-200/40 dark:border-slate-800/40">
            <div className="col-span-2">Report ID</div>
            <div>Batch</div>
            <div>Purity</div>
            <div>Grade</div>
            <div className="col-span-1">Location</div>
            <div className="text-right">Action</div>
          </div>
          <AnimatePresence mode="wait">
            {!hasSearched && (
              <motion.div
                key="initial"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="px-4 py-16 text-center"
              >
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-4">
                  <Search className="size-6" />
                </div>
                <h3 className="text-lg font-semibold">Ready to Lookup</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Enter a Report ID, Market Location, or Grade in the search bar above to retrieve historical analysis data.
                </p>
              </motion.div>
            )}
            {hasSearched && reports.length === 0 && !loading && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-10 text-center text-sm text-muted-foreground"
              >
                No reports found matching "{q}".
              </motion.div>
            )}
            {hasSearched && reports.length > 0 && (
              <motion.div
                key="results"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {reports.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0 }
                    }}
                    className="grid grid-cols-7 items-center px-4 py-3 text-sm hover:bg-foreground/[0.03] transition-colors"
                    data-testid={`row-report-${idx}`}
                  >
                    <div className="col-span-2 font-medium truncate pr-2 text-primary" data-testid={`text-report-id-${idx}`}>
                      {r.id}
                    </div>
                    <div data-testid={`text-report-batch-${idx}`}>{r.batch}</div>
                    <div data-testid={`text-report-purity-${idx}`}>{r.purity.toFixed(1)}%</div>
                    <div>
                      <Badge
                        className={
                          r.grade === "A"
                            ? "rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : r.grade === "B"
                              ? "rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300"
                              : "rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300"
                        }
                        data-testid={`badge-report-grade-${idx}`}
                      >
                        {r.grade}
                      </Badge>
                    </div>
                    <div className="truncate text-muted-foreground pr-2" data-testid={`text-report-location-${idx}`}>{r.location}</div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 rounded-lg px-2 text-xs"
                        onClick={() => handleViewReport(r)}
                      >
                        <Eye className="size-3" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 rounded-lg px-2 text-xs text-primary"
                        onClick={() => handleDownloadReportPDF(r)}
                      >
                        <FileText className="size-3" />
                        PDF
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
