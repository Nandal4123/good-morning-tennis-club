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
// Health check는 클럽 해석 없이 접근 가능
app.use("/api/health", (req, res, next) => next());

// 모든 API에 클럽 해석 미들웨어 적용
app.use("/api", resolveClub);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendances", attendanceRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/clubs", clubRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Club info endpoint (클럽 정보 반환)
app.get("/api/club/info", (req, res) => {
  try {
    // 멀티 테넌트 모드에서 클럽 정보 반환
    if (req.club) {
      return res.json({
        id: req.club.id,
        name: req.club.name,
        subdomain: req.club.subdomain,
      });
    }

    // MVP 모드 또는 클럽이 없는 경우 기본 클럽 정보 반환
    res.json({
      id: process.env.DEFAULT_CLUB_ID || "default-club",
      name: process.env.CLUB_NAME || "Good Morning Club",
      subdomain: process.env.CLUB_SUBDOMAIN || "default",
    });
  } catch (error) {
    console.error("Error getting club info:", error);
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
});

export { prisma };
