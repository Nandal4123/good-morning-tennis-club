# 🚀 빠른 시작 가이드 (5분 요약)

다른 클럽이 이 앱을 빠르게 시작하기 위한 간단한 가이드입니다.

---

## 📌 필수 단계 (순서대로)

### 1️⃣ 저장소 준비 (2분)

```bash
# GitHub에서 Fork 또는 다운로드
git clone https://github.com/your-username/good-morning-tennis-club.git
cd good-morning-tennis-club
```

### 2️⃣ Supabase 설정 (3분)

1. https://supabase.com 가입
2. 새 프로젝트 생성
3. Database → Connection string 복사 (Transaction Mode)
4. 비밀번호 저장 (나중에 필요)

### 3️⃣ 환경 변수 설정 (2분)

**`server/.env` 파일 생성:**
```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### 4️⃣ 로컬 실행 (3분)

```bash
# 서버 실행
cd server
pnpm install
pnpm run db:push
pnpm run dev

# 새 터미널에서 클라이언트 실행
cd client
pnpm install
pnpm run dev
```

### 5️⃣ 배포 (10분)

**Render (백엔드):**
- GitHub 저장소 연결
- Root Directory: `server`
- Build: `pnpm install && pnpm run db:push`
- Start: `pnpm run dev`
- 환경 변수: `DATABASE_URL` 설정

**Vercel (프론트엔드):**
- GitHub 저장소 연결
- Root Directory: `client`
- 환경 변수: `VITE_API_URL=https://your-server.onrender.com/api`

### 6️⃣ 관리자 계정 생성 (1분)

1. 앱에서 회원가입
2. Supabase SQL Editor에서:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

---

## ✅ 완료!

이제 여러분의 클럽 앱이 준비되었습니다! 🎾

**자세한 설명은 `SETUP_GUIDE.md`를 참고하세요.**

