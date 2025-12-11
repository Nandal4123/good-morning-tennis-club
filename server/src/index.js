import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import matchRoutes from "./routes/matchRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

dotenv.config();

const app = express();

// Prisma 클라이언트 생성 (연결 풀 최적화)
let prisma;
try {
  // DATABASE_URL에서 connection_limit 파라미터 추가
  const databaseUrl = process.env.DATABASE_URL;
  let optimizedUrl = databaseUrl;

  // connection_limit 파라미터가 없으면 추가
  // Supabase Transaction Mode: 연결 제한이 매우 엄격 (1-2개)
  // Direct Connection은 IPv4 호환되지 않아 Render에서 사용 불가
  // 따라서 Session Pooler 사용 + connection_limit=1로 최소화
  if (databaseUrl && !databaseUrl.includes("connection_limit")) {
    const separator = databaseUrl.includes("?") ? "&" : "?";
    optimizedUrl = `${databaseUrl}${separator}connection_limit=1&pool_timeout=10`;
    console.log(
      "🔧 DATABASE_URL에 connection_limit=1 파라미터 추가됨 (Transaction Mode 최적화)"
    );
  }

  // 환경 변수 임시 설정 (Prisma가 사용)
  if (optimizedUrl !== databaseUrl) {
    process.env.DATABASE_URL = optimizedUrl;
  }

  prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // 연결 풀 최적화: Supabase Transaction Mode 제한 고려
    datasources: {
      db: {
        url: optimizedUrl,
      },
    },
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
