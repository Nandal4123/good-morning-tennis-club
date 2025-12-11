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
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
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
      message: err.message 
    });
  }
  
  res.status(500).json({ 
    error: "Something went wrong!",
    message: err.message 
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
