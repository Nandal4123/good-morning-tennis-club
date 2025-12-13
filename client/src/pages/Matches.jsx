import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Plus, X, Trash2, UserPlus } from "lucide-react";
import { matchApi, userApi } from "../lib/api";
import MatchCard from "../components/MatchCard";
import LoadingScreen from "../components/LoadingScreen";

// KST 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환
const getKSTDateString = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // 'en-CA' 로케일은 YYYY-MM-DD 형식 반환
};

function Matches({ currentUser }) {
  const { t } = useTranslation();
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checking, setChecking] = useState(false);
  
  // Guest player states
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestTarget, setGuestTarget] = useState({ team: "", index: 0 });
  const [creatingGuest, setCreatingGuest] = useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === "ADMIN";

  const [newMatch, setNewMatch] = useState({
    type: "DOUBLES",
    date: getKSTDateString(), // KST 기준 오늘 날짜
    teamA: ["", ""],
    teamB: ["", ""],
    scoreA: 0,
    scoreB: 0,
  });

  const [editMatch, setEditMatch] = useState({
    id: "",
    date: "",
    scoreA: 0,
    scoreB: 0,
    participantsA: [],
    participantsB: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matchData, userData] = await Promise.all([
        matchApi.getAll(),
        userApi.getAll(),
      ]);
      setMatches(matchData);
      setUsers(userData);
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check for duplicate match before creating
  const checkAndCreateMatch = async (e) => {
    e.preventDefault();

    const playerIds = [
      ...newMatch.teamA.filter((id) => id),
      ...newMatch.teamB.filter((id) => id),
    ];

    // Need exactly 4 players for doubles
    if (playerIds.length !== 4) {
      alert("복식 경기는 4명의 선수가 필요합니다.");
      return;
    }

    // Check for duplicate players
    const uniquePlayerIds = [...new Set(playerIds)];
    if (uniquePlayerIds.length !== 4) {
      alert("같은 선수가 중복으로 선택되었습니다.");
      return;
    }

    try {
      setChecking(true);

      // Check for duplicate match
      const result = await matchApi.checkDuplicate(newMatch.date, playerIds);

      if (result.isDuplicate) {
        setDuplicateMatch(result.existingMatch);
        setShowDuplicateWarning(true);
      } else {
        // No duplicate, create directly
        await createMatchDirectly();
      }
    } catch (error) {
      console.error("Failed to check duplicate:", error);
      // If check fails, proceed with creation
      await createMatchDirectly();
    } finally {
      setChecking(false);
    }
  };

  // Create match directly without duplicate check
  const createMatchDirectly = async () => {
    try {
      setSaving(true);

      const participants = [
        ...newMatch.teamA
          .filter((id) => id)
          .map((userId) => ({
            userId,
            team: "A",
            score: newMatch.scoreA,
          })),
        ...newMatch.teamB
          .filter((id) => id)
          .map((userId) => ({
            userId,
            team: "B",
            score: newMatch.scoreB,
          })),
      ];

      await matchApi.create({
        date: newMatch.date,
        type: newMatch.type,
        participants,
        createdBy: currentUser?.id, // 등록자 ID 전달
      });

      setShowModal(false);
      setShowDuplicateWarning(false);
      setDuplicateMatch(null);
      setNewMatch({
        type: "DOUBLES",
        date: getKSTDateString(), // KST 기준 오늘 날짜
        teamA: ["", ""],
        teamB: ["", ""],
        scoreA: 0,
        scoreB: 0,
      });
      await loadData();
    } catch (error) {
      console.error("Failed to create match:", error);
    } finally {
      setSaving(false);
    }
  };

  // Legacy function name for compatibility
  const handleCreateMatch = checkAndCreateMatch;

  const handleEditMatch = (match) => {
    const teamA = match.participants?.filter((p) => p.team === "A") || [];
    const teamB = match.participants?.filter((p) => p.team === "B") || [];

    setEditMatch({
      id: match.id,
      date: getKSTDateString(new Date(match.date)), // KST 기준 날짜
      scoreA: teamA[0]?.score || 0,
      scoreB: teamB[0]?.score || 0,
      participantsA: teamA,
      participantsB: teamB,
    });
    setSelectedMatch(match);
    setShowEditModal(true);
  };

  const handleUpdateMatch = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Update match date
      await matchApi.update(editMatch.id, {
        date: editMatch.date,
      });

      // Update scores for each participant
      for (const participant of editMatch.participantsA) {
        await matchApi.updateScore(
          editMatch.id,
          participant.id,
          editMatch.scoreA
        );
      }
      for (const participant of editMatch.participantsB) {
        await matchApi.updateScore(
          editMatch.id,
          participant.id,
          editMatch.scoreB
        );
      }

      setShowEditModal(false);
      setSelectedMatch(null);
      await loadData();
    } catch (error) {
      console.error("Failed to update match:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (match) => {
    setSelectedMatch(match);
    setShowDeleteModal(true);
  };

  const handleDeleteMatch = async () => {
    try {
      setDeleting(true);
      await matchApi.delete(selectedMatch.id);
      setShowDeleteModal(false);
      setSelectedMatch(null);
      await loadData();
    } catch (error) {
      console.error("Failed to delete match:", error);
    } finally {
      setDeleting(false);
    }
  };

  const updateTeamPlayer = (team, index, value) => {
    // "ADD_GUEST" 선택 시 게스트 추가 모달 열기
    if (value === "ADD_GUEST") {
      setGuestTarget({ team, index });
      setGuestName("");
      setShowGuestModal(true);
      return;
    }
    
    const key = team === "A" ? "teamA" : "teamB";
    const updated = [...newMatch[key]];
    updated[index] = value;
    setNewMatch({ ...newMatch, [key]: updated });
  };

  // 게스트 선수 생성
  const handleCreateGuest = async () => {
    if (!guestName.trim()) {
      alert("게스트 이름을 입력해주세요.");
      return;
    }

    try {
      setCreatingGuest(true);
      
      // 게스트용 고유 이메일 생성
      const guestEmail = `guest_${Date.now()}@guest.local`;
      
      // 게스트 사용자 생성
      const newGuest = await userApi.create({
        email: guestEmail,
        name: `👤 ${guestName.trim()}`, // 👤 아이콘으로 게스트 구분
        role: "USER",
        tennisLevel: "NTRP_3_0",
      });

      // users 목록에 추가
      setUsers([...users, newGuest]);
      
      // 선택한 팀/위치에 게스트 설정
      const key = guestTarget.team === "A" ? "teamA" : "teamB";
      const updated = [...newMatch[key]];
      updated[guestTarget.index] = newGuest.id;
      setNewMatch({ ...newMatch, [key]: updated });

      // 모달 닫기
      setShowGuestModal(false);
      setGuestName("");
    } catch (error) {
      console.error("Failed to create guest:", error);
      alert("게스트 추가에 실패했습니다.");
    } finally {
      setCreatingGuest(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
            <Trophy className="text-tennis-400" />
            {t("matches.title")}
          </h1>
          <p className="text-slate-400 mt-1">
            {matches.length} {t("matches.matchCount")}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          {t("matches.newMatch")}
        </button>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <div key={match.id} className="stagger-item">
            <MatchCard
              match={match}
              isAdmin={isAdmin}
              onEdit={() => handleEditMatch(match)}
              onDelete={() => handleDeleteClick(match)}
            />
          </div>
        ))}
        {matches.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">{t("matches.noMatches")}</p>
          </div>
        )}
      </div>

      {/* New Match Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {t("matches.newMatch")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t("matches.matchType")}
                  </label>
                  <div className="input bg-purple-500/20 border-purple-500/30 text-purple-400 flex items-center gap-2">
                    <span>🎾</span> {t("matches.type.doubles")}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {t("matches.date")}
                  </label>
                  <input
                    type="date"
                    value={newMatch.date}
                    onChange={(e) =>
                      setNewMatch({ ...newMatch, date: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>

              {/* Team A */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <h3 className="font-medium text-blue-400 mb-3">
                  {t("matches.team.a")}
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      {t("matches.player")} 1
                    </label>
                    <select
                      value={newMatch.teamA[0]}
                      onChange={(e) => updateTeamPlayer("A", 0, e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">{t("matches.selectPlayer")}</option>
                      <option value="ADD_GUEST" className="text-tennis-400 font-medium">
                        ➕ 게스트 추가
                      </option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      {t("matches.player")} 2
                    </label>
                    <select
                      value={newMatch.teamA[1]}
                      onChange={(e) => updateTeamPlayer("A", 1, e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">{t("matches.selectPlayer")}</option>
                      <option value="ADD_GUEST" className="text-tennis-400 font-medium">
                        ➕ 게스트 추가
                      </option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-500 mb-1">
                    {t("matches.score")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMatch.scoreA === 0 ? "" : newMatch.scoreA}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewMatch({
                        ...newMatch,
                        scoreA: value === "" ? 0 : parseInt(value) || 0,
                      });
                    }}
                    onFocus={(e) => {
                      // 0일 때 포커스하면 전체 선택하여 쉽게 지울 수 있게 함
                      if (newMatch.scoreA === 0) {
                        e.target.select();
                      }
                    }}
                    className="input w-24"
                  />
                </div>
              </div>

              {/* Team B */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <h3 className="font-medium text-purple-400 mb-3">
                  {t("matches.team.b")}
                </h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      {t("matches.player")} 1
                    </label>
                    <select
                      value={newMatch.teamB[0]}
                      onChange={(e) => updateTeamPlayer("B", 0, e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">{t("matches.selectPlayer")}</option>
                      <option value="ADD_GUEST" className="text-tennis-400 font-medium">
                        ➕ 게스트 추가
                      </option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      {t("matches.player")} 2
                    </label>
                    <select
                      value={newMatch.teamB[1]}
                      onChange={(e) => updateTeamPlayer("B", 1, e.target.value)}
                      className="input"
                      required
                    >
                      <option value="">{t("matches.selectPlayer")}</option>
                      <option value="ADD_GUEST" className="text-tennis-400 font-medium">
                        ➕ 게스트 추가
                      </option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-slate-500 mb-1">
                    {t("matches.score")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMatch.scoreB === 0 ? "" : newMatch.scoreB}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewMatch({
                        ...newMatch,
                        scoreB: value === "" ? 0 : parseInt(value) || 0,
                      });
                    }}
                    onFocus={(e) => {
                      // 0일 때 포커스하면 전체 선택하여 쉽게 지울 수 있게 함
                      if (newMatch.scoreB === 0) {
                        e.target.select();
                      }
                    }}
                    className="input w-24"
                  />
                </div>
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
                  disabled={saving || checking}
                  className="btn-primary flex-1"
                >
                  {checking
                    ? "확인 중..."
                    : saving
                    ? t("common.loading")
                    : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Match Modal */}
      {showEditModal && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {t("matches.editMatch")}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMatch(null);
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMatch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  {t("matches.date")}
                </label>
                <input
                  type="date"
                  value={editMatch.date}
                  onChange={(e) =>
                    setEditMatch({ ...editMatch, date: e.target.value })
                  }
                  className="input"
                />
              </div>

              {/* Team A */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <h3 className="font-medium text-blue-400 mb-3">
                  {t("matches.team.a")}
                </h3>
                <div className="space-y-1 mb-3">
                  {editMatch.participantsA.map((p) => (
                    <p key={p.id} className="text-white">
                      {p.user?.name}
                    </p>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {t("matches.score")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMatch.scoreA === 0 ? "" : editMatch.scoreA}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditMatch({
                        ...editMatch,
                        scoreA: value === "" ? 0 : parseInt(value) || 0,
                      });
                    }}
                    onFocus={(e) => {
                      // 0일 때 포커스하면 전체 선택하여 쉽게 지울 수 있게 함
                      if (editMatch.scoreA === 0) {
                        e.target.select();
                      }
                    }}
                    className="input w-24"
                  />
                </div>
              </div>

              {/* Team B */}
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <h3 className="font-medium text-purple-400 mb-3">
                  {t("matches.team.b")}
                </h3>
                <div className="space-y-1 mb-3">
                  {editMatch.participantsB.map((p) => (
                    <p key={p.id} className="text-white">
                      {p.user?.name}
                    </p>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {t("matches.score")}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMatch.scoreB === 0 ? "" : editMatch.scoreB}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditMatch({
                        ...editMatch,
                        scoreB: value === "" ? 0 : parseInt(value) || 0,
                      });
                    }}
                    onFocus={(e) => {
                      // 0일 때 포커스하면 전체 선택하여 쉽게 지울 수 있게 함
                      if (editMatch.scoreB === 0) {
                        e.target.select();
                      }
                    }}
                    className="input w-24"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMatch(null);
                  }}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="text-red-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {t("matches.deleteMatch")}
              </h2>
              <p className="text-slate-400 mb-6">
                {t("matches.deleteConfirm")}
              </p>

              {/* Match Preview */}
              <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-slate-400 mb-2">
                  {new Date(selectedMatch.date).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    {selectedMatch.participants
                      ?.filter((p) => p.team === "A")
                      .map((p) => (
                        <p key={p.id} className="text-white text-sm">
                          {p.user?.name}
                        </p>
                      ))}
                  </div>
                  <div className="text-lg font-bold text-slate-400">VS</div>
                  <div className="text-right">
                    {selectedMatch.participants
                      ?.filter((p) => p.team === "B")
                      .map((p) => (
                        <p key={p.id} className="text-white text-sm">
                          {p.user?.name}
                        </p>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedMatch(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleDeleteMatch}
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

      {/* Guest Add Modal */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tennis-500/20 flex items-center justify-center">
                <UserPlus className="text-tennis-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                게스트 선수 추가
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                회원가입하지 않은 선수를 추가합니다
              </p>

              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="input w-full mb-6 text-center"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateGuest();
                  }
                }}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowGuestModal(false);
                    setGuestName("");
                  }}
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateGuest}
                  disabled={creatingGuest || !guestName.trim()}
                  className="btn-primary flex-1"
                >
                  {creatingGuest ? "추가 중..." : "추가"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && duplicateMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tennis-500/20 flex items-center justify-center">
                <span className="text-3xl">🎾</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                재경기(설욕전) 기록인가요?
              </h2>
              <p className="text-slate-400 mb-4">
                30분 이내에 같은 선수들로 기록된 경기가 있습니다.
              </p>

              {/* Existing Match Preview */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-tennis-400 mb-2 font-medium">
                  📋 기존 경기 (
                  {new Date(duplicateMatch.date).toLocaleString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    {duplicateMatch.teamA?.map((p) => (
                      <p key={p.id} className="text-white text-sm">
                        {p.user?.name}
                      </p>
                    ))}
                    <p className="text-blue-400 font-bold mt-1">
                      {duplicateMatch.teamA?.[0]?.score || 0}
                    </p>
                  </div>
                  <div className="text-lg font-bold text-slate-400">VS</div>
                  <div className="text-right">
                    {duplicateMatch.teamB?.map((p) => (
                      <p key={p.id} className="text-white text-sm">
                        {p.user?.name}
                      </p>
                    ))}
                    <p className="text-purple-400 font-bold mt-1">
                      {duplicateMatch.teamB?.[0]?.score || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setDuplicateMatch(null);
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm"
                >
                  아니오, 실수입니다
                </button>
                <button
                  onClick={async () => {
                    setShowDuplicateWarning(false);
                    await createMatchDirectly();
                  }}
                  disabled={saving}
                  className="flex-1 bg-tennis-500 hover:bg-tennis-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm"
                >
                  {saving ? "저장 중..." : "네, 재경기입니다"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Matches;
