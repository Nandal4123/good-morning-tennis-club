/**
 * 게스트 사용자의 출석 기록 삭제 스크립트
 * 
 * 게스트 사용자(@guest.local 이메일 또는 👤 이름)의 출석 기록을 모두 삭제합니다.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupGuestAttendances() {
  try {
    console.log("🔍 게스트 사용자 출석 기록 검색 중...\n");

    // 게스트 사용자 찾기
    const guestUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: "@guest.local" } },
          { name: { startsWith: "👤" } },
        ],
      },
      select: { id: true, name: true, email: true },
    });

    console.log(`👥 게스트 사용자 수: ${guestUsers.length}명\n`);

    if (guestUsers.length === 0) {
      console.log("✅ 게스트 사용자가 없습니다!");
      return;
    }

    // 게스트 사용자 목록 출력
    console.log("게스트 사용자 목록:");
    for (const user of guestUsers) {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
    }
    console.log("");

    // 게스트 사용자의 출석 기록 찾기
    const guestUserIds = guestUsers.map((u) => u.id);
    const guestAttendances = await prisma.attendance.findMany({
      where: {
        userId: { in: guestUserIds },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        session: {
          select: { date: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📊 게스트 출석 기록 수: ${guestAttendances.length}개\n`);

    if (guestAttendances.length === 0) {
      console.log("✅ 게스트 출석 기록이 없습니다!");
      return;
    }

    // 날짜별로 그룹핑
    const attendancesByDate = {};
    for (const att of guestAttendances) {
      const date = new Date(att.date);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      
      if (!attendancesByDate[dateKey]) {
        attendancesByDate[dateKey] = [];
      }
      attendancesByDate[dateKey].push(att);
    }

    console.log("=".repeat(80));
    console.log("📅 날짜별 게스트 출석 기록:\n");

    for (const [date, attendances] of Object.entries(attendancesByDate).sort()) {
      console.log(`📅 ${date}: ${attendances.length}개`);
      for (const att of attendances) {
        console.log(`  - ${att.user.name} (${att.user.email})`);
        console.log(`    출석 ID: ${att.id}, 생성: ${att.createdAt.toISOString()}`);
      }
      console.log("");
    }

    // 삭제 확인
    console.log("=".repeat(80));
    console.log(`⚠️  총 ${guestAttendances.length}개의 게스트 출석 기록을 삭제합니다.\n`);

    // 게스트 출석 기록 삭제
    let deletedCount = 0;
    for (const attendance of guestAttendances) {
      await prisma.attendance.delete({
        where: { id: attendance.id },
      });
      console.log(`❌ 삭제: ${attendance.user.name} - ${attendance.id}`);
      deletedCount++;
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 정리 결과:");
    console.log(`✅ 삭제된 게스트 출석 기록: ${deletedCount}개`);
    console.log("✅ 게스트 출석 기록 정리 완료!");

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupGuestAttendances()
  .then(() => {
    console.log("\n✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });

