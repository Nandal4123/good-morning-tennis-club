/**
 * 2025-12-12 날짜의 출석 및 경기 데이터 상세 확인
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

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

async function check2025_12_12Data() {
  try {
    console.log("🔍 2025-12-12 데이터 상세 확인\n");

    // 날짜 범위 설정 (2025-12-12 KST 기준)
    const dayStart = new Date("2025-12-12T00:00:00+09:00");
    const nextDayStart = new Date("2025-12-12T23:59:59.999+09:00");
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    // 2025-12-12의 모든 출석 데이터
    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: dayStart,
          lt: nextDayStart,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        session: {
          select: { id: true, date: true, description: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`📊 2025-12-12 출석 기록: ${attendances.length}개\n`);

    if (attendances.length > 0) {
      console.log("=".repeat(80));
      console.log("👥 출석자 목록:\n");
      
      for (let i = 0; i < attendances.length; i++) {
        const att = attendances[i];
        console.log(`${i + 1}. ${att.user.name} (${att.user.email})`);
        console.log(`   출석 ID: ${att.id}`);
        console.log(`   사용자 ID: ${att.user.id}`);
        console.log(`   세션 ID: ${att.session.id}`);
        console.log(`   출석 날짜: ${att.date.toISOString()}`);
        console.log(`   생성 시간: ${att.createdAt.toISOString()}`);
        console.log("");
      }
    }

    // 2025-12-12의 모든 경기 데이터
    const matches = await prisma.match.findMany({
      where: {
        date: {
          gte: dayStart,
          lt: nextDayStart,
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log("=".repeat(80));
    console.log(`🏆 2025-12-12 경기 기록: ${matches.length}개\n`);

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        console.log(`경기 ${i + 1}:`);
        console.log(`  경기 ID: ${match.id}`);
        console.log(`  경기 날짜: ${match.date.toISOString()}`);
        console.log(`  경기 타입: ${match.type}`);
        console.log(`  참가자 수: ${match.participants.length}명\n`);
        
        console.log("  참가자 목록:");
        for (const participant of match.participants) {
          console.log(`    - ${participant.user.name} (${participant.user.email})`);
          console.log(`      팀: ${participant.team}, 점수: ${participant.score}`);
          console.log(`      사용자 ID: ${participant.user.id}`);
        }
        console.log("");
      }
    }

    // 세션 데이터
    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: dayStart,
          lt: nextDayStart,
        },
      },
      include: {
        attendances: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    console.log("=".repeat(80));
    console.log(`📅 2025-12-12 세션 기록: ${sessions.length}개\n`);

    if (sessions.length > 0) {
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        console.log(`세션 ${i + 1}:`);
        console.log(`  세션 ID: ${session.id}`);
        console.log(`  세션 날짜: ${session.date.toISOString()}`);
        console.log(`  설명: ${session.description || "(없음)"}`);
        console.log(`  출석 수: ${session.attendances.length}개\n`);
        
        if (session.attendances.length > 0) {
          console.log("  출석자:");
          for (const att of session.attendances) {
            console.log(`    - ${att.user.name} (${att.user.email})`);
          }
        }
        console.log("");
      }
    }

    // 경기 참가자와 출석자 비교
    console.log("=".repeat(80));
    console.log("🔍 경기 참가자 vs 출석자 비교:\n");

    const matchParticipantIds = new Set();
    for (const match of matches) {
      for (const participant of match.participants) {
        matchParticipantIds.add(participant.userId);
      }
    }

    const attendanceUserIds = new Set();
    for (const attendance of attendances) {
      attendanceUserIds.add(attendance.userId);
    }

    console.log(`경기 참가자 수: ${matchParticipantIds.size}명`);
    console.log(`출석 기록 수: ${attendanceUserIds.size}명\n`);

    // 경기에 참가했지만 출석이 없는 경우
    const missingAttendance = [];
    for (const userId of matchParticipantIds) {
      if (!attendanceUserIds.has(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        missingAttendance.push({ userId, user });
      }
    }

    // 출석이 있지만 경기에 참가하지 않은 경우
    const extraAttendance = [];
    for (const userId of attendanceUserIds) {
      if (!matchParticipantIds.has(userId)) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        extraAttendance.push({ userId, user });
      }
    }

    if (missingAttendance.length > 0) {
      console.log("⚠️  경기에 참가했지만 출석이 없는 사용자:");
      for (const { userId, user } of missingAttendance) {
        console.log(`  - ${user.name} (${user.email}) - ID: ${userId}`);
      }
      console.log("");
    }

    if (extraAttendance.length > 0) {
      console.log("⚠️  출석이 있지만 경기에 참가하지 않은 사용자:");
      for (const { userId, user } of extraAttendance) {
        console.log(`  - ${user.name} (${user.email}) - ID: ${userId}`);
      }
      console.log("");
    }

    if (missingAttendance.length === 0 && extraAttendance.length === 0) {
      console.log("✅ 경기 참가자와 출석자가 일치합니다.\n");
    }

  } catch (error) {
    console.error("❌ 오류 발생:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

check2025_12_12Data()
  .then(() => {
    console.log("✅ 확인 완료");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 확인 실패:", error);
    process.exit(1);
  });

