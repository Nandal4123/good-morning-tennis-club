import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Users, Calendar } from "lucide-react";

function WeeklyAttendanceView({ attendances = [] }) {
  const { t } = useTranslation();
  
  // 현재 주의 시작일 (일요일 기준)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedDate, setSelectedDate] = useState(null);

  // 주 이동
  const goToPrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
    setSelectedDate(null);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    // 미래로는 이동 불가
    if (newDate <= getWeekStart(new Date())) {
      setCurrentWeekStart(newDate);
      setSelectedDate(null);
    }
  };

  // 이번 주인지 확인
  const isCurrentWeek = useMemo(() => {
    const thisWeekStart = getWeekStart(new Date());
    return currentWeekStart.getTime() === thisWeekStart.getTime();
  }, [currentWeekStart]);

  // 날짜별 출석자 그룹핑
  const attendanceByDate = useMemo(() => {
    const grouped = {};
    attendances
      .filter((a) => a.status === "ATTENDED")
      .forEach((a) => {
        const date = new Date(a.date);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        if (!grouped[dateStr]) {
          grouped[dateStr] = [];
        }
        grouped[dateStr].push(a);
      });
    return grouped;
  }, [attendances]);

  // 이번 주 날짜 배열 생성
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      days.push({
        date,
        dateStr,
        dayOfWeek: i,
        attendees: attendanceByDate[dateStr] || [],
      });
    }
    return days;
  }, [currentWeekStart, attendanceByDate]);

  // 오늘 날짜인지 확인
  const isToday = (date) => {
    const today = new Date();
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  };

  // 요일 이름
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayColors = [
    "text-red-400",
    "text-slate-300",
    "text-slate-300",
    "text-slate-300",
    "text-slate-300",
    "text-slate-300",
    "text-blue-400",
  ];

  // 주 범위 표시
  const weekRangeText = useMemo(() => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    
    const startMonth = currentWeekStart.getMonth() + 1;
    const startDay = currentWeekStart.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();
    
    if (startMonth === endMonth) {
      return `${currentWeekStart.getFullYear()}년 ${startMonth}월 ${startDay}일 - ${endDay}일`;
    }
    return `${startMonth}/${startDay} - ${endMonth}/${endDay}`;
  }, [currentWeekStart]);

  // 선택된 날짜의 출석자
  const selectedAttendees = selectedDate
    ? attendanceByDate[selectedDate] || []
    : [];

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="text-tennis-400" size={24} />
          {t("attendance.history")}
        </h2>
      </div>

      {/* 주 네비게이션 */}
      <div className="flex items-center justify-between p-4 bg-slate-800/50">
        <button
          onClick={goToPrevWeek}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="text-slate-400" size={20} />
        </button>
        <div className="text-center">
          <h3 className="text-lg font-bold text-white">{weekRangeText}</h3>
          {isCurrentWeek && (
            <span className="text-xs text-tennis-400">이번 주</span>
          )}
        </div>
        <button
          onClick={goToNextWeek}
          disabled={isCurrentWeek}
          className={`p-2 rounded-lg transition-colors ${
            isCurrentWeek
              ? "text-slate-600 cursor-not-allowed"
              : "hover:bg-slate-700 text-slate-400"
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 주간 캘린더 그리드 */}
      <div className="grid grid-cols-7 border-b border-slate-700">
        {weekDays.map((day, index) => {
          const hasAttendees = day.attendees.length > 0;
          const isSelected = selectedDate === day.dateStr;
          const isTodayDate = isToday(day.date);

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(isSelected ? null : day.dateStr)}
              className={`p-3 border-r border-slate-700 last:border-r-0 transition-all duration-200 ${
                isSelected
                  ? "bg-tennis-500/20"
                  : hasAttendees
                  ? "hover:bg-slate-700/50"
                  : "hover:bg-slate-700/30"
              }`}
            >
              {/* 요일 */}
              <p className={`text-xs font-medium mb-1 ${dayColors[index]}`}>
                {dayNames[index]}
              </p>
              
              {/* 날짜 */}
              <p
                className={`text-lg font-bold mb-2 ${
                  isTodayDate
                    ? "text-tennis-400"
                    : hasAttendees
                    ? "text-white"
                    : "text-slate-500"
                }`}
              >
                {day.date.getDate()}
              </p>

              {/* 출석 표시 */}
              {hasAttendees ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg">🎾</span>
                    <span className="text-xs text-tennis-400 font-bold">
                      {day.attendees.length}명
                    </span>
                  </div>
                  {/* 미리보기: 최대 2명 */}
                  <div className="space-y-0.5">
                    {day.attendees.slice(0, 2).map((a) => (
                      <p
                        key={a.id}
                        className="text-xs text-slate-400 truncate"
                      >
                        {a.user?.name}
                      </p>
                    ))}
                    {day.attendees.length > 2 && (
                      <p className="text-xs text-slate-500">
                        +{day.attendees.length - 2}명
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center">
                  <span className="text-slate-600 text-xs">-</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 날짜 상세 보기 */}
      {selectedDate && (
        <div className="p-4 bg-slate-800/50 border-t border-slate-700 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Users className="text-tennis-400" size={18} />
            <h4 className="text-white font-bold">
              {new Date(selectedDate).toLocaleDateString("ko-KR", {
                month: "long",
                day: "numeric",
                weekday: "short",
              })}{" "}
              출석자
            </h4>
            <span className="text-tennis-400 font-bold">
              ({selectedAttendees.length}명)
            </span>
          </div>

          {selectedAttendees.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedAttendees.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-xl border border-slate-600"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-tennis-500 to-tennis-600 flex items-center justify-center text-xs font-bold text-white">
                    {a.user?.name?.charAt(0)}
                  </div>
                  <span className="text-sm text-white font-medium">
                    {a.user?.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">출석자가 없습니다</p>
          )}
        </div>
      )}

      {/* 범례 */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <span>🎾</span>
            <span>출석일 (클릭하여 상세보기)</span>
          </div>
          <div className="text-slate-400">
            이번 주 출석:{" "}
            <span className="text-tennis-400 font-bold">
              {weekDays.filter((d) => d.attendees.length > 0).length}일
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyAttendanceView;

