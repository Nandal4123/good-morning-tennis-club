# 월별 랭킹 로딩 속도 개선 설명

## 🔴 현재 문제

월별 랭킹 API가 **44초**나 걸립니다.

## 📊 왜 이렇게 느린가요?

### 현재 구조 (순차 처리)

```
사용자 1: 출석 조회 (800ms) → 경기 조회 (800ms) = 1.6초
사용자 2: 출석 조회 (800ms) → 경기 조회 (800ms) = 1.6초
사용자 3: 출석 조회 (800ms) → 경기 조회 (800ms) = 1.6초
...
사용자 27: 출석 조회 (800ms) → 경기 조회 (800ms) = 1.6초

총 시간: 27명 × 1.6초 = 43.2초
```

**문제점:**
- 27명 × 2개 쿼리 = **54개 쿼리**를 순차 실행
- 각 쿼리가 완료될 때까지 다음 쿼리를 기다림
- 데이터베이스 왕복 시간이 누적됨

---

## ✅ 개선 방법: Bulk Query (일괄 조회)

### 새로운 구조

```
1. 모든 출석 데이터 한 번에 가져오기 (800ms)
2. 모든 경기 참여 데이터 한 번에 가져오기 (800ms)
3. 메모리에서 사용자별로 통계 계산 (0.1초)

총 시간: 800ms + 800ms + 100ms = 1.7초
```

**개선점:**
- 54개 쿼리 → **2개 쿼리**로 감소
- 44초 → **2-3초**로 단축
- 연결 풀 제한 문제 없음 (2개 쿼리만 사용)

---

## 🔍 구체적인 변경사항

### 이전 코드 (순차 처리)

```javascript
// 각 사용자마다 2개 쿼리 실행
for (const user of users) {
  const attendanceCount = await prisma.attendance.count({
    where: { userId: user.id, ... }
  });
  const matchParticipants = await prisma.matchParticipant.findMany({
    where: { userId: user.id, ... }
  });
  // 통계 계산...
}
// 총 54개 쿼리
```

### 개선된 코드 (Bulk Query)

```javascript
// 1. 모든 출석 데이터 한 번에 가져오기
const allAttendances = await prisma.attendance.findMany({
  where: { date: { gte: startDate, lt: endDate }, status: "ATTENDED" }
});

// 2. 모든 경기 참여 데이터 한 번에 가져오기
const allMatchParticipants = await prisma.matchParticipant.findMany({
  where: { match: { date: { gte: startDate, lt: endDate } } },
  include: { match: { include: { participants: true } } }
});

// 3. 메모리에서 사용자별로 그룹핑
const attendanceByUser = groupBy(allAttendances, 'userId');
const matchesByUser = groupBy(allMatchParticipants, 'userId');

// 4. 각 사용자별 통계 계산 (메모리에서)
for (const user of users) {
  const attendanceCount = attendanceByUser[user.id]?.length || 0;
  const userMatches = matchesByUser[user.id] || [];
  // 통계 계산...
}
// 총 2개 쿼리
```

---

## 📈 성능 비교

| 항목 | 이전 | 개선 후 | 개선율 |
|------|------|---------|--------|
| 쿼리 수 | 54개 | 2개 | **96% 감소** |
| 응답 시간 | 44초 | 2-3초 | **93% 단축** |
| 연결 사용 | 54개 | 2개 | **96% 감소** |

---

## 🎯 왜 이제 가능한가요?

### 이전에 순차 처리를 사용한 이유

- Supabase Transaction Mode 연결 제한 (1-2개)
- 병렬 처리 시 연결 풀 제한 오류 발생
- 안정성을 위해 순차 처리 선택

### 지금 Bulk Query가 가능한 이유

- **2개 쿼리만 사용**하므로 연결 제한 문제 없음
- 모든 데이터를 한 번에 가져와서 메모리에서 처리
- 연결 풀 안전성 유지하면서 성능 대폭 개선

---

## ✅ 기대 효과

1. **로딩 속도**: 44초 → 2-3초 (93% 단축)
2. **사용자 경험**: 월별 랭킹이 빠르게 표시됨
3. **서버 부하**: 쿼리 수 96% 감소
4. **안정성**: 연결 풀 제한 문제 없음

---

## 📝 요약

**문제:**
- 27명 × 2개 쿼리 = 54개 쿼리를 순차 실행
- 각 쿼리 800ms × 54 = 44초

**해결:**
- 2개 쿼리로 모든 데이터를 한 번에 가져오기
- 메모리에서 사용자별 통계 계산
- 2-3초로 단축

**결과:**
- ✅ 93% 성능 개선
- ✅ 연결 풀 안전성 유지
- ✅ 사용자 경험 대폭 개선

