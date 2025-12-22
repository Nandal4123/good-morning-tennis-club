import express from "express";
import * as metricsController from "../controllers/metricsController.js";

const router = express.Router();

// POST /api/metrics/visit
router.post("/visit", metricsController.trackVisit);

export default router;




