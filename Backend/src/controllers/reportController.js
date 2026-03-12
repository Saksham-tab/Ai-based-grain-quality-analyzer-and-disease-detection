import Report from "../models/reportmodel.js";
import { runAIInference } from "../services/aiService.js";
import { validateRawPayload } from "../services/validationService.js";
import { publishCaptureTrigger } from "../services/mqttService.js";
import { generateGrainReportPDF } from "../services/pdfService.js";

/**
 * Default fallback report when all else fails
 */
const getDefaultFallbackReport = () => ({
  grade: "B",
  purity: 87.5,
  impurities: {
    husk: 3.2,
    stones: 1.9,
    blackSpots: 1.1,
    brokenPieces: 4.1,
    insectDamage: 0.7,
    discolored: 1.3,
  },
  aiOutputs: {
    price: { value: null, error: "Service unavailable" },
    shelfLife: { value: null, error: "Service unavailable" },
    advisory: { text: "⚠️ System unavailable. Please try again later." },
  },
  sensorSnapshot: {
    temperature: 25,
    humidity: 60,
    moisture: 12,
  },
});

/* =====================================================
   CREATE REPORT + RUN AI ANALYSIS
   Frontend submits grain data → AI agents analyze → Save to MongoDB
   Route: POST /api/reports
===================================================== */

export const createReportController = ({
  ReportModel = Report,
  inferAI = runAIInference,
  validatePayload = validateRawPayload,
  fallbackReportBuilder = getDefaultFallbackReport,
  publishTrigger = publishCaptureTrigger,
} = {}) => {
  const createReport = async (req, res) => {
    try {
      const payload = req.body;

      /* ---------- Validate input data ---------- */
      const validation = validatePayload(payload);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      console.log("✅ Validation passed, running AI inference...");

      /* ---------- Run AI agents and save to MongoDB ---------- */
      const report = await inferAI(validation.data);

      return res.status(201).json({
        success: true,
        message: "Report created with AI analysis",
        data: report,
      });

    } catch (error) {
      console.error("❌ createReport error:", error.message);

      // Return fallback report on critical error
      return res.status(500).json({
        success: false,
        message: "AI inference failed, using fallback",
        data: fallbackReportBuilder(),
        error: error.message,
      });
    }
  };


  /* =====================================================
     GET REPORT BY ID
     Used by: Frontend Report Lookup page
     Route: GET /api/reports/:id
  ===================================================== */

  const getReportById = async (req, res) => {
    try {
      const { id } = req.params;

      // Try to find by MongoDB _id first
      const report = await ReportModel.findById(id).lean();

      if (!report) {
        console.warn(`Report not found with ID: ${id}`);
        // Return 404 but with a graceful response
        return res.status(404).json({
          success: false,
          message: `Report with ID "${id}" not found`,
          data: null,
        });
      }

      return res.json({
        success: true,
        data: report,
      });

    } catch (error) {
      console.error("❌ getReportById error:", error.message);

      // For invalid MongoDB IDs or other errors, return 400
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid report ID format",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error while fetching report",
        error: error.message,
      });
    }
  };


  /* =====================================================
     GET LATEST REPORT
     Useful for demo / dashboard auto-load
     Route: GET /api/reports/latest
  ===================================================== */

  const getLatestReport = async (req, res) => {
    try {
      const report = await ReportModel.findOne().sort({ createdAt: -1 }).lean();

      if (!report) {
        console.warn("⚠️ No reports found in database");
        return res.status(404).json({
          success: false,
          message: "No reports found. Please analyze grain first.",
          data: null,
        });
      }

      return res.json({
        success: true,
        data: report,
      });

    } catch (error) {
      console.error("❌ getLatestReport error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Server error while fetching latest report",
        error: error.message,
      });
    }
  };

  const getReports = async (req, res) => {
    try {
      const { limit = 20, search = "" } = req.query;

      let query = {};
      if (search) {
        // Search by ID or possibly other fields in the future
        // Use regex for partial ID search if needed, but Mongo IDs are exact
        // For now, let's support exact ID or a more flexible query if needed
        if (search.length === 24) {
          query.$or = [{ _id: search }, { reportId: search }];
        } else {
          // Add more search logic here if needed (e.g. by grade)
          query.$or = [
            { reportId: { $regex: search, $options: 'i' } },
            { grade: search.toUpperCase() },
            { "aiOutputs.price.market": { $regex: search, $options: 'i' } }
          ];
        }
      }

      const reports = await ReportModel.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();

      return res.json({
        success: true,
        count: reports.length,
        data: reports,
      });
    } catch (error) {
      console.error("❌ getReports error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Server error while fetching reports",
        error: error.message,
      });
    }
  };

  const captureGrain = async (req, res) => {
    try {
      const success = publishTrigger();
      if (!success) {
        return res.status(503).json({
          success: false,
          message: "MQTT service unavailable",
        });
      }

      return res.json({
        success: true,
        message: "Capture command sent",
      });
    } catch (error) {
      console.error("❌ captureGrain error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send capture command",
        error: error.message,
      });
    }
  };

  const downloadPdf = async (req, res) => {
    try {
      const { id } = req.params;
      let report;

      if (id === "latest") {
        report = await ReportModel.findOne().sort({ createdAt: -1 }).lean();
      } else {
        report = await ReportModel.findById(id).lean();
      }

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      const pdfBuffer = await generateGrainReportPDF(report);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=grain_report_${report.reportId || id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error("❌ downloadPdf error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to generate PDF",
        error: error.message,
      });
    }
  };

  return {
    createReport,
    getReportById,
    getLatestReport,
    getReports,
    captureGrain,
    downloadPdf,
  };
};

const reportController = createReportController();

export const createReport = reportController.createReport;
export const getReportById = reportController.getReportById;
export const getLatestReport = reportController.getLatestReport;
export const getReports = reportController.getReports;
export const captureGrain = reportController.captureGrain;
export const downloadPdf = reportController.downloadPdf;
