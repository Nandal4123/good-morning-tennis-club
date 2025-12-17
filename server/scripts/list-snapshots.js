import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readJsonIfExists(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return null;
  }
}

function main() {
  const projectRoot = path.join(__dirname, "..", "..");
  const snapshotsRoot = path.join(projectRoot, "snapshots");
  const pointerFile = path.join(snapshotsRoot, "snapshot-latest.txt");

  if (!fs.existsSync(snapshotsRoot)) {
    console.log("snapshots: (없음)");
    process.exit(0);
  }

  const latestPointer = fs.existsSync(pointerFile)
    ? fs.readFileSync(pointerFile, "utf-8").trim()
    : null;

  const dirs = fs
    .readdirSync(snapshotsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("snapshot-"))
    .map((e) => {
      const full = path.join(snapshotsRoot, e.name);
      const stat = fs.statSync(full);
      const db = readJsonIfExists(path.join(full, "db.json"));
      return {
        name: e.name,
        full,
        mtimeMs: stat.mtimeMs,
        createdAt: db?.createdAt || null,
        stats: db?.statistics || null,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  console.log(`snapshots: ${dirs.length}개`);
  if (latestPointer) {
    console.log(`latest pointer: ${latestPointer}`);
  } else {
    console.log("latest pointer: (없음)");
  }

  for (const d of dirs) {
    const mark = latestPointer && path.normalize(latestPointer) === path.normalize(d.full) ? "*" : " ";
    const s = d.stats
      ? `clubs=${d.stats.clubCount}, users=${d.stats.userCount}, sessions=${d.stats.sessionCount}, matches=${d.stats.matchCount}`
      : "stats=(없음)";
    console.log(`${mark} ${d.name}  (${d.createdAt || "createdAt=(unknown)"})  ${s}`);
  }
}

main();


