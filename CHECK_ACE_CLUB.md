# 에이스클럽 확인 가이드

## 방법 1: Owner 대시보드에서 확인 (가장 간단)

1. Owner 대시보드 접속
2. 클럽 목록 확인
3. "Ace Club" 또는 "ace-club"이 보이는지 확인

---

## 방법 2: Render Shell에서 확인

### Render Shell 접속

1. Render 대시보드 → `good-morning-tennis-club-v2` 서비스
2. **Shell 탭** 클릭

### 스크립트 실행

```bash
cd server
pnpm run db:check-clubs
```

**예상 출력:**
```
🔍 데이터베이스 클럽 확인 중...

✅ 총 2개의 클럽이 있습니다:

1. Good Morning Club
   서브도메인: default
   ID: clxxx...
   생성일: 2024-...
   회원 수: X명
   세션 수: X개
   경기 수: X개

2. Ace Club
   서브도메인: ace-club
   ID: clxxx...
   생성일: 2024-...
   회원 수: X명
   세션 수: X개
   경기 수: X개

📋 클럽 상태:
   - Good Morning Club (default): ✅ 존재
   - Ace Club (ace-club): ✅ 존재
```

---

## 에이스클럽이 없으면 생성하기

Render Shell에서:

```bash
cd server
pnpm run db:create-ace-club
```

**예상 출력:**
```
🎾 Ace Club 생성 시작...

✅ Ace Club 생성 완료!
   ID: clxxx...
   이름: Ace Club
   서브도메인: ace-club
   생성일: 2024-...
```

---

## 참고

- 에이스클럽이 이미 있으면 스크립트가 "이미 존재합니다"라고 알려줍니다
- 에이스클럽을 생성해도 기존 데이터는 영향을 받지 않습니다
- 각 클럽은 독립적으로 작동합니다

