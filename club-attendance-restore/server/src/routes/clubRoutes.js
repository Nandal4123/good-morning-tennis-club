import express from "express";
import * as clubController from "../controllers/clubController.js";

const router = express.Router();

// GET /api/clubs?q=...
router.get("/", clubController.getAllClubs);

// GET /api/clubs/:subdomain/summary
router.get("/:subdomain/summary", clubController.getClubSummaryBySubdomain);

export default router;


