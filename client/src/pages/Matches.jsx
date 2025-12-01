import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trophy, Plus, X, Trash2, AlertTriangle } from "lucide-react";
import { matchApi, userApi } from "../lib/api";
import MatchCard from "../components/MatchCard";

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

  // Check if current user is admin
  const isAdmin = currentUser?.role === "ADMIN";

  const [newMatch, setNewMatch] = useState({
    type: "DOUBLES",
    date: new Date().toISOString().split("T")[0],
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
      });

      setShowModal(false);
      setShowDuplicateWarning(false);
      setDuplicateMatch(null);
      setNewMatch({
        type: "DOUBLES",
        date: new Date().toISOString().split("T")[0],
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
      date: new Date(match.date).toISOString().split("T")[0],
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
    const key = team === "A" ? "teamA" : "teamB";
    const updated = [...newMatch[key]];
    updated[index] = value;
    setNewMatch({ ...newMatch, [key]: updated });
  };

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
                    value={newMatch.scoreA}
                    onChange={(e) =>
                      setNewMatch({
                        ...newMatch,
                        scoreA: parseInt(e.target.value) || 0,
                      })
                    }
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
                    value={newMatch.scoreB}
                    onChange={(e) =>
                      setNewMatch({
                        ...newMatch,
                        scoreB: parseInt(e.target.value) || 0,
                      })
                    }
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
                  {checking ? "확인 중..." : saving ? t("common.loading") : t("common.save")}
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
                    value={editMatch.scoreA}
                    onChange={(e) =>
                      setEditMatch({
                        ...editMatch,
                        scoreA: parseInt(e.target.value) || 0,
                      })
                    }
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
                    value={editMatch.scoreB}
                    onChange={(e) =>
                      setEditMatch({
                        ...editMatch,
                        scoreB: parseInt(e.target.value) || 0,
                      })
                    }
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

      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && duplicateMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 animate-slide-up">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="text-yellow-400" size={32} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                유사한 경기가 있습니다
              </h2>
              <p className="text-slate-400 mb-4">
                30분 이내에 같은 선수들로 기록된 경기가 있습니다.
                <br />
                중복 기록이 아닌지 확인해주세요.
              </p>

              {/* Existing Match Preview */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm text-yellow-400 mb-2 font-medium">
                  기존 경기 ({new Date(duplicateMatch.date).toLocaleString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })})
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

              <p className="text-sm text-slate-500 mb-4">
                다른 경기라면 "그래도 기록하기"를 선택하세요.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDuplicateWarning(false);
                    setDuplicateMatch(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    setShowDuplicateWarning(false);
                    await createMatchDirectly();
                  }}
                  disabled={saving}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  {saving ? "저장 중..." : "그래도 기록하기"}
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
