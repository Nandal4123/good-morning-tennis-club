import express from "express";
import * as clubController from "../controllers/clubController.js";

const router = express.Router();

// GET /api/clubs?q=...
router.get("/", clubController.getAllClubs);

// POST /api/clubs (클럽 생성)
router.post("/", clubController.createClub);

// GET /api/clubs/:subdomain (클럽 상세 정보)
router.get("/:subdomain", clubController.getClubBySubdomain);

// GET /api/clubs/:subdomain/summary
router.get("/:subdomain/summary", clubController.getClubSummaryBySubdomain);

// PUT /api/clubs/:subdomain/admin-password (관리자 비밀번호 변경)
router.put("/:subdomain/admin-password", clubController.updateAdminPassword);

// PUT /api/clubs/:subdomain/join-code (가입 코드 변경)
router.put("/:subdomain/join-code", clubController.updateJoinCode);

export default router;


