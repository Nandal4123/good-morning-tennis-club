# 안전 전환 플로우 (병행 배포 → 검증 → 전환 → 롤백)

목표: **현재 배포된 Good Morning Club(구버전)을 유지**하면서, 멀티클럽/Owner 대시보드가 포함된 **신버전을 안전하게 배포**하고, 검증 후 **URL만 전환**합니다.

---

## 1) 원칙 (이 3가지만 지키면 안전)

- **병행 배포**: 기존(OLD)과 신규(NEW)를 동시에 살아있게 유지
- **전환은 URL/DNS만**: 서비스가 준비되면 “주소만 바꿔치기”
- **롤백은 즉시 가능**: 문제가 생기면 URL/DNS를 OLD로 되돌리면 끝

---

## 2) 준비물 체크

### 코드/DB

- 최신 코드가 GitHub에 반영됨
- DB 스키마는 최신 반영됨(특히 `Visit` 포함)
  - 로컬에서 이미 실행했다면 OK: `pnpm run db:push`

### 서버(Render) 환경변수(NEW 서버에 설정)

> ⚠️ **중요**: 아래 항목들의 **실제 값(비밀번호/토큰/DB URL)은 이 문서나 GitHub에 절대 적지 마세요.**
> Render/Vercel의 Environment Variables 화면에만 입력하는 것이 안전합니다.

- **`DATABASE_URL`**
  - 값: OLD Render에서 쓰는 DB URL을 그대로 복사 → NEW Render에 붙여넣기
  - 권장 옵션 포함: `pgbouncer=true&connection_limit=1&connect_timeout=15`
- **`MULTI_TENANT_MODE`** = `true`
- **`OWNER_PASSWORD`** = (운영자가 정한 값, Render에만 입력)
- **`OWNER_TOKEN_SECRET`** = (랜덤 긴 값, Render에만 입력)

### 클라이언트(Vercel) 환경변수(NEW 클라이언트에 설정)

- **`VITE_API_URL`**: NEW Render 서버 주소 + `/api`
- **`VITE_MULTI_TENANT_MODE=true`**
- (권장) `VITE_CLUB_SUBDOMAIN=default`

---

## 3) 병행 배포: NEW 서버(Render)

1. Render에서 **새 Web Service**를 하나 더 만듭니다.
   - 예: `tennis-club-server-v2`
2. 레포 연결 후 `render.yaml`을 사용하도록 설정(또는 동일 설정 복사)
3. 환경변수(위 목록) 입력
4. 배포 후 Health 체크
   - `GET /api/health`가 `200`인지

> 주의: `render.yaml`에 `prisma db push --accept-data-loss`가 있으면 위험할 수 있습니다.  
> “완전 안전 모드”로 가려면 최종 전환 전에 `--accept-data-loss` 제거를 권장합니다.

---

## 4) 병행 배포: NEW 클라이언트(Vercel)

1. Vercel에서 프로젝트를 새로 만듭니다.
   - Root: `club-attendance/client`
2. 환경변수 설정:
   - `VITE_API_URL`은 **NEW Render 서버**를 가리켜야 함
3. 배포 완료 후 접속

---

## 5) 검증 체크리스트(전환 전 필수)

NEW 클라이언트에서 아래를 모두 확인합니다.

### 클럽 분리/표시

- `/?club=default` → Good Morning 데이터만
- `/?club=ace-club` → Ace 데이터만
- `/?club=club-blue` → 청우회 데이터만

### Owner 대시보드

- `/?club=default&owner=1`에서 Owner 로그인 버튼 노출
- Owner 로그인 성공 후 `/owner` 진입
- 클럽 목록/요약이 **500 없이** 로드됨
- “이동/새 탭”이 정상 동작(클럽 화면으로 이동)
- 운영 설정(가입코드/관리자비번 저장) 저장 성공

### 일반 사용자 플로우

- 회원가입 승인코드 검증이 정상 동작(클럽별)
- 관리자 비밀번호 검증이 정상 동작(클럽별)
- 경기 등록/출석/통계 화면이 로드됨

### 오늘 접속자(고유)

- 일반 브라우저로 접속 후 Owner 요약의 “오늘 접속자(고유)”가 증가
- 시크릿 창으로 접속 시 추가 증가(테스트 용이)

---

## 6) 전환(Go Live)

전환은 “URL”만 바꿉니다.

- 기존 도메인(또는 링크)을 **NEW Vercel**로 교체
- API는 NEW Vercel이 NEW Render를 바라보도록 유지

> 가능하면 저녁/새벽 등 트래픽이 적을 때 전환하세요.

---

## 7) 롤백(문제 발생 시 즉시)

전환 후 문제가 생기면:

- 도메인/링크를 **OLD Vercel**(또는 기존 배포 주소)로 다시 돌립니다.
- 서버(Render)도 OLD/NEW 둘 다 살아있으므로 서비스 중단 없이 복구가 됩니다.

---

## 8) 전환 후 정리(안정화 단계)

- OLD 배포는 1~2주 정도 유지 후 종료(완전 안정화 확인)
- `--accept-data-loss` 제거(안전성 강화)
- 스냅샷/복구 문서(`RECOVERY.md`)대로 정기 백업 루틴 확정
