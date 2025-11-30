import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import StatCard from "../components/StatCard";
import AttendanceItem from "../components/AttendanceItem";
import AttendanceCalendar from "../components/AttendanceCalendar";
import { sessionApi, attendanceApi, userApi } from "../lib/api";

function Dashboard({ currentUser }) {
  const { t } = useTranslation();
  const [todaySession, setTodaySession] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allAttendances, setAllAttendances] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [session, stats, attendance] = await Promise.all([
        sessionApi.getToday().catch(() => null),
        userApi.getStats(currentUser.id).catch(() => null),
        attendanceApi.getByUser(currentUser.id).catch(() => []),
      ]);

      setTodaySession(session);
      setUserStats(stats);
      setRecentAttendance(attendance);

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
    
    return recentAttendance.filter(a => {
      const attendanceDate = new Date(a.date);
      return attendanceDate.getMonth() === currentMonth && 
             attendanceDate.getFullYear() === currentYear &&
             a.status === 'ATTENDED';
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
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="stagger-item cursor-pointer"
          onClick={handleShowCalendar}
        >
          <StatCard
            icon={CalendarCheck}
            label={t("dashboard.monthlyAttendance")}
            value={getMonthlyAttendance()}
            color="tennis"
          />
        </div>
        <div className="stagger-item">
          <StatCard
            icon={Trophy}
            label={t("dashboard.totalMatches")}
            value={userStats?.stats?.totalMatches || 0}
            color="blue"
          />
        </div>
        <div
          className="stagger-item cursor-pointer"
          onClick={handleShowCalendar}
        >
          <StatCard
            icon={TrendingUp}
            label={t("dashboard.totalAttendance")}
            value={userStats?.stats?.totalAttendance || 0}
            color="purple"
          />
        </div>
        <div className="stagger-item">
          <StatCard
            icon={Clock}
            label={t("dashboard.wins")}
            value={userStats?.stats?.wins || 0}
            color="orange"
          />
        </div>
      </div>

      {/* Today's Session & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Session */}
        <div className="card stagger-item">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CalendarCheck className="text-tennis-400" size={24} />
            {t("dashboard.todaySession")}
          </h2>
          {todaySession ? (
            <div>
              <p className="text-slate-400 mb-4">{todaySession.description}</p>
              <div className="flex items-center gap-2 text-tennis-400">
                <span className="text-2xl font-bold font-display">
                  {todaySession.attendances?.length || 0}
                </span>
                <span className="text-slate-400">
                  {t("dashboard.membersPresent")}
                </span>
              </div>
              {todaySession.attendances?.length > 0 && (
                <div className="mt-4 flex -space-x-2">
                  {todaySession.attendances.slice(0, 5).map((a, i) => (
                    <div
                      key={a.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white"
                      title={a.user?.name}
                    >
                      {a.user?.name?.charAt(0)}
                    </div>
                  ))}
                  {todaySession.attendances.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-slate-400">
                      +{todaySession.attendances.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">{t("dashboard.noActivity")}</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card stagger-item">
          <h2 className="text-xl font-bold text-white mb-4">
            {t("dashboard.recentActivity")}
          </h2>
          {recentAttendance.length > 0 ? (
            <div className="space-y-1">
              {recentAttendance.map((attendance) => (
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
      </div>

      {/* Attendance Calendar Modal */}
      {showCalendar && (
        <AttendanceCalendar
          attendances={allAttendances}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}

export default Dashboard;
