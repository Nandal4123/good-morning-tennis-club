/**
 * 중복 출석 데이터 확인 스크립트 (상세 분석)
 * 
 * 실제 데이터를 확인하여 중복 출석이 있는지 상세히 분석합니다.
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
 * 날짜를 YYYY-MM-DD 형식으로 변환 (KST 기준)
 */
function formatDateKST(date) {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 중복 출석 확인 및 상세 분석
 */
async function checkDuplicateAttendances() {
  try {
    console.log("🔍 중복 출석 데이터 상세 분석 중...\n");

    // 모든 출석 데이터 가져오기
    const allAttendances = await prisma.attendance.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        session: {
          select: { id: true, date: true, description: true },
        },
      },
      orderBy: [
        { userId: "asc" },
        { date: "asc" },
        { createdAt: "asc" },
      ],
    });

    console.log(`📊 총 출석 기록 수: ${allAttendances.length}\n`);

    // 사용자별, 날짜별로 그룹핑
    const groupedByUserAndDate = {};

    for (const attendance of allAttendances) {
      const date = new Date(attendance.date);
      const dateKey = formatDateKST(date);
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

    console.log(`⚠️  중복 출석 그룹 수: ${duplicates.length}\n`);

    if (duplicates.length === 0) {
      console.log("✅ 중복 출석이 없습니다!\n");
      
      // 모든 출석 데이터를 날짜별로 정리하여 출력
      console.log("📋 전체 출석 데이터 요약:\n");
      const summaryByDate = {};
      
      for (const attendance of allAttendances) {
        const dateKey = formatDateKST(new Date(attendance.date));
        if (!summaryByDate[dateKey]) {
          summaryByDate[dateKey] = [];
        }
        summaryByDate[dateKey].push(attendance);
      }
      
      for (const [date, attendances] of Object.entries(summaryByDate).sort()) {
        const uniqueUsers = new Set(attendances.map(a => a.userId));
        console.log(`📅 ${date}: ${attendances.length}개 출석 기록, ${uniqueUsers.size}명 사용자`);
      }
      
      return;
    }

    // 중복 출석 상세 정보 출력
    console.log("=".repeat(80));
    console.log("⚠️  중복 출석 상세 정보\n");
    
    for (const { key, attendances } of duplicates) {
      const [userId, dateKey] = key.split("_");
      const user = attendances[0].user;
      
      console.log(`👤 사용자: ${user.name} (${user.email})`);
      console.log(`   사용자 ID: ${userId}`);
      console.log(`📅 날짜: ${dateKey}`);
      console.log(`   중복 출석 수: ${attendances.length}개\n`);
      
      // 각 출석 기록 상세 정보
      for (let i = 0; i < attendances.length; i++) {
        const att = attendances[i];
        const sessionDate = formatDateKST(new Date(att.session.date));
        const attendanceDate = formatDateKST(new Date(att.date));
        
        console.log(`   ${i + 1}. 출석 ID: ${att.id}`);
        console.log(`      세션 ID: ${att.session.id}`);
        console.log(`      세션 날짜: ${sessionDate} (${att.session.date.toISOString()})`);
        console.log(`      출석 날짜: ${attendanceDate} (${att.date.toISOString()})`);
        console.log(`      생성 시간: ${att.createdAt.toISOString()}`);
        console.log(`      상태: ${att.status}`);
        if (att.session.description) {
          console.log(`      세션 설명: ${att.session.description}`);
        }
        console.log("");
      }
      
      console.log("-".repeat(80));
      console.log("");
    }

    console.log("\n📊 중복 출석 요약:");
    console.log(`   총 중복 그룹: ${duplicates.length}개`);
    let totalDuplicates = 0;
    for (const { attendances } of duplicates) {
      totalDuplicates += attendances.length - 1; // 유지할 1개 제외
    }
    console.log(`   삭제 가능한 중복 출석: ${totalDuplicates}개`);
    console.log(`   유지할 출석: ${duplicates.length}개\n`);

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
checkDuplicateAttendances()
  .then(() => {
    console.log("✅ 확인 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 확인 실패:", error);
    process.exit(1);
  });

