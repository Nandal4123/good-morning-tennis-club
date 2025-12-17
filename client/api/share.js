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

export default function handler(req, res) {
  const club = (req.query?.club || "default").toString().trim() || "default";
  const pathname = (req.query?.path || "/").toString().trim() || "/";

  const origin = `https://${req.headers.host}`;
  const targetUrl =
    club && club !== "default"
      ? `${origin}${pathname}?club=${encodeURIComponent(club)}`
      : `${origin}${pathname}`;

  const clubName = humanizeClubIdentifier(club);
  const title = `${clubName} | 테니스 출석·경기 기록`;
  const description =
    "출석(경기 등록 시 자동 기록), 경기 결과/상대전적/월별 랭킹을 간편하게 확인하세요.";

  // 기본 OG 이미지(공용) - 필요하면 클럽별 이미지로 확장 가능
  const ogImage = `${origin}/og-image.png`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // 메신저 캐시가 너무 오래 남지 않도록 짧게
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");

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
    <meta property="og:url" content="${escapeHtml(targetUrl)}" />

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


