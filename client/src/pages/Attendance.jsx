import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarCheck, Check, X, History } from 'lucide-react';
import { sessionApi, attendanceApi, userApi } from '../lib/api';
import AttendanceItem from '../components/AttendanceItem';

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
        attendanceApi.getAll({ limit: 20 })
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-tennis-500 tennis-ball" />
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mark Attendance */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">
            {t('attendance.todayAttendees')}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {todaySession?.description || 'Morning Session'}
          </p>

          <div className="space-y-3">
            {allUsers.map((user) => {
              const status = getUserAttendanceStatus(user.id);
              const isMarking = marking === user.id;

              return (
                <div 
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                    status === 'ATTENDED' 
                      ? 'bg-tennis-500/10 border-tennis-500/30'
                      : status === 'ABSENT'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg font-bold text-white">
                      {user.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkAttendance(user.id, 'ATTENDED')}
                      disabled={isMarking}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        status === 'ATTENDED'
                          ? 'bg-tennis-500 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-tennis-500/20 hover:text-tennis-400'
                      }`}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(user.id, 'ABSENT')}
                      disabled={isMarking}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        status === 'ABSENT'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                      }`}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {allUsers.length === 0 && (
              <p className="text-center text-slate-500 py-8">{t('attendance.noAttendees')}</p>
            )}
          </div>
        </div>

        {/* Attendance History */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <History className="text-slate-400" size={20} />
            {t('attendance.history')}
          </h2>
          {attendanceHistory.length > 0 ? (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {attendanceHistory.map((attendance) => (
                <AttendanceItem 
                  key={attendance.id} 
                  attendance={attendance}
                  showUser={true}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">{t('dashboard.noActivity')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;

