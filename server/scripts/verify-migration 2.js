/**
 * 마이그레이션 검증 스크립트
 * 
 * 멀티 테넌트 마이그레이션 후 데이터 상태를 검증합니다.
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

async function verifyMigration() {
  try {
    console.log("🔍 마이그레이션 검증 시작...\n");

    // 1. 기본 클럽 확인
    console.log("1️⃣ 기본 클럽 확인 중...");
    const defaultClub = await prisma.club.findUnique({
      where: { subdomain: "default" },
    });

    if (!defaultClub) {
      console.error("❌ 기본 클럽을 찾을 수 없습니다!");
      return;
    }

    console.log(`✅ 기본 클럽 발견: ${defaultClub.name} (ID: ${defaultClub.id})`);
    console.log(`   서브도메인: ${defaultClub.subdomain}\n`);

    // 2. 사용자 데이터 검증
    console.log("2️⃣ 사용자 데이터 검증 중...");
    const totalUsers = await prisma.user.count();
    const usersWithClub = await prisma.user.count({
      where: { clubId: defaultClub.id },
    });
    const usersWithoutClub = await prisma.user.count({
      where: { clubId: null },
    });

    console.log(`   전체 사용자: ${totalUsers}명`);
    console.log(`   클럽에 할당된 사용자: ${usersWithClub}명`);
    console.log(`   클럽 미할당 사용자: ${usersWithoutClub}명`);

    if (usersWithoutClub > 0) {
      console.warn(`   ⚠️  ${usersWithoutClub}명의 사용자가 클럽에 할당되지 않았습니다.`);
    } else {
      console.log("   ✅ 모든 사용자가 클럽에 할당되었습니다.\n");
    }

    // 3. 세션 데이터 검증
    console.log("3️⃣ 세션 데이터 검증 중...");
    const totalSessions = await prisma.session.count();
    const sessionsWithClub = await prisma.session.count({
      where: { clubId: defaultClub.id },
    });
    const sessionsWithoutClub = await prisma.session.count({
      where: { clubId: null },
    });

    console.log(`   전체 세션: ${totalSessions}개`);
    console.log(`   클럽에 할당된 세션: ${sessionsWithClub}개`);
    console.log(`   클럽 미할당 세션: ${sessionsWithoutClub}개`);

    if (sessionsWithoutClub > 0) {
      console.warn(`   ⚠️  ${sessionsWithoutClub}개의 세션이 클럽에 할당되지 않았습니다.`);
    } else {
      console.log("   ✅ 모든 세션이 클럽에 할당되었습니다.\n");
    }

    // 4. 경기 데이터 검증
    console.log("4️⃣ 경기 데이터 검증 중...");
    const totalMatches = await prisma.match.count();
    const matchesWithClub = await prisma.match.count({
      where: { clubId: defaultClub.id },
    });
    const matchesWithoutClub = await prisma.match.count({
      where: { clubId: null },
    });

    console.log(`   전체 경기: ${totalMatches}개`);
    console.log(`   클럽에 할당된 경기: ${matchesWithClub}개`);
    console.log(`   클럽 미할당 경기: ${matchesWithoutClub}개`);

    if (matchesWithoutClub > 0) {
      console.warn(`   ⚠️  ${matchesWithoutClub}개의 경기가 클럽에 할당되지 않았습니다.`);
    } else {
      console.log("   ✅ 모든 경기가 클럽에 할당되었습니다.\n");
    }

    // 5. 관계 검증
    console.log("5️⃣ 관계 검증 중...");
    const sampleUser = await prisma.user.findFirst({
      where: { clubId: defaultClub.id },
      include: {
        club: true,
      },
    });

    if (sampleUser && sampleUser.club) {
      console.log(`   ✅ 사용자-클럽 관계 정상: ${sampleUser.name} → ${sampleUser.club.name}`);
    } else {
      console.warn("   ⚠️  사용자-클럽 관계를 확인할 수 없습니다.");
    }

    const sampleSession = await prisma.session.findFirst({
      where: { clubId: defaultClub.id },
      include: {
        club: true,
      },
    });

    if (sampleSession && sampleSession.club) {
      console.log(`   ✅ 세션-클럽 관계 정상: 세션 ID ${sampleSession.id} → ${sampleSession.club.name}`);
    } else {
      console.warn("   ⚠️  세션-클럽 관계를 확인할 수 없습니다.");
    }

    const sampleMatch = await prisma.match.findFirst({
      where: { clubId: defaultClub.id },
      include: {
        club: true,
      },
    });

    if (sampleMatch && sampleMatch.club) {
      console.log(`   ✅ 경기-클럽 관계 정상: 경기 ID ${sampleMatch.id} → ${sampleMatch.club.name}\n`);
    } else {
      console.warn("   ⚠️  경기-클럽 관계를 확인할 수 없습니다.\n");
    }

    // 6. 최종 검증 결과
    console.log("6️⃣ 최종 검증 결과...");
    const hasIssues =
      usersWithoutClub > 0 || sessionsWithoutClub > 0 || matchesWithoutClub > 0;

    if (!hasIssues) {
      console.log("✅ 모든 데이터가 성공적으로 마이그레이션되었습니다!");
      console.log(`\n📝 기본 클럽 정보:`);
      console.log(`   ID: ${defaultClub.id}`);
      console.log(`   이름: ${defaultClub.name}`);
      console.log(`   서브도메인: ${defaultClub.subdomain}`);
      console.log(`\n✅ 마이그레이션 검증 완료!`);
    } else {
      console.warn("⚠️  일부 데이터에 문제가 있습니다. 위의 경고를 확인하세요.");
    }
  } catch (error) {
    console.error("❌ 검증 중 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration()
  .then(() => {
    console.log("\n✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });

