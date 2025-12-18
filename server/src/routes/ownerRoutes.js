import express from "express";
import crypto from "crypto";
import { signOwnerToken } from "../utils/ownerToken.js";

const router = express.Router();

// GET /api/owner/debug - 환경 변수 확인용 디버깅 엔드포인트
router.get("/debug", (req, res) => {
  const ownerPassword = process.env.OWNER_PASSWORD || "";
  const secret = process.env.OWNER_TOKEN_SECRET || "";

  console.log("[Owner Debug] 환경변수 확인:");
  console.log(
    "  - process.env.OWNER_PASSWORD 원본:",
    ownerPassword ? `"${ownerPassword}"` : "undefined"
  );
  console.log("  - 원본 길이:", ownerPassword.length);
  console.log("  - trim 후:", `"${ownerPassword.trim()}"`);
  console.log("  - trim 후 길이:", ownerPassword.trim().length);
  console.log("  - OWNER_TOKEN_SECRET 설정됨:", !!secret);
  console.log("  - OWNER_TOKEN_SECRET 길이:", secret.length);

  // 모든 OWNER 관련 환경변수 키
  const allOwnerEnvVars = Object.keys(process.env).filter((k) =>
    k.includes("OWNER")
  );
  console.log("  - 모든 OWNER 관련 환경변수:", allOwnerEnvVars);

  res.json({
    ownerPasswordConfigured: !!ownerPassword,
    ownerPasswordLength: ownerPassword.length,
    ownerPasswordTrimmedLength: ownerPassword.trim().length,
    ownerPasswordFirstChar: ownerPassword.length > 0 ? ownerPassword[0] : null,
    ownerPasswordLastChar:
      ownerPassword.length > 0 ? ownerPassword[ownerPassword.length - 1] : null,
    ownerPasswordPreview:
      ownerPassword.length > 0
        ? `${ownerPassword.substring(0, 3)}...${ownerPassword.substring(
            ownerPassword.length - 3
          )}`
        : "(empty)",
    ownerTokenSecretConfigured: !!secret,
    ownerTokenSecretLength: secret.length,
    allOwnerEnvVars: allOwnerEnvVars,
    nodeEnv: process.env.NODE_ENV,
  });
});

// POST /api/owner/login
// body: { password }
router.post("/login", async (req, res) => {
  try {
    // Render UI에서 복사/붙여넣기 시 공백이 섞이는 실수를 방지하기 위해 trim 처리
    const inputPassword = (req.body?.password || "").toString().trim();
    const ownerPassword = (process.env.OWNER_PASSWORD || "").toString().trim();
    const secret = process.env.OWNER_TOKEN_SECRET;

    // 디버깅: 환경변수 상태 로그
    console.log("[Owner Login] 🔍 환경변수 확인:");
    console.log(
      "  - process.env.OWNER_PASSWORD 원본:",
      process.env.OWNER_PASSWORD
        ? `"${process.env.OWNER_PASSWORD}"`
        : "undefined"
    );
    console.log("  - typeof:", typeof process.env.OWNER_PASSWORD);
    console.log("  - 원본 길이:", process.env.OWNER_PASSWORD?.length || 0);
    console.log("  - trim 후:", `"${ownerPassword}"`);
    console.log("  - trim 후 길이:", ownerPassword.length);
    console.log(
      "  - 모든 OWNER 관련 환경변수 키:",
      Object.keys(process.env).filter((k) => k.includes("OWNER"))
    );

    if (!ownerPassword) {
      console.error("[Owner Login] ❌ OWNER_PASSWORD 환경변수가 설정되지 않음");
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
