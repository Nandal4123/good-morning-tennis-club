/**
 * Ace Club 생성 스크립트
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

async function createAceClub() {
  try {
    console.log("🎾 Ace Club 생성 시작...\n");

    // 기존 클럽 확인
    const existingClub = await prisma.club.findUnique({
      where: { subdomain: "ace-club" },
    });

    if (existingClub) {
      console.log(`✅ Ace Club이 이미 존재합니다:`);
      console.log(`   ID: ${existingClub.id}`);
      console.log(`   이름: ${existingClub.name}`);
      console.log(`   서브도메인: ${existingClub.subdomain}`);
      console.log(`   생성일: ${existingClub.createdAt}`);
      return;
    }

    // Ace Club 생성
    const aceClub = await prisma.club.create({
      data: {
        name: "Ace Club",
        subdomain: "ace-club",
      },
    });

    console.log("✅ Ace Club 생성 완료!");
    console.log(`   ID: ${aceClub.id}`);
    console.log(`   이름: ${aceClub.name}`);
    console.log(`   서브도메인: ${aceClub.subdomain}`);
    console.log(`   생성일: ${aceClub.createdAt}\n`);

    console.log("📝 사용 방법:");
    console.log("   1. 서브도메인: ace-club.tennisapp.com");
    console.log("   2. 헤더: X-Club-Subdomain: ace-club");
    console.log("   3. 쿼리 파라미터: ?club=ace-club");

  } catch (error) {
    console.error("❌ Ace Club 생성 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAceClub()
  .then(() => {
    console.log("\n✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });

