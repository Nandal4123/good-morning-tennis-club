# 서버 재시작 가이드

## 🚀 Render 서버 재시작 방법

### 방법 1: Manual Deploy (권장)

1. **Render 대시보드 접속**
   - https://dashboard.render.com 접속
   - 로그인

2. **서비스 선택**
   - `good-morning-tennis-club-v2` 서비스 선택
   - (또는 현재 사용 중인 서버 이름)

3. **Manual Deploy 실행**
   - 상단 메뉴에서 **"Manual Deploy"** 클릭
   - **"Clear build cache & deploy"** 선택
   - **"Deploy latest commit"** 클릭

4. **배포 완료 대기**
   - 배포 진행 상황 확인 (2-5분 소요)
   - Status가 **"Live"** (초록색)로 변경되면 완료

### 방법 2: 서비스 재시작

1. **Render 대시보드 접속**
2. **서비스 선택**
3. **상단 메뉴에서 "Restart" 버튼 클릭**
   - (일부 플랜에서는 이 옵션이 없을 수 있음)

## ✅ 배포 완료 확인

### 1. Health Check
```bash
curl https://good-morning-tennis-club-v2.onrender.com/api/health
```

**예상 응답**:
```json
{"status":"ok","timestamp":"2025-12-18T..."}
```

### 2. Render 대시보드에서 확인
- **Status**: Live (초록색)
- **Last Deploy**: 방금 전 시간
- **Logs 탭**: 에러 메시지 없음

## 📝 참고사항

- Manual Deploy는 최신 Git 커밋을 배포합니다
- "Clear build cache & deploy"는 빌드 캐시를 지우고 새로 빌드합니다
- 배포 중에는 서비스가 일시적으로 중단될 수 있습니다 (1-2분)

## 🔍 문제 발생 시

1. **Logs 탭 확인**: 에러 메시지 확인
2. **Environment 탭 확인**: 환경 변수 설정 확인
3. **Health Check**: 서버가 정상적으로 응답하는지 확인



