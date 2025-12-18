# 🔄 어제 시점으로 롤백 계획

## 📅 롤백 대상 스냅샷

- **스냅샷 ID**: `snapshot-2025-12-17T03-48-32`
- **생성 시간**: 2025-12-17 03:48:32 (한국 시간: 12:48:32)
- **상태**: 체크섬 검증 통과 ✅

---

## ⚠️ 롤백 시 잃게 되는 기능

### 1. Owner 로그인 관련 디버깅 기능
- ❌ 디버깅 엔드포인트 (`/api/owner/debug`)
- ❌ 상세한 환경변수 로깅
- ❌ 서버 시작 시 환경변수 확인 로그

### 2. 관리자 회원 추가 개선
- ❌ 관리자 회원 추가 시 가입 코드 검증 건너뛰기
- ❌ 관리자 확인 로직 개선 (`req.club` 정보 활용)
- ❌ 회원 추가 폼 검증 개선 (FormData 사용)

### 3. 에러 핸들링 개선
- ❌ 회원 추가 에러 로깅 강화
- ❌ 상세 에러 메시지 개선

### 4. 문서화
- ❌ FEATURES_SUMMARY.md
- ❌ 롤백 작업 정보 문서

---

## ✅ 롤백 후에도 유지되는 기능

- 멀티 테넌트 시스템
- Owner 대시보드
- 회원 관리
- 출석 관리
- 경기 기록
- 통계 및 랭킹
- 상대전적
- 게스트 시스템
- PWA
- 다국어 지원
- OG 이미지 공유

---

## 🔧 롤백 절차

### ⚠️ 주의사항
1. **현재 작업 중인 변경사항이 있다면 먼저 커밋하세요**
2. **롤백은 파괴적 작업입니다** - 현재 데이터와 코드를 덮어씁니다
3. **롤백 전에 현재 상태를 백업하세요**

### 1단계: 현재 상태 백업 (안전장치)

```bash
cd club-attendance/server
pnpm run db:snapshot
```

### 2단계: 코드 롤백

**옵션 A: 현재 폴더에 직접 롤백 (위험)**
```bash
cd club-attendance
tar -xzf snapshots/snapshot-2025-12-17T03-48-32/code.tar.gz
```

**옵션 B: 별도 폴더에 복구 후 확인 (권장)**
```bash
mkdir -p /tmp/club-attendance-restore
tar -xzf snapshots/snapshot-2025-12-17T03-48-32/code.tar.gz -C /tmp/club-attendance-restore
# 복구된 코드 확인 후
# 현재 폴더로 복사
```

### 3단계: DB 롤백

```bash
cd club-attendance/server
pnpm run db:restore-snapshot -- --file ../snapshots/snapshot-2025-12-17T03-48-32/db.json --yes
```

### 4단계: 검증

```bash
cd club-attendance/server
pnpm run snapshot:verify -- --snapshot ../snapshots/snapshot-2025-12-17T03-48-32
```

### 5단계: Git 상태 확인 및 커밋

```bash
cd club-attendance
git status
git add -A
git commit -m "rollback: 어제 시점(snapshot-2025-12-17T03-48-32)으로 롤백"
git push
```

---

## 🎯 롤백 후 확인사항

1. ✅ Owner 로그인이 정상 작동하는지
2. ✅ 관리자 회원 추가가 정상 작동하는지
3. ✅ 모든 클럽 데이터가 정상인지
4. ✅ 서버가 정상 실행되는지

---

## 💡 대안: 선택적 롤백

전체 롤백 대신, 문제가 되는 부분만 되돌리는 방법:

1. **Owner 로그인 코드만 롤백**
   - `server/src/routes/ownerRoutes.js`만 어제 버전으로 복구
   - 디버깅 로그 제거

2. **관리자 회원 추가 로직만 롤백**
   - `server/src/controllers/userController.js`의 관리자 확인 로직만 단순화

어떤 방법을 선호하시나요?

