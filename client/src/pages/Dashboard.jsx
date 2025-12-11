import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Trophy,
  TrendingUp,
  Clock,
  Plus,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StatCard from "../components/StatCard";
import AttendanceItem from "../components/AttendanceItem";
import AttendanceCalendar from "../components/AttendanceCalendar";
import MyMatchesModal from "../components/MyMatchesModal";
import { attendanceApi, userApi, matchApi } from "../lib/api";
import LoadingScreen from "../components/LoadingScreen";

function Dashboard({ currentUser }) {
  // 즉시 실행되는 디버깅
  console.log("[Dashboard] 🔵 컴포넌트 렌더링 시작");
  console.log(
    "[Dashboard] currentUser:",
    currentUser ? { id: currentUser.id, name: currentUser.name } : "null"
  );

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // userStats 변경 시 디버깅
  useEffect(() => {
    if (userStats) {
      console.log("[Dashboard] 📊 userStats 업데이트됨:", userStats);
      console.log("[Dashboard] 📊 stats 객체:", userStats.stats);
    } else {
      console.log("[Dashboard] ⚠️ userStats가 null입니다");
    }
  }, [userStats]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allAttendances, setAllAttendances] = useState([]);
  const [showMatches, setShowMatches] = useState(false);
  const [todayMatches, setTodayMatches] = useState([]);
  const [rankings, setRankings] = useState({
    winRate: [],
    wins: [],
    attendance: [],
  });

  // 월별 랭킹 선택 state
  const now = new Date();
  const initialYear = now.getFullYear();
  const initialMonth = now.getMonth() + 1;
  console.log(`[Dashboard] 초기 년/월 설정: ${initialYear}-${initialMonth}`);

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [rankingLoading, setRankingLoading] = useState(false);

  // API_BASE 확인
  console.log(
    "[Dashboard] API_BASE 확인:",
    typeof window !== "undefined" ? window.location.origin : "SSR"
  );

  // 서비스 시작일 (2024년 12월)
  const SERVICE_START_YEAR = 2024;
  const SERVICE_START_MONTH = 12;

  // 랭킹 데이터만 불러오기 함수
  const loadRankingData = async (year, month) => {
    if (!year || !month) {
      console.warn(`[Dashboard] Invalid year/month: ${year}/${month}`);
      return;
    }
    try {
      setRankingLoading(true);
      console.log(`[Dashboard] Loading ranking data for ${year}-${month}`);
      console.log(
        `[Dashboard] API call: getAllWithMonthlyStats(${year}, ${month})`
      );

      const monthlyStatsResponse = await userApi
        .getAllWithMonthlyStats(year, month)
        .catch((error) => {
          console.error(
            `[Dashboard] ❌ Failed to fetch monthly stats for ${year}-${month}:`,
            error
          );
          console.error(
            `[Dashboard] Error details:`,
            error.message,
            error.stack
          );
          return { users: [] };
        });

      console.log(
        `[Dashboard] ✅ API response received:`,
        monthlyStatsResponse
      );
      const allUsersWithStats = monthlyStatsResponse.users || [];
      console.log(
        `[Dashboard] Loaded ${allUsersWithStats.length} users with stats`
      );

      if (allUsersWithStats.length > 0) {
        console.log(
          `[Dashboard] Sample user stats:`,
          allUsersWithStats[0]?.stats
        );
      }

      if (allUsersWithStats.length > 0) {
        // 승률왕 TOP 3 (3경기 이상 + 최소 1승 이상)
        const winRateRanking = [...allUsersWithStats]
          .filter(
            (u) => (u.stats?.totalMatches || 0) >= 3 && (u.stats?.wins || 0) > 0
          )
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
          .sort(
            (a, b) =>
              (b.stats?.totalAttendance || 0) - (a.stats?.totalAttendance || 0)
          )
          .slice(0, 3);

        const newRankings = {
          winRate: winRateRanking,
          wins: winsRanking,
          attendance: attendanceRanking,
        };
        console.log(`[Dashboard] Setting rankings:`, {
          winRate: winRateRanking.length,
          wins: winsRanking.length,
          attendance: attendanceRanking.length,
        });
        setRankings(newRankings);
      } else {
        console.log(`[Dashboard] No users with stats for ${year}-${month}`);
        setRankings({ winRate: [], wins: [], attendance: [] });
      }
    } catch (error) {
      console.error("Failed to load ranking:", error);
      // 에러 발생 시에도 rankings를 초기화하여 UI가 올바르게 표시되도록 함
      setRankings({ winRate: [], wins: [], attendance: [] });
    } finally {
      setRankingLoading(false);
    }
  };

  // 초기 로드 플래그 (중복 호출 방지)
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (currentUser) {
      console.log("[Dashboard] currentUser changed, loading dashboard data");
      setInitialLoadDone(false); // 초기 로드 리셋
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // 월 변경 시 랭킹만 다시 불러오기
  // 초기 로드는 loadDashboardData에서 처리하므로,
  // initialLoadDone이 true이고 loading이 false일 때만 실행
  useEffect(() => {
    if (currentUser && !loading && initialLoadDone) {
      // 초기 로드가 완료된 후에만 실행 (월 변경 시)
      console.log(
        `[Dashboard] Month changed to ${selectedYear}-${selectedMonth}, loading ranking data`
      );
      loadRankingData(selectedYear, selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth]);

  const loadDashboardData = async () => {
    if (!currentUser) {
      console.warn("[Dashboard] No currentUser, skipping loadDashboardData");
      return;
    }
    try {
      setLoading(true);
      console.log(
        "[Dashboard] Starting loadDashboardData for user:",
        currentUser.id
      );
      const [stats, attendance, allMatches] = await Promise.all([
        userApi.getStats(currentUser.id).catch((err) => {
          console.error("[Dashboard] ❌ Failed to get stats:", err);
          console.error("[Dashboard] ❌ Error details:", {
            message: err?.message,
            stack: err?.stack,
            currentUser: currentUser?.id,
          });
          return null;
        }),
        attendanceApi.getByUser(currentUser.id).catch((err) => {
          console.error("[Dashboard] Failed to get attendance:", err);
          return [];
        }),
        matchApi.getAll().catch((err) => {
          console.error("[Dashboard] Failed to get matches:", err);
          return [];
        }),
      ]);

      console.log("[Dashboard] ✅ Stats loaded:", stats);
      console.log(
        "[Dashboard] ✅ Attendance loaded:",
        attendance?.length || 0,
        "records"
      );
      console.log(
        "[Dashboard] ✅ Matches loaded:",
        allMatches?.length || 0,
        "records"
      );

      // stats 설정 (null이어도 설정하여 에러 상태 표시)
      console.log("[Dashboard] ✅ Setting userStats:", stats);
      console.log("[Dashboard] 📋 Stats 상세:", {
        hasStats: !!stats,
        hasStatsProperty: !!(stats && stats.stats),
        statsValue: stats?.stats,
        totalAttendance: stats?.stats?.totalAttendance,
        totalMatches: stats?.stats?.totalMatches,
        wins: stats?.stats?.wins,
      });
      setUserStats(stats);

      // attendance 설정
      console.log(
        "[Dashboard] ✅ Setting recentAttendance:",
        attendance?.length || 0,
        "records"
      );
      setRecentAttendance(attendance || []);

      // 디버깅: stats 구조 확인
      if (stats) {
        console.log("[Dashboard] 📊 Stats 구조:", {
          totalAttendance: stats.stats?.totalAttendance,
          totalMatches: stats.stats?.totalMatches,
          wins: stats.stats?.wins,
        });
      } else {
        console.warn("[Dashboard] ⚠️ Stats가 null입니다!");
      }

      // 오늘의 경기 필터링 (KST 기준 YYYY-MM-DD 비교)
      // 한국 시간대 기준 날짜를 YYYY-MM-DD 형식으로 변환
      const getKSTDateString = (date) => {
        const formatter = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return formatter.format(date); // 'en-CA' 로케일은 YYYY-MM-DD 형식 반환
      };

      const todayStr = getKSTDateString(new Date());
      console.log("Today KST:", todayStr); // 디버깅용

      const todayOnly = allMatches.filter((m) => {
        const matchStr = getKSTDateString(new Date(m.date));
        console.log("Match date KST:", matchStr, "Original:", m.date); // 디버깅용
        return matchStr === todayStr;
      });
      setTodayMatches(todayOnly);

      // 초기 로드 완료 표시 (개인 통계는 즉시 표시)
      setInitialLoadDone(true);

      // 랭킹 데이터는 백그라운드에서 로드 (사용자 경험 개선)
      // selectedYear와 selectedMonth는 이미 초기화되어 있음
      const currentYear = selectedYear || now.getFullYear();
      const currentMonth = selectedMonth || now.getMonth() + 1;
      console.log(
        `[Dashboard] Initial load - loading ranking in background for ${currentYear}-${currentMonth}`
      );
      // await 제거: 백그라운드에서 로드하여 개인 통계를 먼저 표시
      loadRankingData(currentYear, currentMonth).catch((err) => {
        console.error("[Dashboard] Failed to load ranking in background:", err);
      });
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // 이전 월로 이동
  const handlePrevMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth - 1;

    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    // 서비스 시작일 이전으로는 이동 불가
    if (
      newYear < SERVICE_START_YEAR ||
      (newYear === SERVICE_START_YEAR && newMonth < SERVICE_START_MONTH)
    ) {
      return;
    }

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
  };

  // 다음 월로 이동
  const handleNextMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth + 1;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }

    // 현재 월 이후로는 이동 불가
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (
      newYear > currentYear ||
      (newYear === currentYear && newMonth > currentMonth)
    ) {
      return;
    }

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
  };

  // 이전 월 버튼 활성화 여부
  const canGoPrev = () => {
    if (selectedYear > SERVICE_START_YEAR) return true;
    if (
      selectedYear === SERVICE_START_YEAR &&
      selectedMonth > SERVICE_START_MONTH
    )
      return true;
    return false;
  };

  // 다음 월 버튼 활성화 여부
  const canGoNext = () => {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (selectedYear < currentYear) return true;
    if (selectedYear === currentYear && selectedMonth < currentMonth)
      return true;
    return false;
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

  // 이달의 출석 횟수 계산 (KST 기준)
  const getMonthlyAttendance = () => {
    if (!recentAttendance || recentAttendance.length === 0) {
      return 0;
    }

    // KST 기준 오늘 날짜
    const getKSTDateString = (date) => {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(date);
    };

    const todayStr = getKSTDateString(new Date());
    const todayYear = parseInt(todayStr.split("-")[0]);
    const todayMonth = parseInt(todayStr.split("-")[1]);

    const monthlyCount = recentAttendance.filter((a) => {
      if (!a || a.status !== "ATTENDED") return false;
      if (!a.date) return false;

      try {
        const attendanceDate = new Date(a.date);
        const attendanceStr = getKSTDateString(attendanceDate);
        const attYear = parseInt(attendanceStr.split("-")[0]);
        const attMonth = parseInt(attendanceStr.split("-")[1]);
        return attYear === todayYear && attMonth === todayMonth;
      } catch (error) {
        console.error(
          "[Dashboard] getMonthlyAttendance: 날짜 파싱 오류",
          a.date,
          error
        );
        return false;
      }
    }).length;

    return monthlyCount;
  };

  if (loading) {
    return <LoadingScreen />;
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
              timeZone: "Asia/Seoul",
            })}
          </p>
        </div>

        {/* Action Button - 경기 등록 */}
        <button
          onClick={() => navigate("/matches")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-tennis-500 to-tennis-600 hover:from-tennis-600 hover:to-tennis-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-tennis-500/25"
        >
          <Trophy size={20} />
          <span>경기 등록하기</span>
        </button>
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
      <div className="card stagger-item">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="text-yellow-400" size={24} />
            🏆 월별 랭킹
          </h2>

          {/* 월 선택 UI */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              disabled={!canGoPrev() || rankingLoading}
              className={`p-2 rounded-lg transition-all ${
                canGoPrev() && !rankingLoading
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl min-w-[140px] text-center">
              <span className="text-yellow-400 font-bold">
                {selectedYear}년 {selectedMonth}월
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={!canGoNext() || rankingLoading}
              className={`p-2 rounded-lg transition-all ${
                canGoNext() && !rankingLoading
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {(() => {
          // 디버깅: 현재 rankings 상태 확인
          const hasRankings =
            rankings.winRate.length > 0 ||
            rankings.wins.length > 0 ||
            rankings.attendance.length > 0;
          console.log(
            `[Dashboard] Render check - loading: ${rankingLoading}, hasRankings: ${hasRankings}`,
            {
              winRate: rankings.winRate.length,
              wins: rankings.wins.length,
              attendance: rankings.attendance.length,
            }
          );

          if (rankingLoading) {
            return (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
              </div>
            );
          }

          if (hasRankings) {
            return (
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
                            <p className="text-white font-medium truncate">
                              {user.name}
                            </p>
                          </div>
                          <span className="text-yellow-400 font-bold">
                            {user.stats?.winRate || 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">
                      3경기 이상 참여자 없음
                    </p>
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
                            <p className="text-white font-medium truncate">
                              {user.name}
                            </p>
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
                            <p className="text-white font-medium truncate">
                              {user.name}
                            </p>
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
            );
          }

          // 데이터 없음
          return (
            <div className="text-center py-8">
              <Crown className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400">
                {selectedYear}년 {selectedMonth}월 랭킹 데이터가 없습니다
              </p>
              <p className="text-sm text-slate-500 mt-1">
                경기와 출석 기록이 쌓이면 랭킹이 표시됩니다
              </p>
            </div>
          );
        })()}
      </div>

      {/* Today's Participants - 오늘 경기 참가자 (중복 제거) */}
      {(() => {
        // 오늘 경기 참가자 중복 제거
        const uniqueParticipants = [];
        const seenIds = new Set();
        todayMatches.forEach((match) => {
          match.participants?.forEach((p) => {
            if (!seenIds.has(p.user?.id)) {
              seenIds.add(p.user?.id);
              uniqueParticipants.push(p.user);
            }
          });
        });

        return (
          <div className="card stagger-item">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CalendarCheck className="text-tennis-400" size={24} />
              🎾 오늘 경기 참가자
              <span className="text-sm font-normal text-slate-400">
                ({uniqueParticipants.length}명)
              </span>
            </h2>
            {uniqueParticipants.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {uniqueParticipants.map((user) => (
                  <div
                    key={user?.id}
                    className="flex items-center gap-2 px-3 py-2 bg-tennis-500/10 border border-tennis-500/30 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tennis-500 to-tennis-600 flex items-center justify-center text-xs font-bold text-white">
                      {user?.name?.charAt(0)}
                    </div>
                    <span className="text-white font-medium">{user?.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">오늘 등록된 경기가 없습니다</p>
            )}
          </div>
        );
      })()}

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
