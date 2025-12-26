import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Check, X } from 'lucide-react';
import { sessionApi, attendanceApi, userApi } from '../lib/api';
import WeeklyAttendanceView from '../components/WeeklyAttendanceView';
import LoadingScreen from '../components/LoadingScreen';

function Attendance({ currentUser }) {
  const { t } = useTranslation();
  const [todaySession, setTodaySession] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [session, users, history] = await Promise.all([
        sessionApi.getToday(),
        userApi.getAll(),
        attendanceApi.getAll({ limit: 1000 }) // 캘린더에 모든 출석 데이터 표시를 위해 limit 증가
      ]);
      setTodaySession(session);
      setAllUsers(users);
      setAttendanceHistory(history);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (userId, status) => {
    try {
      setMarking(userId);
      await attendanceApi.mark({
        userId,
        sessionId: todaySession.id,
        status
      });
      await loadData();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    } finally {
      setMarking(null);
    }
  };

  const getUserAttendanceStatus = (userId) => {
    const attendance = todaySession?.attendances?.find(a => a.userId === userId);
    return attendance?.status;
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white font-display flex items-center gap-3">
          <CalendarCheck className="text-tennis-400" />
          {t('attendance.title')}
        </h1>
        <p className="text-slate-400 mt-1">
          {new Date().toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* 상단: 오늘 출석자 체크 패널 */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-4">
          {t('attendance.todayAttendees')}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          {todaySession?.description || t('attendance.morningSession')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {allUsers
            .filter((user) => {
              // 게스트 사용자 제외
              return (
                !user.email?.endsWith("@guest.local") &&
                !user.name?.startsWith("👤")
              );
            })
            .map((user) => {
            const status = getUserAttendanceStatus(user.id);
            const isMarking = marking === user.id;

            return (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                  status === 'ATTENDED' 
                    ? 'bg-tennis-500/10 border-tennis-500/30'
                    : status === 'ABSENT'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {user.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleMarkAttendance(user.id, 'ATTENDED')}
                    disabled={isMarking}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${
                      status === 'ATTENDED'
                        ? 'bg-tennis-500 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-tennis-500/20 hover:text-tennis-400'
                    }`}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => handleMarkAttendance(user.id, 'ABSENT')}
                    disabled={isMarking}
                    className={`p-1.5 rounded-lg transition-all duration-300 ${
                      status === 'ABSENT'
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {allUsers.filter((user) => 
            !user.email?.endsWith("@guest.local") && !user.name?.startsWith("👤")
          ).length === 0 && (
            <p className="text-center text-slate-500 py-8 col-span-full">{t('attendance.noAttendees')}</p>
          )}
        </div>
      </div>

      {/* 하단: 주간 캘린더 뷰 */}
      <WeeklyAttendanceView 
        attendances={attendanceHistory.filter((attendance) => {
          // 게스트 사용자 출석 기록 제외
          const user = attendance.user;
          return (
            user &&
            !user.email?.endsWith("@guest.local") &&
            !user.name?.startsWith("👤")
          );
        })}
      />
    </div>
  );
}

export default Attendance;

