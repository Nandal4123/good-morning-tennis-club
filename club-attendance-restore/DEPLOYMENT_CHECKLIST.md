# ✅ 배포 체크리스트

다른 클럽이 이 앱을 배포할 때 확인해야 할 항목들을 정리했습니다.

---

## 📋 배포 전 체크리스트

### 1. 저장소 준비
- [ ] GitHub에서 저장소 Fork 또는 Template 사용
- [ ] 로컬에 클론 완료
- [ ] Git 설정 확인

### 2. Supabase 설정
- [ ] Supabase 계정 생성
- [ ] 새 프로젝트 생성
- [ ] 프로젝트 이름 설정 (예: "my-tennis-club")
- [ ] 데이터베이스 비밀번호 설정 및 저장
- [ ] 리전 선택 (가까운 지역)
- [ ] **Transaction Mode** 연결 문자열 복사
- [ ] 연결 문자열에 `pgbouncer=true&connection_limit=1` 포함 확인

### 3. 로컬 환경 설정
- [ ] Node.js 설치 확인 (v18 이상)
- [ ] pnpm 설치 확인
- [ ] `server/.env` 파일 생성
- [ ] `DATABASE_URL` 환경 변수 설정
- [ ] `PORT` 환경 변수 설정 (기본: 5001)
- [ ] `CLIENT_URL` 환경 변수 설정 (로컬: http://localhost:5173)
- [ ] `client/.env.local` 파일 생성 (선택사항)
- [ ] `VITE_API_URL` 환경 변수 설정 (로컬: http://localhost:5001/api)

### 4. 데이터베이스 마이그레이션
- [ ] `server` 폴더로 이동
- [ ] `pnpm install` 실행
- [ ] `pnpm run db:push` 실행
- [ ] 마이그레이션 성공 확인
- [ ] Supabase 대시보드에서 테이블 생성 확인

### 5. 로컬 테스트
- [ ] 서버 실행: `pnpm run dev` (포트 5001)
- [ ] 클라이언트 실행: `pnpm run dev` (포트 5173)
- [ ] 브라우저에서 http://localhost:5173 접속
- [ ] 회원가입 테스트
- [ ] 로그인 테스트
- [ ] 출석 체크 테스트
- [ ] 경기 등록 테스트

### 6. Render 배포 (백엔드)
- [ ] Render 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 새 Web Service 생성
- [ ] Root Directory: `server` 설정
- [ ] Build Command: `pnpm install && pnpm run db:push`
- [ ] Start Command: `pnpm start` 또는 `node src/index.js`
- [ ] Environment Variables 설정:
  - [ ] `DATABASE_URL` (Supabase Transaction Mode)
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5001` (또는 Render가 할당한 포트)
  - [ ] `CLIENT_URL` (Vercel URL)
- [ ] 서비스 배포 및 실행 확인
- [ ] Health check 엔드포인트 확인: `https://your-service.onrender.com/health`

### 7. Vercel 배포 (프론트엔드)
- [ ] Vercel 계정 생성
- [ ] GitHub 저장소 연결
- [ ] 새 프로젝트 생성
- [ ] Root Directory: `client` 설정
- [ ] Framework Preset: Vite 선택
- [ ] Environment Variables 설정:
  - [ ] `VITE_API_URL` (Render 서버 URL + `/api`)
- [ ] 배포 실행
- [ ] 배포된 URL 확인
- [ ] 앱 정상 작동 확인

### 8. 환경 변수 최종 확인
- [ ] Render의 `CLIENT_URL`을 Vercel URL로 업데이트
- [ ] Vercel 재배포 (환경 변수 변경 반영)
- [ ] CORS 설정 확인

### 9. 관리자 계정 생성
- [ ] 앱에서 회원가입
- [ ] Supabase SQL Editor 접속
- [ ] 다음 SQL 실행:
  ```sql
  UPDATE users 
  SET role = 'ADMIN' 
  WHERE email = 'your-email@example.com';
  ```
- [ ] 로그아웃 후 재로그인
- [ ] 관리자 권한 확인 (회원 관리 메뉴 표시 확인)

### 10. 최종 테스트
- [ ] 회원가입/로그인
- [ ] 출석 체크
- [ ] 경기 등록
- [ ] 경기 점수 입력
- [ ] 대시보드 통계 확인
- [ ] 월별 랭킹 확인
- [ ] 모바일 반응형 확인

---

## 🔧 문제 해결

### 데이터베이스 연결 오류
- [ ] `DATABASE_URL`에 `pgbouncer=true&connection_limit=1` 포함 확인
- [ ] Supabase 프로젝트가 활성화되어 있는지 확인
- [ ] 비밀번호가 올바른지 확인

### CORS 오류
- [ ] Render의 `CLIENT_URL`이 Vercel URL과 일치하는지 확인
- [ ] Vercel의 `VITE_API_URL`이 Render URL과 일치하는지 확인

### 빌드 실패
- [ ] `package.json`의 스크립트 확인
- [ ] Node.js 버전 확인 (v18 이상)
- [ ] 환경 변수 설정 확인

---

## 📝 배포 후 확인사항

- [ ] 정기 백업 설정 (Supabase 자동 백업 확인)
- [ ] 모니터링 설정 (Render, Vercel 로그 확인)
- [ ] 도메인 연결 (선택사항)
- [ ] SSL 인증서 확인 (자동 적용됨)

---

## 🆘 도움이 필요하신가요?

- **상세 가이드**: [`SETUP_GUIDE.md`](./SETUP_GUIDE.md)
- **빠른 시작**: [`QUICK_START.md`](./QUICK_START.md)
- **문제 해결**: [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)
- **배포 옵션**: [`DEPLOYMENT_OPTIONS.md`](./DEPLOYMENT_OPTIONS.md)

---

**축하합니다! 🎉 여러분의 테니스 클럽 앱이 준비되었습니다!**

