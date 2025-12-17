/**
 * 클럽별 링크 미리보기(OG 태그) 전용 엔드포인트
 *
 * 왜 필요?
 * - 카카오톡/메신저 미리보기는 JS를 실행하지 않고 OG 메타태그만 읽음
 * - Vite SPA는 기본적으로 모든 URL이 같은 index.html을 반환 → 항상 "굿모닝"으로 보임
 *
 * 사용:
 * - https://good-morning-tennis-club.vercel.app/share?club=ace-club
 * - (굿모닝) https://good-morning-tennis-club.vercel.app/share
 *
 * 동작:
 * - OG 태그를 클럽별로 다르게 내려준 뒤, 실제 앱 URL로 즉시 리다이렉트
 */

function humanizeClubIdentifier(identifier) {
  if (!identifier || identifier === "default") return "굿모닝 테니스 클럽";
  return identifier
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchClubBranding({ apiBase, subdomain }) {
  try {
    const url = `${apiBase.replace(/\/$/, "")}/public/clubs/${encodeURIComponent(
      subdomain
    )}`;
    const r = await fetch(url, { method: "GET" });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.club || null;
  } catch {
    return null;
  }
}

function normalizeImageUrl({ origin, value, fallback }) {
  const v = (value || "").toString().trim();
  if (!v) return fallback;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("/")) return `${origin}${v}`;
  return `${origin}/${v}`;
}

async function urlExists(url) {
  try {
    // 정적 파일은 HEAD로 빠르게 확인 (일부 CDN에서 HEAD가 막히면 GET로 폴백)
    let r = await fetch(url, { method: "HEAD" });
    if (r.ok) return true;
    r = await fetch(url, { method: "GET" });
    return r.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const club = (req.query?.club || "default").toString().trim() || "default";
  const pathname = (req.query?.path || "/").toString().trim() || "/";
  const v = (req.query?.v || "").toString().trim(); // 카톡 캐시 무력화용(선택)

  const origin = `https://${req.headers.host}`;
  const shareUrl =
    club && club !== "default"
      ? `${origin}/share?club=${encodeURIComponent(club)}${
          pathname && pathname !== "/" ? `&path=${encodeURIComponent(pathname)}` : ""
        }${v ? `&v=${encodeURIComponent(v)}` : ""}`
      : `${origin}/share${v ? `?v=${encodeURIComponent(v)}` : ""}`;
  const targetUrl =
    club && club !== "default"
      ? `${origin}${pathname}?club=${encodeURIComponent(club)}`
      : `${origin}${pathname}`;

  // 서버(렌더)에서 클럽 브랜딩 정보 조회 (설정이 없으면 fallback)
  const apiBase =
    process.env.VITE_API_URL ||
    process.env.API_BASE ||
    "https://tennis-club-server.onrender.com/api";
  const branding = await fetchClubBranding({ apiBase, subdomain: club });

  const clubName = branding?.name || humanizeClubIdentifier(club);
  const title =
    branding?.shareTitle ||
    `${clubName} | 테니스 출석·경기 기록`;
  const description =
    branding?.shareDescription ||
    "출석(경기 등록 시 자동 기록), 경기 결과/상대전적/월별 랭킹을 간편하게 확인하세요.";

  // 기본 OG 이미지: 클럽별 설정이 있으면 우선 사용
  // - 설정이 없으면 /og/<subdomain>.svg 가 있으면 자동 사용
  // - 없으면 공용 PNG로 폴백
  const candidateSvg = `${origin}/og/${encodeURIComponent(club)}.svg`;
  const candidateSvgExists = await urlExists(candidateSvg);
  const fallbackImage = candidateSvgExists ? candidateSvg : `${origin}/og-image.png`;

  const ogImage = normalizeImageUrl({
    origin,
    value: branding?.shareImageUrl,
    fallback: fallbackImage,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // 메신저/브라우저 캐시가 오래 남지 않도록 최소화 (카톡 자체 캐시는 URL을 바꾸는 게 가장 확실)
  res.setHeader("Cache-Control", "no-store, max-age=0");

  res.status(200).send(`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />

    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <!-- og:url은 공유 URL로 고정: 카톡 캐시/미리보기 일관성을 위해 -->
    <meta property="og:url" content="${escapeHtml(shareUrl)}" />
    <link rel="canonical" href="${escapeHtml(shareUrl)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

    <meta http-equiv="refresh" content="0; url=${escapeHtml(targetUrl)}" />
  </head>
  <body>
    <p>이동 중입니다… <a href="${escapeHtml(targetUrl)}">계속</a></p>
    <script>
      location.replace(${JSON.stringify(targetUrl)});
    </script>
  </body>
</html>`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


