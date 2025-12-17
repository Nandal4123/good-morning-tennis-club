/**
 * default(굿모닝) 클럽 호환 데이터 정리 스크립트
 *
 * 목적:
 * - 멀티 테넌트 전환 전에 생성된 clubId=NULL 레코드를 기본 클럽(default)로 채움
 *
 * 왜 필요하나?
 * - 멀티 테넌트 모드에서는 대부분의 조회가 clubId로 필터링됨
 * - 과거 데이터가 NULL이면 굿모닝(=default) 화면에서 일부 데이터가 누락될 수 있음
 *
 * 실행:
 * - (로컬) `pnpm --filter server node scripts/backfill-default-clubid.js`
 * - (서버) Render Shell에서 `node scripts/backfill-default-clubid.js`
 */

import { createPrismaClient } from "./create-prisma-client.js";

const prisma = createPrismaClient();

async function main() {
  const dryRun = (process.env.DRY_RUN || "").toLowerCase() === "true";

  console.log("🧹 backfill-default-clubid 시작");
  console.log(`- DRY_RUN: ${dryRun ? "true (미적용)" : "false (적용)"}`);

  // 1) default 클럽 확인/생성
  let defaultClub = await prisma.club.findUnique({
    where: { subdomain: "default" },
  });

  if (!defaultClub) {
    if (dryRun) {
      console.log("⚠️ default 클럽이 없습니다. (DRY_RUN이라 생성하지 않음)");
      return;
    }
    defaultClub = await prisma.club.create({
      data: {
        name: process.env.CLUB_NAME || "Good Morning Club",
        subdomain: "default",
      },
    });
    console.log(`✅ default 클럽 생성: ${defaultClub.id}`);
  } else {
    console.log(`✅ default 클럽 확인: ${defaultClub.id}`);
  }

  // 2) NULL clubId 카운트
  const [usersNull, sessionsNull, matchesNull] = await Promise.all([
    prisma.user.count({ where: { clubId: null } }),
    prisma.session.count({ where: { clubId: null } }),
    prisma.match.count({ where: { clubId: null } }),
  ]);

  console.log("📊 NULL clubId 현황");
  console.log(`- user: ${usersNull}`);
  console.log(`- session: ${sessionsNull}`);
  console.log(`- match: ${matchesNull}`);

  if (dryRun) {
    console.log("✅ DRY_RUN 종료 (업데이트 미실행)");
    return;
  }

  // 3) 업데이트
  const [u, s, m] = await Promise.all([
    prisma.user.updateMany({
      where: { clubId: null },
      data: { clubId: defaultClub.id },
    }),
    prisma.session.updateMany({
      where: { clubId: null },
      data: { clubId: defaultClub.id },
    }),
    prisma.match.updateMany({
      where: { clubId: null },
      data: { clubId: defaultClub.id },
    }),
  ]);

  console.log("✅ backfill 완료");
  console.log(`- user updated: ${u.count}`);
  console.log(`- session updated: ${s.count}`);
  console.log(`- match updated: ${m.count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("❌ backfill-default-clubid 실패:", e);
    await prisma.$disconnect();
    process.exit(1);
  });


