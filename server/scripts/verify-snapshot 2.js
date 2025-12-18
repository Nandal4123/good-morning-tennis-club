import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = { snapshotDir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--snapshot") args.snapshotDir = argv[i + 1];
  }
  return args;
}

function resolveLatestSnapshotDir(projectRoot) {
  const snapshotsRoot = path.join(projectRoot, "snapshots");
  const pointerFile = path.join(snapshotsRoot, "snapshot-latest.txt");

  if (fs.existsSync(pointerFile)) {
    const snapshotDir = fs.readFileSync(pointerFile, "utf-8").trim();
    if (snapshotDir && fs.existsSync(snapshotDir)) return snapshotDir;
  }

  if (!fs.existsSync(snapshotsRoot)) {
    throw new Error(`Snapshots directory not found: ${snapshotsRoot}`);
  }

  const entries = fs
    .readdirSync(snapshotsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("snapshot-"))
    .map((e) => {
      const full = path.join(snapshotsRoot, e.name);
      const stat = fs.statSync(full);
      return { full, mtimeMs: stat.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (!entries[0]) throw new Error(`No snapshots found in: ${snapshotsRoot}`);
  return entries[0].full;
}

function main() {
  const { snapshotDir } = parseArgs(process.argv.slice(2));
  const projectRoot = path.join(__dirname, "..", "..");

  const dir = snapshotDir
    ? path.isAbsolute(snapshotDir)
      ? snapshotDir
      : path.join(process.cwd(), snapshotDir)
    : resolveLatestSnapshotDir(projectRoot);

  const dbFile = path.join(dir, "db.json");
  const codeFile = path.join(dir, "code.tar.gz");
  const guideFile = path.join(dir, "RESTORE_GUIDE.md");
  const checksumFile = path.join(dir, "SHA256SUMS.txt");

  const missing = [];
  if (!fs.existsSync(dbFile)) missing.push("db.json");
  if (!fs.existsSync(codeFile)) missing.push("code.tar.gz");
  if (!fs.existsSync(guideFile)) missing.push("RESTORE_GUIDE.md");

  console.log("🔎 Snapshot 검증");
  console.log("📁 snapshot:", dir);

  if (missing.length > 0) {
    console.error("❌ 누락 파일:", missing.join(", "));
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(dbFile, "utf-8"));
  if (!payload || payload.type !== "snapshot" || !payload.data) {
    console.error("❌ db.json 포맷이 올바르지 않습니다 (type=snapshot 필요)");
    process.exit(1);
  }

  const stats = payload.statistics || {};
  console.log("✅ 파일 존재 확인 완료");
  console.log("🕒 createdAt:", payload.createdAt || "(unknown)");
  console.log("📊 statistics:", stats);

  // 기본 필드 유효성
  const requiredArrays = [
    "clubs",
    "users",
    "sessions",
    "matches",
    "matchParticipants",
    "attendances",
    "feedbacks",
  ];
  const missingArrays = requiredArrays.filter((k) => !Array.isArray(payload.data[k]));
  if (missingArrays.length > 0) {
    console.error("❌ db.json data 배열 누락:", missingArrays.join(", "));
    process.exit(1);
  }

  console.log("✅ db.json 구조 검증 완료");

  // 체크섬이 있으면 검증 (완벽 복구를 위한 무결성 보장)
  if (fs.existsSync(checksumFile)) {
    console.log("\n🔐 SHA256 체크섬 검증 중...");
    const lines = fs
      .readFileSync(checksumFile, "utf-8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const sha256File = (p) => {
      const buf = fs.readFileSync(p);
      return crypto.createHash("sha256").update(buf).digest("hex");
    };

    const errors = [];
    for (const line of lines) {
      const m = line.match(/^([a-f0-9]{64})\s{2}(.+)$/i);
      if (!m) continue;
      const expected = m[1].toLowerCase();
      const rel = m[2];
      const abs = path.join(dir, rel);
      if (!fs.existsSync(abs)) {
        errors.push(`missing file for checksum: ${rel}`);
        continue;
      }
      const actual = sha256File(abs).toLowerCase();
      if (actual !== expected) {
        errors.push(`checksum mismatch: ${rel}`);
      }
    }

    if (errors.length > 0) {
      console.error("❌ 체크섬 검증 실패:");
      for (const e of errors) console.error(" -", e);
      process.exit(1);
    }
    console.log("✅ 체크섬 검증 완료");
  } else {
    console.log("\nℹ️ SHA256SUMS.txt 없음(구버전 스냅샷일 수 있음) - 체크섬 검증 생략");
  }
}

main();


