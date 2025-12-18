import { createPrismaClient } from "./create-prisma-client.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = createPrismaClient();

function timestampId() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function safeQuery(fn, fallbackValue, label) {
  try {
    return await fn();
  } catch (e) {
    console.warn(`⚠️  Snapshot warning: failed to fetch ${label}:`, e?.message || e);
    return fallbackValue;
  }
}

async function exportDatabaseJson(outFile) {
  const data = {
    clubs: await safeQuery(
      () =>
        prisma.club.findMany({
          select: {
            id: true,
            name: true,
            subdomain: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      [],
      "clubs"
    ),
    users: await safeQuery(
      () =>
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tennisLevel: true,
            goals: true,
            languagePref: true,
            profileMetadata: true,
            clubId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      [],
      "users"
    ),
    sessions: await safeQuery(
      () =>
        prisma.session.findMany({
          select: {
            id: true,
            date: true,
            description: true,
            clubId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      [],
      "sessions"
    ),
    matches: await safeQuery(
      () =>
        prisma.match.findMany({
          select: {
            id: true,
            date: true,
            type: true,
            createdAt: true,
            createdBy: true,
            clubId: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      [],
      "matches"
    ),
    matchParticipants: await safeQuery(
      () =>
        prisma.matchParticipant.findMany({
          select: {
            id: true,
            matchId: true,
            userId: true,
            team: true,
            score: true,
          },
          orderBy: { id: "asc" },
        }),
      [],
      "matchParticipants"
    ),
    attendances: await safeQuery(
      () =>
        prisma.attendance.findMany({
          select: {
            id: true,
            userId: true,
            sessionId: true,
            date: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      [],
      "attendances"
    ),
    feedbacks: await safeQuery(
      () =>
        prisma.feedback.findMany({
          select: {
            id: true,
            userId: true,
            date: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      [],
      "feedbacks"
    ),
  };

  const statistics = {
    clubCount: await safeQuery(() => prisma.club.count(), 0, "clubCount"),
    userCount: await safeQuery(() => prisma.user.count(), 0, "userCount"),
    sessionCount: await safeQuery(() => prisma.session.count(), 0, "sessionCount"),
    attendanceCount: await safeQuery(() => prisma.attendance.count(), 0, "attendanceCount"),
    matchCount: await safeQuery(() => prisma.match.count(), 0, "matchCount"),
    matchParticipantCount: await safeQuery(
      () => prisma.matchParticipant.count(),
      0,
      "matchParticipantCount"
    ),
    feedbackCount: await safeQuery(() => prisma.feedback.count(), 0, "feedbackCount"),
  };

  const payload = {
    type: "snapshot",
    version: "1.0",
    createdAt: new Date().toISOString(),
    data,
    statistics,
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf-8");
  return payload;
}

function createCodeArchive(rootDir, outTarGz) {
  // macOS/linux 환경의 tar 사용 (로컬 개발/운영 환경 기준)
  // node_modules, snapshots 등은 제외
  execFileSync(
    "tar",
    [
      "-czf",
      outTarGz,
      "--exclude",
      "node_modules",
      "--exclude",
      "dist",
      "--exclude",
      ".git",
      "--exclude",
      "snapshots",
      "-C",
      rootDir,
      ".",
    ],
    { stdio: "inherit" }
  );
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function sha256String(s) {
  return crypto.createHash("sha256").update(s, "utf-8").digest("hex");
}

function writeChecksums(snapshotDir, files) {
  const lines = files.map((f) => {
    const abs = path.join(snapshotDir, f);
    const sum = sha256File(abs);
    return `${sum}  ${f}`;
  });
  const out = path.join(snapshotDir, "SHA256SUMS.txt");
  fs.writeFileSync(out, lines.join("\n") + "\n", "utf-8");
  return out;
}

async function main() {
  const id = timestampId();

  // club-attendance/server/scripts -> club-attendance
  const projectRoot = path.join(__dirname, "..", "..");
  const snapshotsRoot = path.join(projectRoot, "snapshots");
  const snapshotDir = path.join(snapshotsRoot, `snapshot-${id}`);
  const latestPointerFile = path.join(snapshotsRoot, "snapshot-latest.txt");

  ensureDir(snapshotDir);

  const dbFile = path.join(snapshotDir, "db.json");
  const codeFile = path.join(snapshotDir, "code.tar.gz");
  const readmeFile = path.join(snapshotDir, "RESTORE_GUIDE.md");
  const checksumFile = path.join(snapshotDir, "SHA256SUMS.txt");
  const checksumsFile = path.join(snapshotDir, "checksums.sha256");
  const manifestFile = path.join(snapshotDir, "manifest.json");

  console.log("🧰 Snapshot 시작");
  console.log("📁 Snapshot dir:", snapshotDir);

  try {
    console.log("\n1) DB 스냅샷 생성 중...");
    const payload = await exportDatabaseJson(dbFile);
    console.log("✅ DB 스냅샷 완료:", dbFile);
    console.log("📊 통계:", payload.statistics);

    console.log("\n2) 코드 아카이브 생성 중...");
    createCodeArchive(projectRoot, codeFile);
    console.log("✅ 코드 아카이브 완료:", codeFile);

    console.log("\n3) 무결성(체크섬) 생성 중...");
    const schemaPath = path.join(projectRoot, "server", "prisma", "schema.prisma");
    const schemaContent = fs.existsSync(schemaPath)
      ? fs.readFileSync(schemaPath, "utf-8")
      : null;

    const dbSha = sha256File(dbFile);
    const codeSha = sha256File(codeFile);
    const schemaSha = schemaContent ? sha256String(schemaContent) : null;

    const manifest = {
      type: "snapshot-manifest",
      version: "1.0",
      snapshotId: id,
      createdAt: new Date().toISOString(),
      paths: {
        snapshotDir,
        dbFile,
        codeFile,
      },
      checksums: {
        "db.json": `sha256:${dbSha}`,
        "code.tar.gz": `sha256:${codeSha}`,
        ...(schemaSha ? { "server/prisma/schema.prisma": `sha256:${schemaSha}` } : {}),
      },
      runtime: {
        node: process.version,
      },
    };

    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf-8");
    fs.writeFileSync(
      checksumsFile,
      [
        `${dbSha}  db.json`,
        `${codeSha}  code.tar.gz`,
        ...(schemaSha ? [`${schemaSha}  server/prisma/schema.prisma`] : []),
        "",
      ].join("\n"),
      "utf-8"
    );
    console.log("✅ 체크섬 파일:", checksumsFile);
    console.log("✅ 매니페스트:", manifestFile);

    const guide = `# Snapshot Restore Guide

이 폴더는 특정 시점의 **DB 데이터 + 코드** 스냅샷입니다.

## 포함 파일
- \`db.json\`: Prisma 기반 DB 덤프(JSON)
- \`code.tar.gz\`: 코드 아카이브(대용량 제외: node_modules/dist/snapshots/.git)
- \`checksums.sha256\`: 무결성 검증용 SHA-256 체크섬
- \`manifest.json\`: 스냅샷 메타데이터(체크섬/버전/런타임)

## 복구(코드)
> 현재 작업 폴더를 덮어쓸 수 있으니, 복구는 별도 폴더에서 진행하는 것을 권장합니다.

\`\`\`bash
mkdir -p /tmp/club-attendance-restore
tar -xzf "${codeFile}" -C /tmp/club-attendance-restore
\`\`\`

## 복구(DB)
⚠️ 이 작업은 DB 데이터를 삭제한 뒤 스냅샷으로 다시 채웁니다.

\`\`\`bash
cd "${path.join(projectRoot, "server")}"
pnpm run db:restore-snapshot -- --file "${dbFile}" --yes
\`\`\`

## 검증(권장)
\`\`\`bash
cd "${path.join(projectRoot, "server")}"
pnpm run snapshot:verify -- --snapshot "${snapshotDir}"
\`\`\`

## 권장 순서
1) 코드 복구
2) DB 복구
3) 서버/클라이언트 재시작
`;

    fs.writeFileSync(readmeFile, guide, "utf-8");
    console.log("📝 복구 가이드 생성:", readmeFile);

    console.log("\n3) 스냅샷 무결성 체크섬 생성 중...");
    const sums = writeChecksums(snapshotDir, ["db.json", "code.tar.gz", "RESTORE_GUIDE.md"]);
    console.log("✅ 체크섬 파일 생성:", sums);

    // 최신 스냅샷 포인터 파일 업데이트 (경로를 몰라도 복구 가능하도록)
    try {
      fs.writeFileSync(latestPointerFile, snapshotDir, "utf-8");
      console.log("🔗 최신 스냅샷 포인터 업데이트:", latestPointerFile);
    } catch (e) {
      console.warn("⚠️ 최신 스냅샷 포인터 업데이트 실패:", e?.message || e);
    }

    console.log("\n🎉 Snapshot 완료!");
    console.log("👉 필요 시 이 디렉토리 전체를 안전한 곳(외장/클라우드)에 복사해 두세요.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Snapshot 실패:", e);
  process.exit(1);
});


