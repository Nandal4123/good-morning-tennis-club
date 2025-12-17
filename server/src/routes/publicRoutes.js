import express from "express";
import * as clubController from "../controllers/clubController.js";

const router = express.Router();

// 공개 엔드포인트: 카톡 OG 미리보기/브랜딩 조회용
// 예: GET /api/public/clubs/ace-club
router.get("/clubs/:subdomain", clubController.getPublicClubInfoBySubdomain);

export default router;


