import express from "express";
import * as clubController from "../controllers/clubController.js";
import { requireOwner } from "../middleware/requireOwner.js";

const router = express.Router();

// Owner 전용 운영 API (무료 6개월: 운영자 1인 기준)
// NOTE: 필요하면 추후 role 기반(JWT)로 확장
router.use(requireOwner);

// GET /api/clubs?q=...
router.get("/", clubController.getAllClubs);

// POST /api/clubs
router.post("/", clubController.createClub);

// GET /api/clubs/:subdomain/summary
router.get("/:subdomain/summary", clubController.getClubSummaryBySubdomain);

// PUT /api/clubs/:subdomain/credentials
router.put("/:subdomain/credentials", clubController.setClubCredentials);

// PUT /api/clubs/:subdomain/branding
router.put("/:subdomain/branding", clubController.setClubBranding);

export default router;


