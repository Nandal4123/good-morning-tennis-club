/**
 * 전화번호 검증 및 정규화 유틸리티
 */

/**
 * 한국 전화번호 형식 검증
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} - 유효한 형식이면 true
 */
export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== "string") {
    return false;
  }

  const cleaned = phone.replace(/[-\s]/g, "");

  // 010-1234-5678 형식
  const koreanPhoneRegex = /^010-\d{4}-\d{4}$/;
  // 01012345678 형식 (하이픈 없음)
  const koreanPhoneNoDashRegex = /^010\d{8}$/;
  // +82-10-1234-5678 형식 (국제 형식)
  const internationalRegex = /^\+82-10-\d{4}-\d{4}$/;

  return (
    koreanPhoneRegex.test(phone) ||
    koreanPhoneNoDashRegex.test(cleaned) ||
    internationalRegex.test(phone)
  );
}

/**
 * 전화번호를 통일된 형식으로 정규화
 * @param {string} phone - 정규화할 전화번호
 * @returns {string} - 정규화된 전화번호 (010-XXXX-XXXX 형식)
 */
export function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== "string") {
    return phone;
  }

  // 하이픈과 공백 제거
  const cleaned = phone.replace(/[-\s]/g, "");

  // 010으로 시작하는 11자리 숫자인지 확인
  if (cleaned.startsWith("010") && cleaned.length === 11) {
    // 010-XXXX-XXXX 형식으로 변환
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }

  // 이미 올바른 형식이면 그대로 반환
  if (/^010-\d{4}-\d{4}$/.test(phone)) {
    return phone;
  }

  // 변환할 수 없으면 원본 반환
  return phone;
}


