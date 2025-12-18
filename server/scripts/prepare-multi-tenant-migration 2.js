/**
 * 멀티 테넌트 전환을 위한 마이그레이션 준비 스크립트
 * 
 * 이 스크립트는 MVP에서 멀티 테넌트로 전환할 때 실행합니다.
 * 모든 기존 데이터를 기본 클럽에 할당합니다.
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

async function prepareMultiTenantMigration() {
  try {
    console.log("🚀 멀티 테넌트 마이그레이션 준비 시작...\n");

    // 1. 기본 클럽 생성 (이미 있으면 스킵)
    console.log("1️⃣ 기본 클럽 생성 중...");
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
      console.log(`✅ 기본 클럽 생성 완료: ${defaultClub.id}`);
    } else {
      console.log(`✅ 기본 클럽 이미 존재: ${defaultClub.id}`);
    }

    // 2. 모든 사용자에 clubId 할당
    console.log("\n2️⃣ 사용자 데이터 마이그레이션 중...");
    const usersWithoutClub = await prisma.user.findMany({
      where: { clubId: null },
    });

    if (usersWithoutClub.length > 0) {
      const updateResult = await prisma.user.updateMany({
        where: { clubId: null },
        data: { clubId: defaultClub.id },
      });
      console.log(`✅ ${updateResult.count}명의 사용자에 clubId 할당 완료`);
    } else {
      console.log("✅ 모든 사용자가 이미 clubId를 가지고 있습니다.");
    }

    // 3. 모든 세션에 clubId 할당
    console.log("\n3️⃣ 세션 데이터 마이그레이션 중...");
    const sessionsWithoutClub = await prisma.session.findMany({
      where: { clubId: null },
    });

    if (sessionsWithoutClub.length > 0) {
      const updateResult = await prisma.session.updateMany({
        where: { clubId: null },
        data: { clubId: defaultClub.id },
      });
      console.log(`✅ ${updateResult.count}개의 세션에 clubId 할당 완료`);
    } else {
      console.log("✅ 모든 세션이 이미 clubId를 가지고 있습니다.");
    }

    // 4. 모든 경기에 clubId 할당
    console.log("\n4️⃣ 경기 데이터 마이그레이션 중...");
    const matchesWithoutClub = await prisma.match.findMany({
      where: { clubId: null },
    });

    if (matchesWithoutClub.length > 0) {
      const updateResult = await prisma.match.updateMany({
        where: { clubId: null },
        data: { clubId: defaultClub.id },
      });
      console.log(`✅ ${updateResult.count}개의 경기에 clubId 할당 완료`);
    } else {
      console.log("✅ 모든 경기가 이미 clubId를 가지고 있습니다.");
    }

    // 5. 검증
    console.log("\n5️⃣ 마이그레이션 검증 중...");
    const usersWithNullClub = await prisma.user.count({
      where: { clubId: null },
    });
    const sessionsWithNullClub = await prisma.session.count({
      where: { clubId: null },
    });
    const matchesWithNullClub = await prisma.match.count({
      where: { clubId: null },
    });

    if (
      usersWithNullClub === 0 &&
      sessionsWithNullClub === 0 &&
      matchesWithNullClub === 0
    ) {
      console.log("✅ 모든 데이터가 성공적으로 마이그레이션되었습니다!");
    } else {
      console.warn("⚠️  일부 데이터가 마이그레이션되지 않았습니다:");
      console.warn(`   - 사용자: ${usersWithNullClub}개`);
      console.warn(`   - 세션: ${sessionsWithNullClub}개`);
      console.warn(`   - 경기: ${matchesWithNullClub}개`);
    }

    console.log("\n✅ 멀티 테넌트 마이그레이션 준비 완료!");
    console.log("\n다음 단계:");
    console.log("1. Prisma 스키마에서 Club 모델 주석 해제");
    console.log("2. 모든 모델의 clubId를 필수로 변경");
    console.log("3. unique 제약조건 및 인덱스 추가");
    console.log("4. prisma db push 실행");
    console.log("5. MULTI_TENANT_MODE=true 설정");
  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

prepareMultiTenantMigration()
  .then(() => {
    console.log("\n✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });

