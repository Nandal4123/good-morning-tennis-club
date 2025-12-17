import express from "express";
import { verifySecret } from "../utils/secretHash.js";

const router = express.Router();

// POST /api/auth/admin/verify
// body: { password }
// 클럽 컨텍스트(req.club)를 기준으로 클럽 관리자 비밀번호를 검증한다.
router.post("/admin/verify", async (req, res) => {
  try {
    if (!req.club?.id) {
      return res.status(400).json({
        error: "Missing club context",
        message: "클럽 컨텍스트를 확인할 수 없습니다.",
      });
    }

    const password = (req.body?.password || "").toString();
    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    const club = await req.prisma.club.findUnique({
      where: { id: req.club.id },
      select: { id: true, subdomain: true, adminPasswordHash: true },
    });

    if (!club) return res.status(404).json({ error: "Club not found" });

    if (!club.adminPasswordHash) {
      return res.status(409).json({
        error: "Admin password not set",
        message:
          "이 클럽의 관리자 비밀번호가 아직 설정되지 않았습니다. Owner 대시보드에서 설정하세요.",
      });
    }

    const ok = verifySecret(password, club.adminPasswordHash);
    if (!ok) return res.status(401).json({ error: "Invalid password" });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Admin verify error:", error);
    return res.status(500).json({ error: "Failed to verify admin password" });
  }
});

export default router;


