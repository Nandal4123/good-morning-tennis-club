/**
 * 클럽 데이터 격리 테스트 스크립트
 * 
 * 새로운 클럽을 생성하고 데이터 격리가 제대로 작동하는지 확인합니다.
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

async function testClubIsolation() {
  try {
    console.log("🧪 클럽 데이터 격리 테스트 시작...\n");

    // 1. 기본 클럽 확인
    console.log("1️⃣ 기본 클럽 확인...");
    const defaultClub = await prisma.club.findUnique({
      where: { subdomain: "default" },
    });

    if (!defaultClub) {
      console.error("❌ 기본 클럽을 찾을 수 없습니다!");
      return;
    }

    console.log(`✅ 기본 클럽: ${defaultClub.name} (${defaultClub.id})`);
    console.log(`   사용자 수: ${await prisma.user.count({ where: { clubId: defaultClub.id } })}`);
    console.log(`   세션 수: ${await prisma.session.count({ where: { clubId: defaultClub.id } })}`);
    console.log(`   경기 수: ${await prisma.match.count({ where: { clubId: defaultClub.id } })}\n`);

    // 2. 테스트 클럽 생성
    console.log("2️⃣ 테스트 클럽 생성...");
    let testClub = await prisma.club.findUnique({
      where: { subdomain: "test-club" },
    });

    if (!testClub) {
      testClub = await prisma.club.create({
        data: {
          name: "Test Club",
          subdomain: "test-club",
        },
      });
      console.log(`✅ 테스트 클럽 생성: ${testClub.name} (${testClub.id})\n`);
    } else {
      console.log(`✅ 테스트 클럽 이미 존재: ${testClub.name} (${testClub.id})\n`);
    }

    // 3. 테스트 클럽에 사용자 생성
    console.log("3️⃣ 테스트 클럽에 사용자 생성...");
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test-club.local`,
        name: "테스트 사용자",
        clubId: testClub.id,
      },
    });
    console.log(`✅ 테스트 사용자 생성: ${testUser.name} (${testUser.id})\n`);

    // 4. 데이터 격리 확인
    console.log("4️⃣ 데이터 격리 확인...");
    
    // 기본 클럽의 사용자 수
    const defaultClubUsers = await prisma.user.count({
      where: { clubId: defaultClub.id },
    });
    
    // 테스트 클럽의 사용자 수
    const testClubUsers = await prisma.user.count({
      where: { clubId: testClub.id },
    });

    console.log(`기본 클럽 사용자 수: ${defaultClubUsers}`);
    console.log(`테스트 클럽 사용자 수: ${testClubUsers}`);

    if (defaultClubUsers > 0 && testClubUsers > 0) {
      console.log("✅ 데이터 격리 정상: 각 클럽이 독립적인 데이터를 가지고 있습니다.\n");
    } else {
      console.warn("⚠️  데이터 격리에 문제가 있을 수 있습니다.\n");
    }

    // 5. 클럽별 사용자 조회 테스트
    console.log("5️⃣ 클럽별 사용자 조회 테스트...");
    
    const defaultClubUserList = await prisma.user.findMany({
      where: { clubId: defaultClub.id },
      take: 5,
    });
    
    const testClubUserList = await prisma.user.findMany({
      where: { clubId: testClub.id },
      take: 5,
    });

    console.log(`기본 클럽 사용자 (최대 5명):`);
    defaultClubUserList.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });

    console.log(`\n테스트 클럽 사용자 (최대 5명):`);
    testClubUserList.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });

    // 기본 클럽과 테스트 클럽의 사용자가 다른지 확인
    const defaultClubUserIds = new Set(defaultClubUserList.map(u => u.id));
    const testClubUserIds = new Set(testClubUserList.map(u => u.id));
    const hasOverlap = [...defaultClubUserIds].some(id => testClubUserIds.has(id));

    if (!hasOverlap) {
      console.log("\n✅ 데이터 격리 확인: 두 클럽의 사용자가 완전히 분리되어 있습니다.");
    } else {
      console.warn("\n⚠️  데이터 격리 문제: 두 클럽의 사용자가 겹칩니다.");
    }

    console.log("\n✅ 클럽 데이터 격리 테스트 완료!");

  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testClubIsolation()
  .then(() => {
    console.log("\n✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });

