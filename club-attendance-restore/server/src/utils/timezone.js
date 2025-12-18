/**
 * 한국 시간대(KST, UTC+9) 유틸리티 함수
 */

// 한국 시간대 오프셋 (밀리초)
const KST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * 현재 한국 시간을 반환
 * @returns {Date} 한국 시간 기준 Date 객체
 */
export const getKoreanTime = () => {
  const now = new Date();
  return new Date(now.getTime() + KST_OFFSET);
};

/**
 * 한국 시간 기준 오늘의 시작(00:00:00)을 UTC로 반환
 * @returns {Date} UTC 기준 Date 객체
 */
export const getKoreanTodayStart = () => {
  const koreanNow = getKoreanTime();
  // 한국 시간 기준 오늘 00:00:00
  const koreanMidnight = new Date(Date.UTC(
    koreanNow.getUTCFullYear(),
    koreanNow.getUTCMonth(),
    koreanNow.getUTCDate(),
    0, 0, 0, 0
  ));
  // UTC로 변환 (9시간 빼기)
  return new Date(koreanMidnight.getTime() - KST_OFFSET);
};

/**
 * 한국 시간 기준 내일의 시작(00:00:00)을 UTC로 반환
 * @returns {Date} UTC 기준 Date 객체
 */
export const getKoreanTomorrowStart = () => {
  const todayStart = getKoreanTodayStart();
  return new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
};

/**
 * 한국 시간 기준 오늘 날짜 문자열 반환
 * @returns {string} YYYY-MM-DD 형식
 */
export const getKoreanDateString = () => {
  const koreanNow = getKoreanTime();
  const year = koreanNow.getUTCFullYear();
  const month = String(koreanNow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreanNow.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 한국 시간 기준 오늘의 날짜 범위를 반환 (DB 쿼리용)
 * @returns {{ start: Date, end: Date }} UTC 기준 시작/끝 시간
 */
export const getKoreanTodayRange = () => {
  return {
    start: getKoreanTodayStart(),
    end: getKoreanTomorrowStart()
  };
};
