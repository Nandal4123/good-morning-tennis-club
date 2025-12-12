/**
 * 중복 출석 데이터 정리 스크립트
 * 
 * 같은 사용자가 같은 날짜에 여러 출석 기록이 있는 경우,
 * 가장 이른 세션의 출석만 남기고 나머지를 삭제합니다.
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

/**
 * 날짜를 KST 기준으로 하루 범위로 변환
 */
function getDayRange(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;
  
  const dayStart = new Date(dateString + "T00:00:00+09:00");
  const nextDayStart = new Date(dayStart);
  nextDayStart.setDate(nextDayStart.getDate() + 1);
  
  return { dayStart, nextDayStart };
}

/**
 * 중복 출석 정리
 */
async function cleanupDuplicateAttendances() {
  try {
    console.log("🔍 중복 출석 데이터 검색 중...");

    // 모든 출석 데이터 가져오기
    const allAttendances = await prisma.attendance.findMany({
      include: {
        user: {
          select: { id: true, name: true },
        },
        session: {
          select: { id: true, date: true },
        },
      },
      orderBy: [
        { userId: "asc" },
        { date: "asc" },
        { createdAt: "asc" },
      ],
    });

    console.log(`📊 총 출석 기록 수: ${allAttendances.length}`);

    // 사용자별, 날짜별로 그룹핑
    const groupedByUserAndDate = {};

    for (const attendance of allAttendances) {
      const date = new Date(attendance.date);
      const { dayStart, nextDayStart } = getDayRange(date);
      
      // 날짜 키 생성 (YYYY-MM-DD)
      const dateKey = `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, "0")}-${String(dayStart.getDate()).padStart(2, "0")}`;
      const key = `${attendance.userId}_${dateKey}`;

      if (!groupedByUserAndDate[key]) {
        groupedByUserAndDate[key] = [];
      }
      groupedByUserAndDate[key].push(attendance);
    }

    // 중복이 있는 그룹 찾기
    const duplicates = [];
    for (const [key, attendances] of Object.entries(groupedByUserAndDate)) {
      if (attendances.length > 1) {
        duplicates.push({
          key,
          attendances,
        });
      }
    }

    console.log(`⚠️  중복 출석 그룹 수: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log("✅ 중복 출석이 없습니다!");
      return;
    }

    // 중복 출석 정리
    let totalDeleted = 0;
    let totalKept = 0;

    for (const { key, attendances } of duplicates) {
      // 가장 이른 세션의 출석을 유지 (날짜 기준, 같으면 createdAt 기준)
      const sorted = attendances.sort((a, b) => {
        const dateDiff = new Date(a.session.date) - new Date(b.session.date);
        if (dateDiff !== 0) return dateDiff;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      const keepAttendance = sorted[0];
      const deleteAttendances = sorted.slice(1);

      console.log(
        `\n👤 사용자: ${keepAttendance.user.name} (${keepAttendance.user.id})`
      );
      console.log(`📅 날짜: ${key.split("_")[1]}`);
      console.log(`✅ 유지할 출석: ${keepAttendance.id} (세션: ${keepAttendance.session.id}, 날짜: ${keepAttendance.session.date})`);
      console.log(`❌ 삭제할 출석: ${deleteAttendances.length}개`);

      // 중복 출석 삭제
      for (const attendance of deleteAttendances) {
        await prisma.attendance.delete({
          where: { id: attendance.id },
        });
        console.log(`   - 삭제: ${attendance.id} (세션: ${attendance.session.id})`);
        totalDeleted++;
      }

      totalKept++;
    }

    console.log("\n📊 정리 결과:");
    console.log(`✅ 유지된 그룹: ${totalKept}개`);
    console.log(`❌ 삭제된 출석: ${totalDeleted}개`);
    console.log("✅ 중복 출석 정리 완료!");

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
cleanupDuplicateAttendances()
  .then(() => {
    console.log("\n✅ 스크립트 실행 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 스크립트 실행 실패:", error);
    process.exit(1);
  });

