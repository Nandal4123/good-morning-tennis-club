# 🎾 Good Morning Club - Tennis Club Attendance System

테니스 클럽 출석 관리 시스템입니다. 회원 관리, 출석 체크, 경기 기록 등을 관리할 수 있습니다.

## ✨ 주요 기능

- **대시보드**: 오늘의 세션, 출석 현황, 통계 확인
- **출석 관리**: 빠른 출석 체크, 출석/결석 기록
- **회원 관리**: 회원 등록, 레벨 관리
- **경기 기록**: 단식/복식 경기 기록, 점수 관리
- **다국어 지원**: 한국어/영어 지원

## 🛠 기술 스택

### Frontend
- React 18
- React Router v7
- Tailwind CSS
- i18next (다국어)
- Lucide React (아이콘)
- Vite

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL

## 📦 설치 및 실행

### 1. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고, 서버 환경 변수를 설정합니다.

```bash
# server/.env 파일 생성
DATABASE_URL="postgresql://username:password@localhost:5432/club_attendance?schema=public"
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 2. 서버 설정

```bash
cd club-attendance/server
pnpm install
pnpm db:generate  # Prisma 클라이언트 생성
pnpm db:push      # 데이터베이스 스키마 적용
```

### 3. 클라이언트 설정

```bash
cd club-attendance/client
pnpm install
```

### 4. 실행

**서버 실행:**
```bash
cd club-attendance/server
pnpm dev
```

**클라이언트 실행:**
```bash
cd club-attendance/client
pnpm dev
```

### 5. 접속

브라우저에서 http://localhost:5173 접속

## 📁 프로젝트 구조

```
club-attendance/
├── client/                 # 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── i18n/           # 다국어 설정
│   │   ├── lib/            # 유틸리티 (API 등)
│   │   └── App.jsx
│   └── package.json
│
├── server/                 # 백엔드
│   ├── src/
│   │   ├── controllers/    # 비즈니스 로직
│   │   ├── routes/         # API 라우트
│   │   └── index.js
│   ├── prisma/
│   │   └── schema.prisma   # 데이터베이스 스키마
│   └── package.json
│
└── README.md
```

## 🔗 API 엔드포인트

### Users
- `GET /api/users` - 모든 사용자 조회
- `POST /api/users` - 사용자 생성
- `GET /api/users/:id` - 사용자 상세 조회
- `PUT /api/users/:id` - 사용자 수정
- `DELETE /api/users/:id` - 사용자 삭제

### Sessions
- `GET /api/sessions` - 모든 세션 조회
- `GET /api/sessions/today/current` - 오늘 세션 조회
- `POST /api/sessions` - 세션 생성

### Attendances
- `GET /api/attendances` - 모든 출석 조회
- `POST /api/attendances` - 출석 체크
- `POST /api/attendances/checkin` - 빠른 출석 체크

### Matches
- `GET /api/matches` - 모든 경기 조회
- `POST /api/matches` - 경기 생성
- `POST /api/matches/:id/score` - 점수 업데이트

---

Made with ❤️ for Good Morning Club 🎾

