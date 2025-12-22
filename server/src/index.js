import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import { resolveClub } from "./middleware/clubResolver.js";

dotenv.config();

const app = express();

// Prisma 클라이언트 생성 (연결 풀 최적화)
let prisma;
try {
  const databaseUrl = process.env.DATABASE_URL;

  // DATABASE_URL에 connection_limit 파라미터가 없으면 추가
  // Supabase Transaction Mode 연결 풀 제한을 피하기 위해 connection_limit=1 설정
  let optimizedUrl = databaseUrl;

  if (databaseUrl && !databaseUrl.includes("connection_limit")) {
    // URL에 이미 파라미터가 있는지 확인
    const separator = databaseUrl.includes("?") ? "&" : "?";
    optimizedUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=1&connect_timeout=15`;

    // 환경 변수 업데이트 (Prisma가 사용하도록)
    process.env.DATABASE_URL = optimizedUrl;
    console.log("🔧 DATABASE_URL optimized with connection_limit=1");
    console.log(
      "🔧 Optimized URL:",
      optimizedUrl.replace(/:[^:@]+@/, ":****@")
    );
  } else if (databaseUrl && databaseUrl.includes("connection_limit")) {
    console.log("✅ DATABASE_URL already has connection_limit parameter");
  }

  // Prisma Client 생성
  // connection_limit은 DATABASE_URL의 파라미터로 설정됨
  // Prisma는 이를 자동으로 인식하여 연결 풀을 제한함
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  console.log("✅ Prisma Client initialized successfully");
  console.log("DATABASE_URL:", databaseUrl ? "Set" : "Not set");
} catch (error) {
  console.error("❌ Failed to initialize Prisma Client:", error);
  console.error("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");
  process.exit(1);
}

const PORT = process.env.PORT || 3001;

// Middleware - Allow all origins for deployment
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// 멀티 테넌트: 클럽 해석 미들웨어
// Health check, Owner API, Clubs API는 클럽 해석 없이 접근 가능
app.use("/api/health", (req, res, next) => next());
app.use("/api/owner", (req, res, next) => next());
app.use("/api/clubs", (req, res, next) => next()); // Owner 대시보드용 - 모든 클럽 조회

// Owner Routes (클럽 해석 전에 등록)
app.use("/api/owner", ownerRoutes);

// Clubs Routes (클럽 해석 전에 등록 - Owner 대시보드용)
app.use("/api/clubs", clubRoutes);

// 모든 API에 클럽 해석 미들웨어 적용
app.use("/api", resolveClub);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/feedbacks", feedbackRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Club info endpoint (클럽 정보 반환)
// 주의: 이 엔드포인트는 resolveClub 미들웨어를 거치므로 req.club이 설정되어 있어야 함
app.get("/api/club/info", async (req, res) => {
  try {
    // 쿼리 파라미터 확인 (디버깅용)
    const queryClub = req.query.club;
    const headerClub = req.get("X-Club-Subdomain");
    const resolvedClub = req.club;

    console.log("[Club Info] 요청 정보:", {
      queryClub,
      headerClub,
      resolvedClubName: resolvedClub?.name,
      resolvedClubSubdomain: resolvedClub?.subdomain,
      host: req.get("host"),
      hasResolvedClub: !!resolvedClub,
    });

    // 멀티 테넌트 모드에서 클럽 정보 반환
    if (resolvedClub) {
      const clubInfo = {
        id: resolvedClub.id,
        name: resolvedClub.name,
        subdomain: resolvedClub.subdomain,
        usePhoneNumber: resolvedClub.usePhoneNumber || false,
      };
      console.log("[Club Info] ✅ 클럽 정보 반환:", clubInfo);
      
      // 클럽 불일치 경고 (쿼리 파라미터와 해석된 클럽이 다른 경우)
      if (queryClub && queryClub !== resolvedClub.subdomain) {
        console.error("[Club Info] ❌ 클럽 불일치:", {
          requested: queryClub,
          resolved: resolvedClub.subdomain,
        });
      }
      
      return res.json(clubInfo);
    }

    // req.club이 없는 경우 - 쿼리 파라미터로 직접 조회 시도
    if (queryClub) {
      console.log("[Club Info] ⚠️ req.club이 없음, 쿼리 파라미터로 직접 조회:", queryClub);
      try {
        const club = await req.prisma.club.findUnique({
          where: { subdomain: queryClub.trim() },
        });
        
        if (club) {
          console.log("[Club Info] ✅ 쿼리 파라미터로 클럽 찾기 성공:", {
            name: club.name,
            subdomain: club.subdomain,
          });
          return res.json({
            id: club.id,
            name: club.name,
            subdomain: club.subdomain,
            usePhoneNumber: club.usePhoneNumber || false,
          });
        } else {
          console.error("[Club Info] ❌ 쿼리 파라미터로 클럽을 찾을 수 없음:", queryClub);
        }
      } catch (error) {
        console.error("[Club Info] ❌ 클럽 조회 중 오류:", error);
      }
    }

    // MVP 모드 또는 클럽이 없는 경우 기본 클럽 정보 반환
    const defaultInfo = {
      id: process.env.DEFAULT_CLUB_ID || "default-club",
      name: process.env.CLUB_NAME || "Good Morning Club",
      subdomain: process.env.CLUB_SUBDOMAIN || "default",
    };
    console.error(
      "[Club Info] ⚠️ 기본 클럽 정보 반환 (클럽 해석 실패):",
      defaultInfo
    );
    res.json(defaultInfo);
  } catch (error) {
    console.error("[Club Info] ❌ 오류:", error);
    res.status(500).json({ error: "Failed to get club info" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  console.error("Stack:", err.stack);

  // Prisma 초기화 오류 처리
  if (err.name === "PrismaClientInitializationError") {
    return res.status(500).json({
      error: "Database connection failed",
      details: "Please check DATABASE_URL environment variable",
      message: err.message,
    });
  }

  res.status(500).json({
    error: "Something went wrong!",
    message: err.message,
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🎾 Club Attendance Server running on port ${PORT}`);

  // 서버 시작 시 환경 변수 확인 (디버깅용)
  console.log("\n🔍 [Server Start] 환경변수 확인:");
  console.log("  - OWNER_PASSWORD 설정됨:", !!process.env.OWNER_PASSWORD);
  console.log(
    "  - OWNER_PASSWORD 길이:",
    process.env.OWNER_PASSWORD?.length || 0
  );
  console.log(
    "  - OWNER_TOKEN_SECRET 설정됨:",
    !!process.env.OWNER_TOKEN_SECRET
  );
  console.log(
    "  - OWNER_TOKEN_SECRET 길이:",
    process.env.OWNER_TOKEN_SECRET?.length || 0
  );
  console.log("  - DATABASE_URL 설정됨:", !!process.env.DATABASE_URL);
  console.log("  - NODE_ENV:", process.env.NODE_ENV || "not set");
  console.log("  - PORT:", PORT);

  // OWNER 관련 환경 변수 키 확인
  const ownerEnvKeys = Object.keys(process.env).filter((k) =>
    k.includes("OWNER")
  );
  console.log(
    "  - OWNER 관련 환경변수 키:",
    ownerEnvKeys.length > 0 ? ownerEnvKeys : "없음"
  );

  if (!process.env.OWNER_PASSWORD) {
    console.error("  ⚠️ 경고: OWNER_PASSWORD가 설정되지 않았습니다!");
  }
  if (!process.env.OWNER_TOKEN_SECRET) {
    console.error("  ⚠️ 경고: OWNER_TOKEN_SECRET이 설정되지 않았습니다!");
  }
  console.log("");
});

export { prisma };
