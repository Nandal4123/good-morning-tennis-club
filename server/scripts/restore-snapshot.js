import { createPrismaClient } from "./create-prisma-client.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { file: null, yes: false, noPrebackup: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") args.file = argv[i + 1];
    if (a === "--yes") args.yes = true;
    if (a === "--no-prebackup") args.noPrebackup = true;
  }
  return args;
}

function resolveLatestSnapshotDbFile() {
  // scripts/ 기준으로 projectRoot(=club-attendance) 를 안정적으로 찾는다.
  const projectRoot = path.join(__dirname, "..", "..");
  const snapshotsRoot = path.join(projectRoot, "snapshots");
  const pointerFile = path.join(snapshotsRoot, "snapshot-latest.txt");

  // 1) 포인터 파일이 있으면 우선 사용
  if (fs.existsSync(pointerFile)) {
    const snapshotDir = fs.readFileSync(pointerFile, "utf-8").trim();
    const dbFile = path.join(snapshotDir, "db.json");
    if (fs.existsSync(dbFile)) return dbFile;
  }

  // 2) 없으면 디렉토리 스캔해서 가장 최신 폴더 선택
  if (!fs.existsSync(snapshotsRoot)) {
    throw new Error(`Snapshots directory not found: ${snapshotsRoot}`);
  }

  const entries = fs
    .readdirSync(snapshotsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("snapshot-"))
    .map((e) => {
      const full = path.join(snapshotsRoot, e.name);
      const stat = fs.statSync(full);
      return { name: e.name, full, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  const latest = entries[0];
  if (!latest) {
    throw new Error(`No snapshot directories found in: ${snapshotsRoot}`);
  }

  const dbFile = path.join(latest.full, "db.json");
  if (!fs.existsSync(dbFile)) {
    throw new Error(`db.json not found in latest snapshot dir: ${latest.full}`);
  }
  return dbFile;
}

function resolveFileOrLatest(filePath) {
  if (!filePath) {
    return resolveLatestSnapshotDbFile();
  }
  const p = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);
  if (!fs.existsSync(p)) throw new Error(`Backup file not found: ${p}`);
  return p;
}

function timestampId() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
}

async function writePreRestoreBackup(prisma) {
  // server/scripts -> club-attendance
  const projectRoot = path.join(__dirname, "..", "..");
  const backupDir = path.join(projectRoot, "snapshots", "pre-restore");
  fs.mkdirSync(backupDir, { recursive: true });

  const outFile = path.join(backupDir, `pre-restore-db-${timestampId()}.json`);

  const payload = {
    type: "pre-restore-backup",
    version: "1.0",
    createdAt: new Date().toISOString(),
    data: {
      clubs: await prisma.club.findMany(),
      users: await prisma.user.findMany(),
      sessions: await prisma.session.findMany(),
      matches: await prisma.match.findMany(),
      matchParticipants: await prisma.matchParticipant.findMany(),
      attendances: await prisma.attendance.findMany(),
      feedbacks: await prisma.feedback.findMany(),
    },
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf-8");
  return outFile;
}

async function main() {
  const { file, yes, noPrebackup } = parseArgs(process.argv.slice(2));
  const backupPath = resolveFileOrLatest(file);

  if (!yes) {
    console.error("❌ 중단: --yes 옵션이 필요합니다.");
    console.error("이 스크립트는 DB 데이터를 삭제한 뒤 스냅샷으로 복구합니다.");
    console.error(
      `실행 예시: pnpm run db:restore-snapshot -- --file \"${backupPath}\" --yes`
    );
    console.error("최신 스냅샷으로 복구하려면 --file 없이 실행할 수도 있습니다:");
    console.error("  pnpm run db:restore-snapshot -- --yes");
    console.error("\n옵션:");
    console.error("  --no-prebackup  : 복구 직전 자동 2중 백업(pre-restore)을 생략(권장 X)");
    process.exit(1);
  }

  const raw = fs.readFileSync(backupPath, "utf-8");
  const payload = JSON.parse(raw);

  if (!payload || payload.type !== "snapshot" || !payload.data) {
    throw new Error("Invalid snapshot format (expected type=snapshot)");
  }

  const prisma = createPrismaClient();

  try {
    console.log("🧯 Snapshot 복구 시작");
    console.log("📄 Snapshot file:", backupPath);

    // 0) 안전장치: 복구 직전 현재 DB를 2중 백업
    if (!noPrebackup) {
      console.log("\n0) 안전장치: 복구 직전 DB 2중 백업(pre-restore) 생성 중...");
      try {
        const pre = await writePreRestoreBackup(prisma);
        console.log("✅ pre-restore 백업 생성:", pre);
      } catch (e) {
        console.error("❌ pre-restore 백업 생성 실패:", e?.message || e);
        console.error("안전을 위해 복구를 중단합니다. (필요 시 --no-prebackup 사용 가능)");
        process.exit(1);
      }
    } else {
      console.log("\n0) pre-restore 백업 생략(--no-prebackup)");
    }

    // 1) wipe existing data (order matters)
    console.log("\n1) 기존 데이터 삭제 중...");
    await prisma.feedback.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.matchParticipant.deleteMany();
    await prisma.match.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    await prisma.club.deleteMany();
    console.log("✅ 기존 데이터 삭제 완료");

    // 2) restore data (order matters)
    console.log("\n2) 스냅샷 데이터 복구 중...");
    const d = payload.data;

    if (Array.isArray(d.clubs) && d.clubs.length > 0) {
      await prisma.club.createMany({ data: d.clubs, skipDuplicates: false });
      console.log(`✅ clubs: ${d.clubs.length}`);
    } else {
      console.log("⚠️ clubs: 0 (스냅샷에 없음)");
    }

    if (Array.isArray(d.users) && d.users.length > 0) {
      await prisma.user.createMany({ data: d.users, skipDuplicates: false });
      console.log(`✅ users: ${d.users.length}`);
    } else {
      console.log("⚠️ users: 0");
    }

    if (Array.isArray(d.sessions) && d.sessions.length > 0) {
      await prisma.session.createMany({ data: d.sessions, skipDuplicates: false });
      console.log(`✅ sessions: ${d.sessions.length}`);
    } else {
      console.log("⚠️ sessions: 0");
    }

    if (Array.isArray(d.matches) && d.matches.length > 0) {
      await prisma.match.createMany({ data: d.matches, skipDuplicates: false });
      console.log(`✅ matches: ${d.matches.length}`);
    } else {
      console.log("⚠️ matches: 0");
    }

    if (Array.isArray(d.matchParticipants) && d.matchParticipants.length > 0) {
      await prisma.matchParticipant.createMany({
        data: d.matchParticipants,
        skipDuplicates: false,
      });
      console.log(`✅ matchParticipants: ${d.matchParticipants.length}`);
    } else {
      console.log("⚠️ matchParticipants: 0");
    }

    if (Array.isArray(d.attendances) && d.attendances.length > 0) {
      await prisma.attendance.createMany({
        data: d.attendances,
        skipDuplicates: false,
      });
      console.log(`✅ attendances: ${d.attendances.length}`);
    } else {
      console.log("⚠️ attendances: 0");
    }

    if (Array.isArray(d.feedbacks) && d.feedbacks.length > 0) {
      await prisma.feedback.createMany({
        data: d.feedbacks,
        skipDuplicates: false,
      });
      console.log(`✅ feedbacks: ${d.feedbacks.length}`);
    } else {
      console.log("⚠️ feedbacks: 0");
    }

    console.log("\n🎉 Snapshot 복구 완료");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ 복구 실패:", e);
  process.exit(1);
});


