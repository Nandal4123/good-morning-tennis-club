/**
 * 데이터베이스에 있는 모든 클럽 확인 스크립트
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function checkClubs() {
  try {
    console.log("🔍 데이터베이스 클럽 확인 중...\n");

    const clubs = await prisma.club.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            sessions: true,
            matches: true,
          },
        },
      },
    });

    if (clubs.length === 0) {
      console.log("❌ 데이터베이스에 클럽이 없습니다.");
      console.log("\n📝 클럽 생성 방법:");
      console.log("   - 기본 클럽: pnpm run db:prepare-multi-tenant");
      console.log("   - 에이스클럽: node scripts/create-ace-club.js");
      return;
    }

    console.log(`✅ 총 ${clubs.length}개의 클럽이 있습니다:\n`);

    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name}`);
      console.log(`   서브도메인: ${club.subdomain}`);
      console.log(`   ID: ${club.id}`);
      console.log(`   생성일: ${club.createdAt.toISOString()}`);
      console.log(`   회원 수: ${club._count.users}명`);
      console.log(`   세션 수: ${club._count.sessions}개`);
      console.log(`   경기 수: ${club._count.matches}개`);
      console.log("");
    });

    // 특정 클럽 확인
    const defaultClub = clubs.find((c) => c.subdomain === "default");
    const aceClub = clubs.find((c) => c.subdomain === "ace-club");

    console.log("📋 클럽 상태:");
    console.log(`   - Good Morning Club (default): ${defaultClub ? "✅ 존재" : "❌ 없음"}`);
    console.log(`   - Ace Club (ace-club): ${aceClub ? "✅ 존재" : "❌ 없음"}`);

    if (!aceClub) {
      console.log("\n💡 에이스클럽이 없습니다. 생성하려면:");
      console.log("   node scripts/create-ace-club.js");
    }

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkClubs()
  .then(() => {
    console.log("\n✅ 확인 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 확인 실패:", error);
    process.exit(1);
  });

