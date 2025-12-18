import express from "express";
import crypto from "crypto";
import { signOwnerToken } from "../utils/ownerToken.js";

const router = express.Router();

// GET /api/owner/debug (디버깅용 - 환경변수 상태만 확인, 실제 값은 출력하지 않음)
router.get("/debug", (req, res) => {
  const ownerPassword = (process.env.OWNER_PASSWORD || "").toString().trim();
  const secret = process.env.OWNER_TOKEN_SECRET;
  
  // 보안: 실제 값은 출력하지 않고 상태만 확인
  return res.json({
    ownerPasswordConfigured: !!ownerPassword,
    ownerPasswordLength: ownerPassword.length,
    ownerPasswordFirstChar: ownerPassword.length > 0 ? String.fromCharCode(ownerPassword.charCodeAt(0)) : null,
    ownerPasswordLastChar: ownerPassword.length > 0 ? String.fromCharCode(ownerPassword.charCodeAt(ownerPassword.length - 1)) : null,
    ownerTokenSecretConfigured: !!secret,
    // 첫 3글자와 마지막 3글자만 보여주기 (디버깅용)
    ownerPasswordPreview: ownerPassword.length > 6 
      ? `${ownerPassword.substring(0, 3)}...${ownerPassword.substring(ownerPassword.length - 3)}`
      : ownerPassword.length > 0 ? "***" : "(empty)",
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

    // 디버깅: 환경변수 상태 확인 (보안상 실제 값은 출력하지 않음)
    console.log("[Owner Login] 환경변수 확인:");
    console.log("  - OWNER_PASSWORD 설정됨:", !!ownerPassword);
    console.log("  - OWNER_PASSWORD 길이:", ownerPassword.length);
    console.log("  - OWNER_TOKEN_SECRET 설정됨:", !!secret);
    console.log("  - 입력 비밀번호 길이:", inputPassword.length);

    // 첫 문자와 마지막 문자 코드 확인 (디버깅용)
    if (ownerPassword.length > 0) {
      console.log(
        "  - OWNER_PASSWORD 첫 문자 코드:",
        ownerPassword.charCodeAt(0)
      );
      console.log(
        "  - OWNER_PASSWORD 마지막 문자 코드:",
        ownerPassword.charCodeAt(ownerPassword.length - 1)
      );
    }
    if (inputPassword.length > 0) {
      console.log(
        "  - 입력 비밀번호 첫 문자 코드:",
        inputPassword.charCodeAt(0)
      );
      console.log(
        "  - 입력 비밀번호 마지막 문자 코드:",
        inputPassword.charCodeAt(inputPassword.length - 1)
      );
    }

    if (!ownerPassword) {
      console.error("[Owner Login] ❌ OWNER_PASSWORD 환경변수가 설정되지 않음");
      return res.status(500).json({
        error: "Owner password not configured",
        message: "서버 환경 변수 OWNER_PASSWORD가 설정되어야 합니다.",
      });
    }
    if (!secret) {
      console.error(
        "[Owner Login] ❌ OWNER_TOKEN_SECRET 환경변수가 설정되지 않음"
      );
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
      console.error("[Owner Login] ❌ 비밀번호 불일치:");
      console.error("  - 환경변수 길이:", a.length);
      console.error("  - 입력 길이:", b.length);
      console.error("  - 길이 일치:", a.length === b.length);

      return res.status(401).json({
        error: "Invalid password",
        message: "오너 비밀번호가 올바르지 않습니다.",
      });
    }

    console.log("[Owner Login] ✅ 비밀번호 일치, 토큰 발급");

    const token = signOwnerToken({ sub: "owner" }, secret, 60 * 60 * 12);
    return res.json({ token, expiresInSeconds: 60 * 60 * 12 });
  } catch (error) {
    console.error("Owner login error:", error);
    return res.status(500).json({ error: "Owner login failed" });
  }
});

export default router;
