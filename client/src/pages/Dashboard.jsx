import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Crown,
  Medal,
} from "lucide-react";
import StatCard from "../components/StatCard";
import AttendanceItem from "../components/AttendanceItem";
import AttendanceCalendar from "../components/AttendanceCalendar";
import MyMatchesModal from "../components/MyMatchesModal";
import { sessionApi, attendanceApi, userApi, matchApi } from "../lib/api";

function Dashboard({ currentUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [todaySession, setTodaySession] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allAttendances, setAllAttendances] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [todayMatches, setTodayMatches] = useState([]);
  const [rankings, setRankings] = useState({
    winRate: [],
    wins: [],
    attendance: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [session, stats, attendance, allMatches, allUsersWithStats] = await Promise.all([
        sessionApi.getToday().catch(() => null),
        userApi.getStats(currentUser.id).catch(() => null),
        attendanceApi.getByUser(currentUser.id).catch(() => []),
        matchApi.getAll().catch(() => []),
        userApi.getAllWithStats().catch(() => []),
      ]);

      setTodaySession(session);
      setUserStats(stats);
      setRecentAttendance(attendance);

      // 오늘의 경기 필터링
      const today = new Date().toDateString();
      const todayOnly = allMatches.filter(
        (m) => new Date(m.date).toDateString() === today
      );
      setTodayMatches(todayOnly);

      // 랭킹 계산
      if (allUsersWithStats.length > 0) {
        // 승률 TOP 3 (최소 3경기 이상)
        const winRateRanking = [...allUsersWithStats]
          .filter((u) => (u.stats?.totalMatches || 0) >= 3)
          .sort((a, b) => (b.stats?.winRate || 0) - (a.stats?.winRate || 0))
          .slice(0, 3);

        // 다승왕 TOP 3
        const winsRanking = [...allUsersWithStats]
          .filter((u) => (u.stats?.wins || 0) > 0)
          .sort((a, b) => (b.stats?.wins || 0) - (a.stats?.wins || 0))
          .slice(0, 3);

        // 출석왕 TOP 3
        const attendanceRanking = [...allUsersWithStats]
          .filter((u) => (u.stats?.totalAttendance || 0) > 0)
          .sort((a, b) => (b.stats?.totalAttendance || 0) - (a.stats?.totalAttendance || 0))
          .slice(0, 3);

        setRankings({
          winRate: winRateRanking,
          wins: winsRanking,
          attendance: attendanceRanking,
        });
      }

      // Check if user is already checked in today
      if (session) {
        const todayAttendance = session.attendances?.find(
          (a) => a.userId === currentUser.id
        );
        setIsCheckedIn(
          !!todayAttendance && todayAttendance.status === "ATTENDED"
        );
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCheckIn = async () => {
    try {
      setCheckingIn(true);
      await attendanceApi.quickCheckIn(currentUser.id);
      setIsCheckedIn(true);
      await loadDashboardData();
    } catch (error) {
      console.error("Check-in failed:", error);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleShowCalendar = async () => {
    try {
      const attendances = await attendanceApi.getByUser(currentUser.id);
      setAllAttendances(attendances);
      setShowCalendar(true);
    } catch (error) {
      console.error("Failed to load attendances:", error);
    }
  };

  // 이달의 출석 횟수 계산
  const getMonthlyAttendance = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return recentAttendance.filter((a) => {
      const attendanceDate = new Date(a.date);
      return (
        attendanceDate.getMonth() === currentMonth &&
        attendanceDate.getFullYear() === currentYear &&
        a.status === "ATTENDED"
      );
    }).length;
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
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-display">
            {t("dashboard.welcome")}, {currentUser.name}! 👋
          </h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString("ko-KR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Quick Check-in Button */}
          <button
            onClick={handleQuickCheckIn}
            disabled={isCheckedIn || checkingIn}
            className={`btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 ${
              isCheckedIn ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isCheckedIn ? (
              <>
                <CheckCircle size={18} />
                <span className="text-sm">{t("dashboard.checkedIn")}</span>
              </>
            ) : checkingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">{t("common.loading")}</span>
              </>
            ) : (
              <>
                <CalendarCheck size={18} />
                <span className="text-sm">{t("dashboard.quickCheckIn")}</span>
              </>
            )}
          </button>

          {/* New Match Button */}
          <button
            onClick={() => navigate("/matches")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25"
          >
            <Trophy size={18} />
            <span className="text-sm">새 경기</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - Compact 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="stagger-item cursor-pointer"
          onClick={handleShowCalendar}
        >
          <div className="card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tennis-500/20 flex items-center justify-center">
              <CalendarCheck className="text-tennis-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {getMonthlyAttendance()}
              </p>
              <p className="text-xs text-slate-400">
                {t("dashboard.monthlyAttendance")}
              </p>
            </div>
          </div>
        </div>
        <div
          className="stagger-item cursor-pointer"
          onClick={() => setShowMatches(true)}
        >
          <div className="card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Trophy className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {userStats?.stats?.totalMatches || 0}
              </p>
              <p className="text-xs text-slate-400">
                {t("dashboard.totalMatches")}
              </p>
            </div>
          </div>
        </div>
        <div
          className="stagger-item cursor-pointer"
          onClick={handleShowCalendar}
        >
          <div className="card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {userStats?.stats?.totalAttendance || 0}
              </p>
              <p className="text-xs text-slate-400">
                {t("dashboard.totalAttendance")}
              </p>
            </div>
          </div>
        </div>
        <div
          className="stagger-item cursor-pointer"
          onClick={() => setShowMatches(true)}
        >
          <div className="card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Clock className="text-orange-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {userStats?.stats?.wins || 0}
              </p>
              <p className="text-xs text-slate-400">{t("dashboard.wins")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings */}
      {(rankings.winRate.length > 0 || rankings.wins.length > 0 || rankings.attendance.length > 0) && (
        <div className="card stagger-item">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Crown className="text-yellow-400" size={24} />
            🏆 이달의 랭킹
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 승률 TOP 3 */}
            <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                승률왕
                <span className="text-xs text-slate-500">(3경기 이상)</span>
              </h3>
              {rankings.winRate.length > 0 ? (
                <div className="space-y-2">
                  {rankings.winRate.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <span className="text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.name}</p>
                      </div>
                      <span className="text-yellow-400 font-bold">
                        {user.stats?.winRate || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">3경기 이상 참여자 없음</p>
              )}
            </div>

            {/* 다승왕 TOP 3 */}
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Trophy size={16} />
                다승왕
              </h3>
              {rankings.wins.length > 0 ? (
                <div className="space-y-2">
                  {rankings.wins.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <span className="text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.name}</p>
                      </div>
                      <span className="text-blue-400 font-bold">
                        {user.stats?.wins || 0}승
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">승리 기록 없음</p>
              )}
            </div>

            {/* 출석왕 TOP 3 */}
            <div className="p-4 bg-gradient-to-br from-tennis-500/10 to-green-500/10 border border-tennis-500/30 rounded-xl">
              <h3 className="text-sm font-semibold text-tennis-400 mb-3 flex items-center gap-2">
                <CalendarCheck size={16} />
                출석왕
              </h3>
              {rankings.attendance.length > 0 ? (
                <div className="space-y-2">
                  {rankings.attendance.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <span className="text-lg">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.name}</p>
                      </div>
                      <span className="text-tennis-400 font-bold">
                        {user.stats?.totalAttendance || 0}일
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">출석 기록 없음</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Today's Attendees */}
      <div className="card stagger-item">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CalendarCheck className="text-tennis-400" size={24} />
          📅 오늘의 출석자
          <span className="text-sm font-normal text-slate-400">
            ({todaySession?.attendances?.length || 0}명)
          </span>
        </h2>
        {todaySession?.attendances?.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {todaySession.attendances.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 px-3 py-2 bg-tennis-500/10 border border-tennis-500/30 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tennis-500 to-tennis-600 flex items-center justify-center text-xs font-bold text-white">
                  {a.user?.name?.charAt(0)}
                </div>
                <span className="text-white font-medium">{a.user?.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">아직 출석자가 없습니다</p>
        )}
      </div>

      {/* Today's Matches */}
      <div className="card stagger-item">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-blue-400" size={24} />
            🏆 오늘의 경기 결과
            <span className="text-sm font-normal text-slate-400">
              ({todayMatches.length}경기)
            </span>
          </h2>
          <button
            onClick={() => navigate("/matches")}
            className="flex items-center gap-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
          >
            <Plus size={16} />
            경기 등록
          </button>
        </div>
        {todayMatches.length > 0 ? (
          <div className="space-y-3">
            {todayMatches.map((match) => {
              const teamA =
                match.participants?.filter((p) => p.team === "A") || [];
              const teamB =
                match.participants?.filter((p) => p.team === "B") || [];
              const scoreA =
                teamA.length > 0
                  ? Math.max(...teamA.map((p) => p.score || 0))
                  : 0;
              const scoreB =
                teamB.length > 0
                  ? Math.max(...teamB.map((p) => p.score || 0))
                  : 0;
              const winner =
                scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : null;

              return (
                <div
                  key={match.id}
                  className="p-4 bg-slate-700/30 border border-slate-600/50 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg">
                      🎾 복식
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {/* Team A */}
                    <div
                      className={`flex-1 text-center ${
                        winner === "A" ? "text-tennis-400" : "text-white"
                      }`}
                    >
                      <p className="text-xs text-slate-400 mb-1">A팀</p>
                      <p className="font-medium">
                        {teamA.map((p) => p.user?.name).join(", ") || "-"}
                      </p>
                    </div>
                    {/* Score */}
                    <div className="px-6">
                      <span
                        className={`text-3xl font-bold ${
                          winner === "A" ? "text-tennis-400" : "text-white"
                        }`}
                      >
                        {scoreA}
                      </span>
                      <span className="text-slate-500 mx-2">:</span>
                      <span
                        className={`text-3xl font-bold ${
                          winner === "B" ? "text-tennis-400" : "text-white"
                        }`}
                      >
                        {scoreB}
                      </span>
                    </div>
                    {/* Team B */}
                    <div
                      className={`flex-1 text-center ${
                        winner === "B" ? "text-tennis-400" : "text-white"
                      }`}
                    >
                      <p className="text-xs text-slate-400 mb-1">B팀</p>
                      <p className="font-medium">
                        {teamB.map((p) => p.user?.name).join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                  {winner && (
                    <div className="mt-3 text-center">
                      <span className="text-sm text-tennis-400">
                        🏆 승자:{" "}
                        {winner === "A"
                          ? teamA.map((p) => p.user?.name).join(" & ")
                          : teamB.map((p) => p.user?.name).join(" & ")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-slate-500">오늘 등록된 경기가 없습니다</p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card stagger-item">
        <h2 className="text-xl font-bold text-white mb-4">
          {t("dashboard.recentActivity")}
        </h2>
        {recentAttendance.length > 0 ? (
          <div className="space-y-1">
            {recentAttendance.slice(0, 5).map((attendance) => (
              <AttendanceItem
                key={attendance.id}
                attendance={attendance}
                showUser={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-500">{t("dashboard.noActivity")}</p>
        )}
      </div>

      {/* Attendance Calendar Modal */}
      {showCalendar && (
        <AttendanceCalendar
          attendances={allAttendances}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* My Matches Modal */}
      {showMatches && (
        <MyMatchesModal
          userId={currentUser.id}
          onClose={() => setShowMatches(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;
