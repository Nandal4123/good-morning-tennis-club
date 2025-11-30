import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Plus,
  X,
  Search,
  Trash2,
  HelpCircle,
  Swords,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  LayoutGrid,
  Table,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CalendarCheck,
} from "lucide-react";
import { userApi } from "../lib/api";
import MemberCard from "../components/MemberCard";

// NTRP 등급 목록
const NTRP_LEVELS = [
  "NTRP_2_0",
  "NTRP_2_5",
  "NTRP_3_0",
  "NTRP_3_5",
  "NTRP_4_0",
  "NTRP_4_5",
  "NTRP_5_0",
];

function Members({ currentUser }) {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNtrpGuide, setShowNtrpGuide] = useState(false);
  const [showHeadToHead, setShowHeadToHead] = useState(false);
  const [headToHeadData, setHeadToHeadData] = useState(null);
  const [headToHeadLoading, setHeadToHeadLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    tennisLevel: "NTRP_3_0",
    goals: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 관리자용 상태
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });

  // 관리자 여부 확인
  const isAdmin = currentUser?.role === "ADMIN";

  useEffect(() => {
    loadMembers();
  }, [isAdmin]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      let data;

      // 관리자는 통계 포함된 데이터를 가져옴 (실패 시 기본 API로 폴백)
      if (isAdmin) {
        try {
          data = await userApi.getAllWithStats();
        } catch (statsError) {
          console.warn(
            "Stats API failed, falling back to basic API:",
            statsError
          );
          data = await userApi.getAll();
        }
      } else {
        data = await userApi.getAll();
      }

      setMembers(data);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  // 정렬 함수
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // 정렬 아이콘
  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} className="text-slate-500" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={14} className="text-tennis-400" />
    ) : (
      <ArrowDown size={14} className="text-tennis-400" />
    );
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await userApi.create(newMember);
      setShowModal(false);
      setNewMember({ name: "", email: "", tennisLevel: "NTRP_3_0", goals: "" });
      await loadMembers();
    } catch (error) {
      console.error("Failed to create member:", error);
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleDeleteMember = async () => {
    try {
      setDeleting(true);
      await userApi.delete(selectedMember.id);
      setShowDeleteModal(false);
      setSelectedMember(null);
      await loadMembers();
    } catch (error) {
      console.error("Failed to delete member:", error);
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleHeadToHead = async (member) => {
    if (member.id === currentUser.id) {
      alert("자신과의 상대전적은 볼 수 없습니다.");
      return;
    }

    try {
      setHeadToHeadLoading(true);
      setShowHeadToHead(true);
      const data = await userApi.getHeadToHead(currentUser.id, member.id);
      setHeadToHeadData(data);
    } catch (error) {
      console.error("Failed to load head-to-head:", error);
      alert("상대전적을 불러오는데 실패했습니다.");
      setShowHeadToHead(false);
    } finally {
      setHeadToHeadLoading(false);
    }
  };

  // 필터링 및 정렬
  const filteredMembers = members
    .filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const { key, direction } = sortConfig;
      let aVal, bVal;

      // 통계 값 접근
      if (
        [
          "totalAttendance",
          "wins",
          "losses",
          "winRate",
          "totalMatches",
        ].includes(key)
      ) {
        aVal = a.stats?.[key] || 0;
        bVal = b.stats?.[key] || 0;
      } else if (key === "tennisLevel") {
        aVal = a.tennisLevel || "";
        bVal = b.tennisLevel || "";
      } else {
        aVal = a[key] || "";
        bVal = b[key] || "";
      }

      // 문자열 비교
      if (typeof aVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal, "ko")
          : bVal.localeCompare(aVal, "ko");
      }

      // 숫자 비교
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-tennis-500 tennis-ball" />
          <p className="text-slate-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
            <Users className="text-tennis-400" />
            {t("members.title")}
          </h1>
          <p className="text-slate-400 mt-1">
            {members.length} {t("members.memberCount")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle (Admin Only) */}
          {isAdmin && (
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-tennis-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                title="카드 보기"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "table"
                    ? "bg-tennis-500 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
                title="통계 보기"
              >
                <Table size={18} />
              </button>
            </div>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              {t("members.addMember")}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          size={20}
        />
        <input
          type="text"
          placeholder={t("members.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-12"
        />
      </div>

      {/* Members Grid or Table */}
      {viewMode === "grid" || !isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMembers.map((member, i) => (
            <div key={member.id} className="stagger-item">
              <MemberCard
                member={member}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onDelete={handleDeleteClick}
                onHeadToHead={handleHeadToHead}
              />
            </div>
          ))}
          {filteredMembers.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">{t("members.noMembers")}</p>
            </div>
          )}
        </div>
      ) : (
        /* Admin Table View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th
                    className="px-4 py-3 text-left cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                      이름 {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleSort("tennisLevel")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                      NTRP {getSortIcon("tennisLevel")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleSort("totalAttendance")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                      <CalendarCheck size={14} /> 총출석{" "}
                      {getSortIcon("totalAttendance")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleSort("totalMatches")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                      <Trophy size={14} /> 경기 {getSortIcon("totalMatches")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleSort("wins")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                      <TrendingUp size={14} /> 승 {getSortIcon("wins")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleSort("losses")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                      <TrendingDown size={14} /> 패 {getSortIcon("losses")}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-center cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleSort("winRate")}
                  >
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                      승률 {getSortIcon("winRate")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-400">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const displayLevel =
                    member.tennisLevel
                      ?.replace("NTRP_", "")
                      .replace("_", ".") || "-";
                  const stats = member.stats || {};

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      {/* 이름 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tennis-500 to-tennis-600 flex items-center justify-center text-white font-bold">
                            {member.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* NTRP */}
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-tennis-500/20 text-tennis-400 border border-tennis-500/30">
                          {displayLevel}
                        </span>
                      </td>
                      {/* 총출석 */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-white font-semibold">
                          {stats.totalAttendance || 0}
                        </span>
                        <span className="text-slate-500 text-sm">일</span>
                      </td>
                      {/* 경기 */}
                      <td className="px-4 py-3 text-center text-slate-300">
                        {stats.totalMatches || 0}
                      </td>
                      {/* 승 */}
                      <td className="px-4 py-3 text-center text-tennis-400 font-semibold">
                        {stats.wins || 0}
                      </td>
                      {/* 패 */}
                      <td className="px-4 py-3 text-center text-red-400 font-semibold">
                        {stats.losses || 0}
                      </td>
                      {/* 승률 */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-tennis-500 to-tennis-400 rounded-full"
                              style={{ width: `${stats.winRate || 0}%` }}
                            />
                          </div>
                          <span className="text-white text-sm font-medium w-10">
                            {stats.winRate || 0}%
                          </span>
                        </div>
                      </td>
                      {/* 관리 */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleHeadToHead(member)}
                            className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/20 transition-colors"
                            title="상대전적"
                          >
                            <Swords size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(member)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">{t("members.noMembers")}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {t("members.addMember")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t("profile.name")}
                </label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  className="input"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t("profile.email")}
                </label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  className="input"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-400">
                    {t("profile.level")} (NTRP)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNtrpGuide(true)}
                    className="flex items-center gap-1 text-xs text-tennis-400 hover:text-tennis-300 transition-colors"
                  >
                    <HelpCircle size={14} />
                    {t("members.ntrpGuide")}
                  </button>
                </div>
                <select
                  value={newMember.tennisLevel}
                  onChange={(e) =>
                    setNewMember({ ...newMember, tennisLevel: e.target.value })
                  }
                  className="input"
                >
                  {NTRP_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      NTRP {t(`members.level.${level.toLowerCase()}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t("profile.goals")}
                </label>
                <textarea
                  value={newMember.goals}
                  onChange={(e) =>
                    setNewMember({ ...newMember, goals: e.target.value })
                  }
                  className="input resize-none"
                  rows={3}
                  placeholder="서브 실력 향상..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? t("common.loading") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Member Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="text-red-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {t("members.deleteMember")}
              </h2>
              <p className="text-slate-400 mb-6">
                {t("members.deleteConfirm")}
              </p>

              {/* Member Preview */}
              <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg font-bold text-white">
                    {selectedMember.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {selectedMember.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {selectedMember.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMember(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDeleteMember}
                  disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  {deleting ? t("common.loading") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Head-to-Head Modal */}
      {showHeadToHead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Swords className="text-tennis-400" />
                상대전적
              </h2>
              <button
                onClick={() => {
                  setShowHeadToHead(false);
                  setHeadToHeadData(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {headToHeadLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 mx-auto border-2 border-tennis-500/30 border-t-tennis-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400">{t("common.loading")}</p>
              </div>
            ) : headToHeadData ? (
              <div className="space-y-6">
                {/* VS Header */}
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-tennis-500 to-tennis-600 flex items-center justify-center text-2xl font-bold text-white">
                      {currentUser.name?.charAt(0)}
                    </div>
                    <p className="text-white font-medium">{currentUser.name}</p>
                  </div>
                  <div className="text-3xl font-bold text-slate-500">VS</div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                      {headToHeadData.opponent?.name?.charAt(0)}
                    </div>
                    <p className="text-white font-medium">
                      {headToHeadData.opponent?.name}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-tennis-500/10 border border-tennis-500/30 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-tennis-400" />
                    <p className="text-2xl font-bold text-tennis-400">
                      {headToHeadData.stats?.wins || 0}
                    </p>
                    <p className="text-sm text-slate-400">승리</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/30 text-center">
                    <Minus className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <p className="text-2xl font-bold text-slate-400">
                      {headToHeadData.stats?.draws || 0}
                    </p>
                    <p className="text-sm text-slate-400">무승부</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                    <TrendingDown className="w-6 h-6 mx-auto mb-2 text-red-400" />
                    <p className="text-2xl font-bold text-red-400">
                      {headToHeadData.stats?.losses || 0}
                    </p>
                    <p className="text-sm text-slate-400">패배</p>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">승률</span>
                    <span className="text-xl font-bold text-white">
                      {headToHeadData.stats?.winRate || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-tennis-500 to-tennis-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${headToHeadData.stats?.winRate || 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Match History */}
                {headToHeadData.matchHistory?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">
                      경기 기록
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {headToHeadData.matchHistory.map((match, index) => (
                        <div
                          key={match.matchId || index}
                          className={`p-3 rounded-xl border ${
                            match.result === "WIN"
                              ? "bg-tennis-500/10 border-tennis-500/30"
                              : match.result === "LOSS"
                              ? "bg-red-500/10 border-red-500/30"
                              : "bg-slate-700/30 border-slate-700/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {match.result === "WIN" && (
                                <Trophy className="w-4 h-4 text-tennis-400" />
                              )}
                              <span className="text-sm text-slate-400">
                                {new Date(match.date).toLocaleDateString(
                                  "ko-KR"
                                )}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                match.result === "WIN"
                                  ? "text-tennis-400"
                                  : match.result === "LOSS"
                                  ? "text-red-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {match.result === "WIN"
                                ? "승"
                                : match.result === "LOSS"
                                ? "패"
                                : "무"}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-3 mt-2">
                            <span className="text-white text-sm">
                              {match.myTeam?.join(" & ")}
                            </span>
                            <span
                              className={`text-lg font-bold ${
                                match.myScore > match.opponentScore
                                  ? "text-tennis-400"
                                  : match.myScore < match.opponentScore
                                  ? "text-red-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {match.myScore} : {match.opponentScore}
                            </span>
                            <span className="text-white text-sm">
                              {match.opponentTeam?.join(" & ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {headToHeadData.matchHistory?.length === 0 && (
                  <div className="text-center py-8">
                    <Swords className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400">아직 상대전적이 없습니다.</p>
                    <p className="text-sm text-slate-500 mt-1">
                      경기를 기록하면 여기에 표시됩니다.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <button
              onClick={() => {
                setShowHeadToHead(false);
                setHeadToHeadData(null);
              }}
              className="btn-primary w-full mt-6"
            >
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}

      {/* NTRP Guide Modal */}
      {showNtrpGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎾 {t("members.ntrpGuide")}
              </h2>
              <button
                onClick={() => setShowNtrpGuide(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {NTRP_LEVELS.map((level) => {
                const displayLevel = level
                  .replace("NTRP_", "")
                  .replace("_", ".");
                return (
                  <div
                    key={level}
                    className="p-4 rounded-xl bg-slate-700/30 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 rounded-full text-sm font-bold bg-tennis-500/20 text-tennis-400 border border-tennis-500/30">
                        {displayLevel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">
                      {t(`members.ntrpDescription.${level.toLowerCase()}`)}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowNtrpGuide(false)}
              className="btn-primary w-full mt-6"
            >
              {t("common.confirm")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Members;
