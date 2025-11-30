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

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [session, stats, attendance, allMatches] = await Promise.all([
        sessionApi.getToday().catch(() => null),
        userApi.getStats(currentUser.id).catch(() => null),
        attendanceApi.getByUser(currentUser.id).catch(() => []),
        matchApi.getAll().catch(() => []),
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
        <div className="flex gap-3">
          {/* Quick Check-in Button */}
          <button
            onClick={handleQuickCheckIn}
            disabled={isCheckedIn || checkingIn}
            className={`btn-primary flex items-center gap-2 ${
              isCheckedIn ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isCheckedIn ? (
              <>
                <CheckCircle size={20} />
                {t("dashboard.checkedIn")}
              </>
            ) : checkingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              <>
                <CalendarCheck size={20} />
                {t("dashboard.quickCheckIn")}
              </>
            )}
          </button>

          {/* New Match Button */}
          <button
            onClick={() => navigate("/matches")}
            className="btn-secondary flex items-center gap-2"
          >
            <Trophy size={20} />새 경기
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
              <p className="text-2xl font-bold text-white">{getMonthlyAttendance()}</p>
              <p className="text-xs text-slate-400">{t("dashboard.monthlyAttendance")}</p>
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
              <p className="text-2xl font-bold text-white">{userStats?.stats?.totalMatches || 0}</p>
              <p className="text-xs text-slate-400">{t("dashboard.totalMatches")}</p>
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
              <p className="text-2xl font-bold text-white">{userStats?.stats?.totalAttendance || 0}</p>
              <p className="text-xs text-slate-400">{t("dashboard.totalAttendance")}</p>
            </div>
          </div>
        </div>
        <div className="stagger-item cursor-pointer" onClick={() => setShowMatches(true)}>
          <div className="card !p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Clock className="text-orange-400" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{userStats?.stats?.wins || 0}</p>
              <p className="text-xs text-slate-400">{t("dashboard.wins")}</p>
            </div>
          </div>
        </div>
      </div>

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
