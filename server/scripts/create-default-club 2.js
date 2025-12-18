/**
 * 기본 클럽 생성 스크립트
 * 
 * 멀티 테넌트 전환 전에 기본 클럽을 생성하고
 * 모든 기존 데이터에 clubId를 할당합니다.
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

async function createDefaultClub() {
  try {
    console.log("🚀 기본 클럽 생성 및 데이터 마이그레이션 시작...\n");

    // 1. 기본 클럽 생성 (이미 있으면 스킵)
    console.log("1️⃣ 기본 클럽 생성 중...");
    
    // clubId가 null인 데이터가 있는지 확인
    const usersWithoutClub = await prisma.user.findFirst({
      where: { clubId: null },
    });

    if (!usersWithoutClub) {
      console.log("✅ 모든 사용자가 이미 clubId를 가지고 있습니다.");
      console.log("   멀티 테넌트 모드가 이미 활성화된 것 같습니다.");
      return;
    }

    // 기본 클럽 생성
    console.log("📝 기본 클럽 생성 중...");
    let defaultClub = await prisma.club.findUnique({
      where: { subdomain: "default" },
    });

    if (!defaultClub) {
      defaultClub = await prisma.club.create({
        data: {
          name: process.env.CLUB_NAME || "Good Morning Club",
          subdomain: "default",
        },
      });
      console.log(`✅ 기본 클럽 생성 완료: ${defaultClub.id} (${defaultClub.name})`);
    } else {
      console.log(`✅ 기본 클럽 이미 존재: ${defaultClub.id} (${defaultClub.name})`);
    }

    const defaultClubId = defaultClub.id;

    // 2. 모든 사용자에 clubId 할당
    console.log("2️⃣ 사용자 데이터 마이그레이션 중...");
    const usersWithoutClubCount = await prisma.user.count({
      where: { clubId: null },
    });

    if (usersWithoutClubCount > 0) {
      // Prisma는 clubId가 String?이므로 직접 업데이트 가능
      // 하지만 Club 모델이 없으므로 임시로 문자열 ID 사용
      await prisma.$executeRaw`
        UPDATE users 
        SET "clubId" = ${defaultClubId}::text 
        WHERE "clubId" IS NULL
      `;
      console.log(`✅ ${usersWithoutClubCount}명의 사용자에 clubId 할당 완료`);
    } else {
      console.log("✅ 모든 사용자가 이미 clubId를 가지고 있습니다.");
    }

    // 3. 모든 세션에 clubId 할당
    console.log("\n3️⃣ 세션 데이터 마이그레이션 중...");
    const sessionsWithoutClubCount = await prisma.session.count({
      where: { clubId: null },
    });

    if (sessionsWithoutClubCount > 0) {
      await prisma.$executeRaw`
        UPDATE sessions 
        SET "clubId" = ${defaultClubId}::text 
        WHERE "clubId" IS NULL
      `;
      console.log(`✅ ${sessionsWithoutClubCount}개의 세션에 clubId 할당 완료`);
    } else {
      console.log("✅ 모든 세션이 이미 clubId를 가지고 있습니다.");
    }

    // 4. 모든 경기에 clubId 할당
    console.log("\n4️⃣ 경기 데이터 마이그레이션 중...");
    const matchesWithoutClubCount = await prisma.match.count({
      where: { clubId: null },
    });

    if (matchesWithoutClubCount > 0) {
      await prisma.$executeRaw`
        UPDATE matches 
        SET "clubId" = ${defaultClubId}::text 
        WHERE "clubId" IS NULL
      `;
      console.log(`✅ ${matchesWithoutClubCount}개의 경기에 clubId 할당 완료`);
    } else {
      console.log("✅ 모든 경기가 이미 clubId를 가지고 있습니다.");
    }

    // 5. 검증
    console.log("\n5️⃣ 마이그레이션 검증 중...");
    const remainingUsers = await prisma.user.count({
      where: { clubId: null },
    });
    const remainingSessions = await prisma.session.count({
      where: { clubId: null },
    });
    const remainingMatches = await prisma.match.count({
      where: { clubId: null },
    });

    if (remainingUsers === 0 && remainingSessions === 0 && remainingMatches === 0) {
      console.log("✅ 모든 데이터가 성공적으로 마이그레이션되었습니다!");
      console.log(`\n📝 기본 클럽 ID: ${defaultClubId}`);
      console.log("   이 ID를 .env 파일의 DEFAULT_CLUB_ID에 저장하세요.");
    } else {
      console.warn("⚠️  일부 데이터가 마이그레이션되지 않았습니다:");
      console.warn(`   - 사용자: ${remainingUsers}개`);
      console.warn(`   - 세션: ${remainingSessions}개`);
      console.warn(`   - 경기: ${remainingMatches}개`);
    }

    console.log("\n✅ 기본 클럽 생성 및 데이터 마이그레이션 완료!");
    console.log("\n다음 단계:");
    console.log("1. .env 파일에 DEFAULT_CLUB_ID 설정");
    console.log("2. Prisma 스키마에서 Club 모델 활성화");
    console.log("3. prisma db push 실행");

  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultClub()
  .then(() => {
    console.log("\n✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });

