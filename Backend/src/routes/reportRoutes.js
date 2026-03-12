import express from "express";
import {
  createReport,
  getReportById,
  getLatestReport,
  getReports,
  captureGrain,
  downloadPdf,
} from "../controllers/reportController.js";

const router = express.Router();

/* =====================================================
   ROUTES
===================================================== */

/**
 * POST create report with AI analysis
 * URL: /api/reports
 * Body: {
 *   temperature: number,
 *   humidity: number,
 *   moisture: number,
 *   purity: number,
 *   grade: "A" | "B" | "C",
 *   impurities: { husk, stones, ... }
 * }
 */
router.post("/", createReport);

/**
 * POST trigger grain capture
 * URL: /api/reports/capture
 */
router.post("/capture", captureGrain);

/**
 * GET multiple reports (list/search)
 * URL: /api/reports?limit=20&search=xyz
 */
router.get("/", getReports);

/**
 * GET latest report
 * URL: /api/reports/latest
 */
router.get("/latest", getLatestReport);

/**
 * GET report by Mongo ID
 * URL: /api/reports/:id
 */
router.get("/:id", getReportById);

/**
 * GET report as PDF
 * URL: /api/reports/:id/pdf
 */
router.get("/:id/pdf", downloadPdf);

export default router;
