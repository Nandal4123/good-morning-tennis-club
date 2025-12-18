import { createPrismaClient } from "./create-prisma-client.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = createPrismaClient();

async function backupDatabase() {
  try {
    console.log("🔄 데이터베이스 백업 시작...\n");

    // 백업 디렉토리 생성
    const backupDir = path.join(__dirname, "../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 날짜별 백업 파일명 생성
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // 모든 테이블 데이터 가져오기
    // clubId 컬럼이 아직 없을 수 있으므로 select로 명시적으로 필드 지정
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      data: {
        users: await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tennisLevel: true,
            goals: true,
            languagePref: true,
            profileMetadata: true,
            createdAt: true,
            updatedAt: true,
            // clubId는 스키마에 있지만 DB에 없을 수 있으므로 제외
          },
        }),
        sessions: await prisma.session.findMany({
          select: {
            id: true,
            date: true,
            description: true,
            createdAt: true,
            // clubId는 스키마에 있지만 DB에 없을 수 있으므로 제외
          },
        }),
        attendances: await prisma.attendance.findMany({
          select: {
            id: true,
            userId: true,
            sessionId: true,
            date: true,
            status: true,
            createdAt: true,
          },
        }),
        matches: await prisma.match.findMany({
          select: {
            id: true,
            date: true,
            type: true,
            createdAt: true,
            createdBy: true,
            // clubId는 스키마에 있지만 DB에 없을 수 있으므로 제외
            participants: {
              select: {
                id: true,
                userId: true,
                team: true,
                score: true,
              },
            },
          },
        }),
        feedbacks: await prisma.feedback.findMany({
          select: {
            id: true,
            userId: true,
            date: true,
            content: true,
            createdAt: true,
          },
        }),
      },
      statistics: {
        userCount: await prisma.user.count(),
        sessionCount: await prisma.session.count(),
        attendanceCount: await prisma.attendance.count(),
        matchCount: await prisma.match.count(),
        feedbackCount: await prisma.feedback.count(),
      },
    };

    // JSON 파일로 저장
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), "utf-8");

    console.log("✅ 백업 완료!");
    console.log(`📁 백업 파일: ${backupFile}`);
    console.log("\n📊 백업 통계:");
    console.log(`   - 사용자: ${backup.statistics.userCount}명`);
    console.log(`   - 세션: ${backup.statistics.sessionCount}개`);
    console.log(`   - 출석: ${backup.statistics.attendanceCount}건`);
    console.log(`   - 경기: ${backup.statistics.matchCount}개`);
    console.log(`   - 피드백: ${backup.statistics.feedbackCount}개`);

    // 최신 백업 링크 생성 (심볼릭 링크 대신 복사)
    const latestBackup = path.join(backupDir, "backup-latest.json");
    fs.copyFileSync(backupFile, latestBackup);
    console.log(`\n🔗 최신 백업: ${latestBackup}`);

    // 오래된 백업 파일 정리 (30일 이상 된 백업 삭제)
    const files = fs.readdirSync(backupDir);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    files.forEach((file) => {
      if (
        file.startsWith("backup-") &&
        file.endsWith(".json") &&
        file !== "backup-latest.json"
      ) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < thirtyDaysAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`\n🗑️  오래된 백업 ${deletedCount}개 삭제됨 (30일 이상)`);
    }
  } catch (error) {
    console.error("❌ 백업 실패:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
