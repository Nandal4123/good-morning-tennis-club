import { getKoreanTodayStart } from "../utils/timezone.js";
import { getClubFilter, getClubInfo } from "../utils/clubInfo.js";

// POST /api/metrics/visit
// body: { visitorId: string, userId?: string }
// 하루(한국시간) 기준 clubId + day + visitorId 유니크로 중복 방지
export const trackVisit = async (req, res) => {
  try {
    const visitorId = (req.body?.visitorId || "").toString().trim();
    const userId = req.body?.userId ? req.body.userId.toString() : null;

    if (!visitorId || visitorId.length > 200) {
      return res.status(400).json({
        error: "Invalid visitorId",
        message: "visitorId가 필요합니다.",
      });
    }

    // 클럽 ID 해석 (멀티테넌트: req.club, MVP: 기본 클럽)
    let clubId = getClubFilter(req);
    if (!clubId) {
      const clubInfo = getClubInfo(req);
      const defaultClubId = clubInfo.id;
      if (defaultClubId && defaultClubId !== "default-club") {
        const club = await req.prisma.club.findUnique({
          where: { id: defaultClubId },
          select: { id: true },
        });
        if (club) clubId = club.id;
      }
    }

    if (!clubId) {
      return res.status(400).json({
        error: "Missing club context",
        message: "클럽 정보를 확인할 수 없습니다.",
      });
    }

    const day = getKoreanTodayStart();

    // 서버가 재시작되기 전(구 Prisma Client)에는 visit 모델이 없을 수 있음
    if (!req.prisma?.visit?.upsert) {
      return res.json({ ok: true, skipped: true });
    }

    // upsert로 중복 방지 + 로그인 후 userId가 생기면 업데이트 가능
    await req.prisma.visit.upsert({
      where: {
        clubId_day_visitorId: { clubId, day, visitorId },
      },
      update: {
        userId: userId || undefined,
      },
      create: {
        clubId,
        day,
        visitorId,
        userId,
      },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("trackVisit error:", error);
    // 마이그레이션 전(테이블 없음)에서도 앱이 죽지 않도록 방어
    if (error?.code === "P2022") {
      return res.json({ ok: true, skipped: true });
    }
    return res.status(500).json({ error: "Failed to track visit" });
  }
};
