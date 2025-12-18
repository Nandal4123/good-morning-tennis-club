import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ExternalLink, RefreshCw, Shield } from "lucide-react";
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

  const isOwner = !!currentUser?.isOwner;

  const loadClubs = async (q = "") => {
    setError("");
    try {
      setLoading(true);
      const data = await clubsApi.list(q);
      setClubs(data);
    } catch (e) {
      console.error("Failed to load clubs:", e);
      setError("클럽 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (subdomain) => {
    setError("");
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
        c.name?.toLowerCase().includes(q) || c.subdomain?.toLowerCase().includes(q)
    );
  }, [clubs, query]);

  const handleSelect = (club) => {
    setSelected(club);
    loadSummary(club.subdomain);
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
          <h2 className="text-xl font-bold text-white mb-2">접근 권한이 없습니다</h2>
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
            클럽을 한 번에 전부 로드하지 않습니다. 클럽을 선택했을 때만 요약(카운트)을
            지연 로드합니다.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            현재 경로: <span className="font-mono">{location.pathname + location.search}</span>
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

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Club list */}
        <div className="card p-4 lg:col-span-2">
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
                        <div className="text-white font-medium">{club.name}</div>
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
                          <ExternalLink size={14} />
                          새 탭
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card p-4">
          <h2 className="text-lg font-bold text-white mb-3">선택한 클럽 요약</h2>
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
                <div className="text-white font-medium">{summary.club?.name}</div>
                <div className="text-slate-400 text-sm font-mono">
                  {summary.club?.subdomain}
                </div>
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
                요약은 count만 제공합니다. 상세 데이터는 “이동” 버튼으로 해당 클럽 화면에서
                확인하세요.
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">요약 정보가 없습니다.</div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-700/40 text-slate-500 text-xs">
            {t("app.subtitle")}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;


