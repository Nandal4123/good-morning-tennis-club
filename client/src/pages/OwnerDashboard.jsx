import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  ExternalLink,
  RefreshCw,
  Shield,
  Plus,
  Key,
  X,
  Save,
  Eye,
  EyeOff,
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
  const [clubDetail, setClubDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 클럽 추가 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClub, setNewClub] = useState({
    name: "",
    subdomain: "",
    adminPassword: "",
    joinCode: "",
  });
  const [creating, setCreating] = useState(false);

  // 관리자 비밀번호 변경 모달
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // 가입 코드 변경 모달
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false);
  const [newJoinCode, setNewJoinCode] = useState("");
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [updatingJoinCode, setUpdatingJoinCode] = useState(false);

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

  const loadClubDetail = async (subdomain) => {
    setError("");
    try {
      setDetailLoading(true);
      const data = await clubsApi.get(subdomain);
      setClubDetail(data);
    } catch (e) {
      console.error("Failed to load club detail:", e);
      setError("클럽 상세 정보를 불러오지 못했습니다.");
      setClubDetail(null);
    } finally {
      setDetailLoading(false);
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
        c.name?.toLowerCase().includes(q) ||
        c.subdomain?.toLowerCase().includes(q)
    );
  }, [clubs, query]);

  const handleSelect = async (club) => {
    setSelected(club);
    await Promise.all([
      loadSummary(club.subdomain),
      loadClubDetail(club.subdomain),
    ]);
  };

  const openClub = (club, newTab = false) => {
    if (!club || !club.subdomain) {
      console.error("[OwnerDashboard] 클럽 정보가 없습니다:", club);
      return;
    }

    const subdomain = club.subdomain;
    const search = `?club=${encodeURIComponent(subdomain)}`;
    const url = `${window.location.origin}/${search}`;

    console.log("[OwnerDashboard] 클럽 이동:", {
      clubName: club.name,
      subdomain: subdomain,
      search,
      url,
    });

    // localStorage에 클럽 식별자 저장 (멀티테넌트 모드 활성화를 위해)
    // 이 작업을 navigate 전에 수행하여 getClubIdentifier()가 올바른 값을 반환하도록 함
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("lastClubIdentifier", subdomain);
        console.log("[OwnerDashboard] localStorage에 클럽 식별자 저장:", subdomain);
      }
    } catch (error) {
      console.warn("[OwnerDashboard] localStorage 저장 실패:", error);
    }

    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    // 같은 탭에서 해당 클럽으로 이동
    // search는 문자열로 전달 (예: "?club=ace-club")
    // replace: false로 설정하여 브라우저 히스토리에 추가
    // 주의: navigate는 비동기이므로 localStorage 업데이트를 먼저 수행해야 함
    navigate({ pathname: "/", search }, { replace: false });
  };

  const handleCreateClub = async () => {
    if (!newClub.name || !newClub.subdomain) {
      setError("클럽 이름과 서브도메인은 필수입니다.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(newClub.subdomain)) {
      setError("서브도메인은 영문자, 숫자, 하이픈만 사용할 수 있습니다.");
      return;
    }

    setError("");
    setCreating(true);
    try {
      const club = await clubsApi.create({
        name: newClub.name,
        subdomain: newClub.subdomain,
        adminPassword: newClub.adminPassword || undefined,
        joinCode: newClub.joinCode || undefined,
      });
      setSuccess("클럽이 생성되었습니다.");
      setShowCreateModal(false);
      setNewClub({ name: "", subdomain: "", adminPassword: "", joinCode: "" });
      await loadClubs(query);
      await handleSelect(club);
    } catch (e) {
      setError(e.message || "클럽 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      setError("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    if (!selected) return;

    setError("");
    setUpdatingPassword(true);
    try {
      await clubsApi.updateAdminPassword(selected.subdomain, newPassword);
      setSuccess("관리자 비밀번호가 변경되었습니다.");
      setShowPasswordModal(false);
      setNewPassword("");
      await loadClubDetail(selected.subdomain);
    } catch (e) {
      setError(e.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUpdateJoinCode = async () => {
    if (!newJoinCode || newJoinCode.length < 4) {
      setError("가입 코드는 최소 4자 이상이어야 합니다.");
      return;
    }

    if (!selected) return;

    setError("");
    setUpdatingJoinCode(true);
    try {
      await clubsApi.updateJoinCode(selected.subdomain, newJoinCode);
      setSuccess("가입 코드가 변경되었습니다.");
      setShowJoinCodeModal(false);
      setNewJoinCode("");
      await loadClubDetail(selected.subdomain);
    } catch (e) {
      setError(e.message || "가입 코드 변경에 실패했습니다.");
    } finally {
      setUpdatingJoinCode(false);
    }
  };

  // Owner 대시보드 접속 시 클럽 파라미터 제거 (불필요함)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has("club") && location.pathname === "/owner") {
      navigate({ pathname: "/owner", search: "" }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  // 성공 메시지 자동 제거
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
            클럽을 관리하고, 관리자 비밀번호를 설정할 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            클럽 추가
          </button>
          <button
            onClick={() => loadClubs(query)}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={16} />
            새로고침
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-200">
          {success}
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

        {/* Summary & Details */}
        <div className="card p-4 space-y-4">
          <h2 className="text-lg font-bold text-white mb-3">
            선택한 클럽 정보
          </h2>
          {!selected ? (
            <div className="text-slate-400 text-sm">
              왼쪽 목록에서 클럽을 선택하면 정보를 불러옵니다.
            </div>
          ) : detailLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : clubDetail ? (
            <div className="space-y-4">
              {/* 클럽 기본 정보 */}
              <div>
                <div className="text-white font-medium">{clubDetail.name}</div>
                <div className="text-slate-400 text-sm font-mono">
                  {clubDetail.subdomain}
                </div>
                <div className="text-slate-500 text-xs mt-1">
                  생성일: {new Date(clubDetail.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* 통계 */}
              {summary && (
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
              )}

              {/* 관리자 비밀번호 설정 */}
              <div className="pt-4 border-t border-slate-700/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">관리자 비밀번호</div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <Key size={12} />
                    {clubDetail.hasAdminPassword ? "변경" : "설정"}
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  {clubDetail.hasAdminPassword
                    ? "비밀번호가 설정되어 있습니다."
                    : "비밀번호가 설정되지 않았습니다."}
                </div>
              </div>

              {/* 가입 코드 설정 */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-slate-400">가입 코드</div>
                  <button
                    onClick={() => setShowJoinCodeModal(true)}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <Key size={12} />
                    {clubDetail.hasJoinCode ? "변경" : "설정"}
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  {clubDetail.hasJoinCode
                    ? "가입 코드가 설정되어 있습니다."
                    : "가입 코드가 설정되지 않았습니다."}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">
              정보를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 클럽 추가 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">새 클럽 추가</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  클럽 이름 *
                </label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) =>
                    setNewClub({ ...newClub, name: e.target.value })
                  }
                  className="input w-full"
                  placeholder="예: Ace Club"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  서브도메인 *
                </label>
                <input
                  type="text"
                  value={newClub.subdomain}
                  onChange={(e) =>
                    setNewClub({
                      ...newClub,
                      subdomain: e.target.value.toLowerCase(),
                    })
                  }
                  className="input w-full"
                  placeholder="예: ace-club"
                />
                <div className="text-xs text-slate-500 mt-1">
                  영문자, 숫자, 하이픈만 사용 가능
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  관리자 비밀번호 (선택)
                </label>
                <input
                  type="password"
                  value={newClub.adminPassword}
                  onChange={(e) =>
                    setNewClub({ ...newClub, adminPassword: e.target.value })
                  }
                  className="input w-full"
                  placeholder="나중에 설정 가능"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  가입 코드 (선택)
                </label>
                <input
                  type="text"
                  value={newClub.joinCode}
                  onChange={(e) =>
                    setNewClub({ ...newClub, joinCode: e.target.value })
                  }
                  className="input w-full"
                  placeholder="나중에 설정 가능"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreateClub}
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? "생성 중..." : "생성"}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 비밀번호 변경 모달 */}
      {showPasswordModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                관리자 비밀번호 {clubDetail?.hasAdminPassword ? "변경" : "설정"}
              </h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  새 비밀번호 *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="최소 4자 이상"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleUpdatePassword}
                  disabled={updatingPassword}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {updatingPassword ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword("");
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 가입 코드 변경 모달 */}
      {showJoinCodeModal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                가입 코드 {clubDetail?.hasJoinCode ? "변경" : "설정"}
              </h2>
              <button
                onClick={() => {
                  setShowJoinCodeModal(false);
                  setNewJoinCode("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  새 가입 코드 *
                </label>
                <div className="relative">
                  <input
                    type={showJoinCode ? "text" : "password"}
                    value={newJoinCode}
                    onChange={(e) => setNewJoinCode(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="최소 4자 이상"
                  />
                  <button
                    type="button"
                    onClick={() => setShowJoinCode(!showJoinCode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showJoinCode ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleUpdateJoinCode}
                  disabled={updatingJoinCode}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {updatingJoinCode ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setShowJoinCodeModal(false);
                    setNewJoinCode("");
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
