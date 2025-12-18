import express from "express";
import crypto from "crypto";
import { signOwnerToken } from "../utils/ownerToken.js";

const router = express.Router();

// POST /api/owner/login
// body: { password }
router.post("/login", async (req, res) => {
  try {
    // Render UI에서 복사/붙여넣기 시 공백이 섞이는 실수를 방지하기 위해 trim 처리
    const inputPassword = (req.body?.password || "").toString().trim();
    const ownerPassword = (process.env.OWNER_PASSWORD || "").toString().trim();
    const secret = process.env.OWNER_TOKEN_SECRET;

    if (!ownerPassword) {
      return res.status(500).json({
        error: "Owner password not configured",
        message: "서버 환경 변수 OWNER_PASSWORD가 설정되어야 합니다.",
      });
    }
    if (!secret) {
      return res.status(500).json({
        error: "Owner token secret not configured",
        message: "서버 환경 변수 OWNER_TOKEN_SECRET가 설정되어야 합니다.",
      });
    }

    // timing-safe compare
    const a = Buffer.from(ownerPassword);
    const b = Buffer.from(inputPassword);
    const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!ok) {
      return res.status(401).json({
        error: "Invalid password",
        message: "오너 비밀번호가 올바르지 않습니다.",
      });
    }

    const token = signOwnerToken({ sub: "owner" }, secret, 60 * 60 * 12);
    return res.json({ token, expiresInSeconds: 60 * 60 * 12 });
  } catch (error) {
    console.error("Owner login error:", error);
    return res.status(500).json({ error: "Owner login failed" });
  }
});

export default router;
