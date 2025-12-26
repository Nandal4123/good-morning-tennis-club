import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

function AttendanceCalendar({ attendances = [], onClose, isModal = false }) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

  // 출석한 날짜들을 Set으로 변환 (YYYY-MM-DD 형식)
  const attendedDates = new Set(
    attendances
      .filter(a => a.status === 'ATTENDED')
      .map(a => {
        const date = new Date(a.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 해당 월의 첫 번째 날과 마지막 날
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // 달력 시작 요일 (0: 일요일)
  const startDay = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // 이전/다음 달 이동
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 날짜가 출석한 날인지 확인
  const isAttended = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendedDates.has(dateStr);
  };

  // 오늘 날짜인지 확인
  const isToday = (day) => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  // 달력 날짜 배열 생성
  const calendarDays = [];
  
  // 빈 칸 (이전 달)
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  
  // 이번 달 날짜
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 이번 달 출석 횟수
  const monthAttendanceCount = Array.from(attendedDates).filter(dateStr => {
    const [y, m] = dateStr.split('-');
    return parseInt(y) === year && parseInt(m) === month + 1;
  }).length;

  const calendarContent = (
    <div className={`bg-slate-800 rounded-2xl border border-slate-700 w-full overflow-hidden ${isModal ? 'max-w-md animate-slide-up' : ''}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📅 {t('attendance.history')}
        </h2>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="text-slate-400" size={20} />
          </button>
        )}
      </div>

        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between p-4">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="text-slate-400" size={20} />
          </button>
          <h3 className="text-lg font-bold text-white">
            {year}년 {monthNames[month]}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="text-slate-400" size={20} />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 px-4">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                index === 0 ? 'text-red-400' : index === 6 ? 'text-blue-400' : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 gap-1 p-4">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm relative ${
                day === null
                  ? ''
                  : isToday(day)
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-300'
              }`}
            >
              {day && (
                <>
                  <span className={isAttended(day) ? 'text-tennis-400 font-bold' : ''}>
                    {day}
                  </span>
                  {isAttended(day) && (
                    <span className="absolute -top-1 -right-1 text-xs">🎾</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* 범례 및 통계 */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>🎾</span>
              <span>출석한 날</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-400">이번 달 출석: </span>
              <span className="text-tennis-400 font-bold">{monthAttendanceCount}회</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        {calendarContent}
      </div>
    );
  }

  return calendarContent;
}

export default AttendanceCalendar;

