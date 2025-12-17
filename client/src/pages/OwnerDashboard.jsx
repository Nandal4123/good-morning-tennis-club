import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  ExternalLink,
  RefreshCw,
  Shield,
  Plus,
  KeyRound,
} from "lucide-react";
import { clubsApi } from "../lib/api";

function OwnerDashboard({ currentUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Create club
  const [showCreate, setShowCreate] = useState(false);
  const [creatingClub, setCreatingClub] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubSubdomain, setNewClubSubdomain] = useState("");

  // Credentials
  const [joinCode, setJoinCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);

  // Share/Branding (OG)
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [savingBranding, setSavingBranding] = useState(false);

  const isOwner = !!currentUser?.isOwner;

  const formatDateOnly = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const loadClubs = async (q = "") => {
    setError("");
    setInfoMessage("");
    try {
      setLoading(true);
      const data = await clubsApi.list(q);
      setClubs(data);
    } catch (e) {
      console.error("Failed to load clubs:", e);
      if ((e.message || "").toLowerCase().includes("unauthorized")) {
        setError("Owner 토큰이 없습니다. Owner로 다시 로그인 해주세요.");
      } else {
        setError("클럽 목록을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (subdomain) => {
    setError("");
    setInfoMessage("");
    try {
      setSummaryLoading(true);
      const data = await clubsApi.getSummary(subdomain);
      setSummary(data);
    } catch (e) {
      console.error("Failed to load club summary:", e);
      setError("클럽 요약 정보를 불러오지 못했습니다.");
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  // 요약 로드 시 현재 브랜딩 값을 폼에 반영
  useEffect(() => {
    const club = summary?.club;
    if (!club) return;
    setShareTitle(club.shareTitle || "");
    setShareDescription(club.shareDescription || "");
    setShareImageUrl(club.shareImageUrl || "");
  }, [summary?.club?.subdomain]);

  useEffect(() => {
    if (!isOwner) return;
    loadClubs("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.subdomain?.toLowerCase().includes(q)
    );
  }, [clubs, query]);

  const handleSelect = (club) => {
    setSelected(club);
    // 해시는 읽을 수 없으므로 입력값은 매번 새로 받는다
    setJoinCode("");
    setAdminPassword("");
    loadSummary(club.subdomain);
  };

  const handleCreateClub = async () => {
    setError("");
    setInfoMessage("");
    try {
      setCreatingClub(true);
      const created = await clubsApi.create({
        name: newClubName.trim(),
        subdomain: newClubSubdomain.trim(),
      });
      setInfoMessage(`클럽 생성 완료: ${created.name} (${created.subdomain})`);
      setShowCreate(false);
      setNewClubName("");
      setNewClubSubdomain("");
      await loadClubs(query);
    } catch (e) {
      console.error("Failed to create club:", e);
      setError(e.message || "클럽 생성에 실패했습니다.");
    } finally {
      setCreatingClub(false);
    }
  };

  const toSafeSubdomain = (value) => {
    // 공백/언더스코어 → 하이픈, 소문자, 허용 문자 외 제거
    const raw = (value || "").toString().trim().toLowerCase();
    const replaced = raw.replace(/[\s_]+/g, "-");
    const cleaned = replaced.replace(/[^a-z0-9-]/g, "");
    const collapsed = cleaned.replace(/-+/g, "-").replace(/^-|-$/g, "");
    return collapsed;
  };

  const handleSaveCredentials = async () => {
    if (!selected) return;
    setError("");
    setInfoMessage("");
    try {
      setSavingCreds(true);
      await clubsApi.setCredentials(selected.subdomain, {
        joinCode: joinCode.trim() || undefined,
        adminPassword: adminPassword.trim() || undefined,
      });
      setInfoMessage("자격증명(가입코드/관리자 비번) 설정이 저장되었습니다.");
      await loadSummary(selected.subdomain);
    } catch (e) {
      console.error("Failed to set credentials:", e);
      setError(e.message || "자격증명 저장에 실패했습니다.");
    } finally {
      setSavingCreds(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!selected) return;
    setError("");
    setInfoMessage("");
    try {
      setSavingBranding(true);
      await clubsApi.setBranding(selected.subdomain, {
        shareTitle: shareTitle.trim() || undefined,
        shareDescription: shareDescription.trim() || undefined,
        shareImageUrl: shareImageUrl.trim() || undefined,
      });
      setInfoMessage("공유 미리보기(제목/설명/이미지) 설정이 저장되었습니다.");
      await loadSummary(selected.subdomain);
    } catch (e) {
      console.error("Failed to set branding:", e);
      setError(e.message || "공유 미리보기 설정 저장에 실패했습니다.");
    } finally {
      setSavingBranding(false);
    }
  };

  const openClub = (club, newTab = false) => {
    const search = `?club=${encodeURIComponent(club.subdomain)}`;
    const url = `${window.location.origin}/${search}`;

    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // 같은 탭에서 해당 클럽으로 이동 (쿼리스트링 유지가 핵심)
    navigate({ pathname: "/", search }, { replace: false });
  };

  if (!isOwner) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-2">
            접근 권한이 없습니다
          </h2>
          <p className="text-slate-400">
            Owner 계정으로 로그인해야 이 페이지를 사용할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-tennis-400" size={18} />
            <h1 className="text-2xl font-bold text-white font-display">
              Owner 대시보드
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            클럽을 한 번에 전부 로드하지 않습니다. 클럽을 선택했을 때만
            요약(카운트)을 지연 로드합니다.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            현재 경로:{" "}
            <span className="font-mono">
              {location.pathname + location.search}
            </span>
          </p>
        </div>
        <button
          onClick={() => loadClubs(query)}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      {infoMessage && (
        <div className="p-4 rounded-xl bg-tennis-500/10 border border-tennis-500/30 text-tennis-100">
          {infoMessage}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Club list */}
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">클럽</h2>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={16} />
              클럽 생성
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="클럽 이름/서브도메인 검색"
                className="input pl-10"
              />
            </div>
            <div className="text-sm text-slate-400 whitespace-nowrap">
              {loading ? "불러오는 중..." : `${filtered.length}개`}
            </div>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              표시할 클럽이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((club) => {
                const isSelected = selected?.id === club.id;
                return (
                  <div
                    key={club.id}
                    onClick={() => handleSelect(club)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(club);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-tennis-500/10 border-tennis-500/30"
                        : "bg-slate-900/40 border-slate-700/40 hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-medium">
                          {club.name}
                        </div>
                        <div className="text-slate-400 text-sm font-mono">
                          {club.subdomain}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-2 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClub(club, false);
                          }}
                        >
                          이동
                        </button>
                        <button
                          type="button"
                          className="btn-secondary px-3 py-2 text-sm flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openClub(club, true);
                          }}
                          title="새 탭에서 열기"
                        >
                          <ExternalLink size={14} />새 탭
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary + Ops */}
        <div className="card p-4">
          <h2 className="text-lg font-bold text-white mb-3">
            선택한 클럽 요약
          </h2>
          {!selected ? (
            <div className="text-slate-400 text-sm">
              왼쪽 목록에서 클럽을 선택하면 요약 정보를 불러옵니다.
            </div>
          ) : summaryLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div>
                <div className="text-white font-medium">
                  {summary.club?.name}
                </div>
                <div className="text-slate-400 text-sm font-mono">
                  {summary.club?.subdomain}
                </div>
                {summary.latestSessionDate && (
                  <div className="text-slate-500 text-xs mt-1">
                    최근 세션:{" "}
                    <span className="font-mono">
                      {formatDateOnly(summary.latestSessionDate)}
                    </span>
                  </div>
                )}
                {typeof summary.todayVisitors === "number" && (
                  <div className="text-slate-500 text-xs mt-1">
                    오늘 접속자(고유):{" "}
                    <span className="font-mono">{summary.todayVisitors}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                  <div className="text-slate-400 text-xs">회원</div>
                  <div className="text-white text-xl font-bold">
                    {summary.counts?.users ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                  <div className="text-slate-400 text-xs">세션</div>
                  <div className="text-white text-xl font-bold">
                    {summary.counts?.sessions ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                  <div className="text-slate-400 text-xs">경기</div>
                  <div className="text-white text-xl font-bold">
                    {summary.counts?.matches ?? 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                  <div className="text-slate-400 text-xs">출석 기록</div>
                  <div className="text-white text-xl font-bold">
                    {summary.counts?.attendances ?? 0}
                  </div>
                </div>
              </div>
              <div className="text-slate-500 text-xs">
                요약은 count만 제공합니다. 상세 데이터는 “이동” 버튼으로 해당
                클럽 화면에서 확인하세요.
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">요약 정보가 없습니다.</div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-700/40 text-slate-500 text-xs">
            {t("app.subtitle")}
          </div>

          {/* 운영 설정 */}
          <div className="mt-4 pt-4 border-t border-slate-700/40">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={16} className="text-tennis-400" />
              <h3 className="text-white font-semibold">운영 설정</h3>
            </div>
            {!selected ? (
              <div className="text-slate-400 text-sm">
                왼쪽에서 클럽을 선택하면 가입코드/관리자 비번을 설정할 수
                있습니다.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-slate-400 text-xs">
                  보안상 기존 값(해시)은 표시되지 않습니다. 새 값을 입력하면
                  덮어씁니다.
                </div>
                <input
                  className="input"
                  placeholder="가입 승인 코드 (예: ace2424)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="클럽 관리자 비밀번호 (예: admin7171)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  type="password"
                />
                <button
                  className="btn-primary w-full"
                  onClick={handleSaveCredentials}
                  disabled={
                    savingCreds || (!joinCode.trim() && !adminPassword.trim())
                  }
                >
                  {savingCreds ? "저장 중..." : "저장"}
                </button>

                {/* 공유 미리보기(OG) 설정 */}
                <div className="mt-4 pt-4 border-t border-slate-700/40">
                  <div className="text-white font-semibold mb-2">
                    카톡 공유 미리보기 설정
                  </div>
                  <div className="text-slate-400 text-xs mb-2">
                    링크 미리보기(제목/설명/이미지)를 클럽마다 다르게 설정할 수
                    있습니다. 저장 후 공유 링크는{" "}
                    <span className="font-mono">
                      /share?club={selected.subdomain}
                    </span>{" "}
                    를 사용하세요.
                  </div>
                  <input
                    className="input"
                    placeholder="공유 제목 (예: Ace Club | 테니스 출석·경기 기록)"
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                  />
                  <textarea
                    className="input min-h-[96px]"
                    placeholder="공유 설명 (예: 출석/경기 결과/상대전적/월별 랭킹을 확인하세요)"
                    value={shareDescription}
                    onChange={(e) => setShareDescription(e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="공유 이미지 URL 또는 경로 (예: /og/ace-club.svg)"
                    value={shareImageUrl}
                    onChange={(e) => setShareImageUrl(e.target.value)}
                  />
                  <button
                    className="btn-secondary w-full"
                    onClick={handleSaveBranding}
                    disabled={
                      savingBranding ||
                      (!shareTitle.trim() &&
                        !shareDescription.trim() &&
                        !shareImageUrl.trim())
                    }
                  >
                    {savingBranding ? "저장 중..." : "미리보기 설정 저장"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create club modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">클럽 생성</h3>
              <button
                className="btn-secondary px-3 py-2"
                onClick={() => setShowCreate(false)}
              >
                닫기
              </button>
            </div>
            <div className="space-y-3">
              <input
                className="input"
                placeholder="클럽 이름 (예: Ace Club)"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
              />
              <input
                className="input"
                placeholder="서브도메인/주소 (예: club-blue)"
                value={newClubSubdomain}
                onChange={(e) =>
                  setNewClubSubdomain(toSafeSubdomain(e.target.value))
                }
              />
              <button
                className="btn-primary w-full"
                onClick={handleCreateClub}
                disabled={
                  creatingClub ||
                  !newClubName.trim() ||
                  !newClubSubdomain.trim()
                }
              >
                {creatingClub ? "생성 중..." : "생성"}
              </button>
              <div className="text-slate-500 text-xs">
                서브도메인은{" "}
                <span className="font-semibold">영문/숫자/하이픈</span>만
                허용됩니다. 공백은 자동으로 하이픈(-)으로 바뀝니다. (예:{" "}
                <span className="font-mono">club-blue</span>)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
