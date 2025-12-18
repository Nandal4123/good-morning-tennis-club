/**
 * 스냅샷에서 빠른 복구 스크립트
 * 
 * Render Shell에서 실행 가능하도록 간소화된 버전
 * 스냅샷 파일 경로를 직접 지정하여 복구
 */

import { createPrismaClient } from "./create-prisma-client.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const snapshotName = process.argv[2] || "snapshot-2025-12-18T05-26-42";
  
  // 프로젝트 루트 찾기
  const projectRoot = path.join(__dirname, "..", "..");
  const snapshotFile = path.join(projectRoot, "snapshots", snapshotName, "db.json");

  if (!fs.existsSync(snapshotFile)) {
    console.error(`❌ 스냅샷 파일을 찾을 수 없습니다: ${snapshotFile}`);
    console.error("\n사용 가능한 스냅샷:");
    const snapshotsDir = path.join(projectRoot, "snapshots");
    if (fs.existsSync(snapshotsDir)) {
      const dirs = fs.readdirSync(snapshotsDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith("snapshot-"))
        .map(d => d.name);
      dirs.forEach(name => console.error(`  - ${name}`));
    }
    process.exit(1);
  }

  console.log(`📦 스냅샷 파일 로드: ${snapshotFile}`);
  const dbData = JSON.parse(fs.readFileSync(snapshotFile, "utf-8"));

  const prisma = createPrismaClient();

  try {
    console.log("\n⚠️  경고: 이 작업은 기존 데이터베이스의 모든 데이터를 삭제합니다!");
    console.log("복구를 시작합니다...\n");

    // 1. 모든 테이블 데이터 삭제 (순서 중요: 외래키 참조 순서 역순)
    console.log("🗑️  기존 데이터 삭제 중...");
    await prisma.attendance.deleteMany({});
    await prisma.matchParticipant.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.club.deleteMany({});

    // 2. 데이터 복구
    console.log("📥 데이터 복구 중...");

    // Clubs 복구
    if (dbData.clubs && dbData.clubs.length > 0) {
      console.log(`  - 클럽 ${dbData.clubs.length}개 복구 중...`);
      for (const club of dbData.clubs) {
        await prisma.club.create({ data: club });
      }
      console.log(`  ✅ 클럽 복구 완료`);
    }

    // Users 복구
    if (dbData.users && dbData.users.length > 0) {
      console.log(`  - 회원 ${dbData.users.length}명 복구 중...`);
      for (const user of dbData.users) {
        await prisma.user.create({ data: user });
      }
      console.log(`  ✅ 회원 복구 완료`);
    }

    // Sessions 복구
    if (dbData.sessions && dbData.sessions.length > 0) {
      console.log(`  - 세션 ${dbData.sessions.length}개 복구 중...`);
      for (const session of dbData.sessions) {
        await prisma.session.create({ data: session });
      }
      console.log(`  ✅ 세션 복구 완료`);
    }

    // Matches 복구
    if (dbData.matches && dbData.matches.length > 0) {
      console.log(`  - 경기 ${dbData.matches.length}개 복구 중...`);
      for (const match of dbData.matches) {
        await prisma.match.create({ data: match });
      }
      console.log(`  ✅ 경기 복구 완료`);
    }

    // MatchParticipants 복구
    if (dbData.matchParticipants && dbData.matchParticipants.length > 0) {
      console.log(`  - 경기 참가자 ${dbData.matchParticipants.length}명 복구 중...`);
      for (const participant of dbData.matchParticipants) {
        await prisma.matchParticipant.create({ data: participant });
      }
      console.log(`  ✅ 경기 참가자 복구 완료`);
    }

    // Attendances 복구
    if (dbData.attendances && dbData.attendances.length > 0) {
      console.log(`  - 출석 기록 ${dbData.attendances.length}개 복구 중...`);
      for (const attendance of dbData.attendances) {
        await prisma.attendance.create({ data: attendance });
      }
      console.log(`  ✅ 출석 기록 복구 완료`);
    }

    // Feedbacks 복구
    if (dbData.feedbacks && dbData.feedbacks.length > 0) {
      console.log(`  - 피드백 ${dbData.feedbacks.length}개 복구 중...`);
      for (const feedback of dbData.feedbacks) {
        await prisma.feedback.create({ data: feedback });
      }
      console.log(`  ✅ 피드백 복구 완료`);
    }

    console.log("\n🎉 데이터 복구 완료!");

    // 3. 확인
    const counts = {
      clubs: await prisma.club.count(),
      users: await prisma.user.count(),
      sessions: await prisma.session.count(),
      matches: await prisma.match.count(),
      attendances: await prisma.attendance.count(),
    };

    console.log("\n📊 복구된 데이터 통계:");
    console.log(`  - 클럽: ${counts.clubs}개`);
    console.log(`  - 회원: ${counts.users}명`);
    console.log(`  - 세션: ${counts.sessions}개`);
    console.log(`  - 경기: ${counts.matches}개`);
    console.log(`  - 출석 기록: ${counts.attendances}개`);

  } catch (error) {
    console.error("\n❌ 복구 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

