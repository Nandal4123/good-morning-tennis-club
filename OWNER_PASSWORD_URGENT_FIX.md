# 🚨 OWNER_PASSWORD 문제 긴급 해결 가이드

## 문제 상황
"서버 환경 변수 OWNER_PASSWORD가 설정되어야 합니다." 메시지가 계속 나타남

---

## ✅ 즉시 확인할 사항

### 1단계: Render 환경 변수 확인 (가장 중요!)

1. **Render 대시보드 접속**
   - https://dashboard.render.com
   - `good-morning-tennis-club-v2` 서비스 선택

2. **Environment 탭 클릭**

3. **`OWNER_PASSWORD` 변수 확인:**
   - ✅ 변수가 **존재**하는가?
   - ✅ 값이 정확히 **`owner2025`**인가? (9자)
   - ❌ 앞뒤에 **공백**이 없는가?
   - ❌ 따옴표가 포함되어 있지 않은가?

4. **`OWNER_TOKEN_SECRET` 변수 확인:**
   - ✅ 변수가 **존재**하는가?
   - ✅ 값이 **긴 랜덤 문자열**인가?

### 2단계: 환경 변수 재설정 (문제가 있으면)

1. **`OWNER_PASSWORD` 삭제 후 재추가:**
   - 변수 삭제
   - 새로 추가: `OWNER_PASSWORD` = `owner2025` (따옴표 없이)
   - **Save Changes** 클릭

2. **`OWNER_TOKEN_SECRET` 확인:**
   - 값이 없으면 새로 생성 (랜덤 긴 문자열)
   - **Save Changes** 클릭

### 3단계: Manual Deploy 실행

1. **Manual Deploy** 클릭
2. **Clear build cache & deploy** 선택
3. 배포 완료까지 대기 (2-5분)

---

## 🔍 배포 후 진단

### 방법 1: 서버 시작 로그 확인

배포 완료 후 Render 로그에서 다음 메시지 확인:

```
🔍 [Server Start] 환경변수 확인:
  - OWNER_PASSWORD 설정됨: true/false
  - OWNER_PASSWORD 길이: ?
  - OWNER_TOKEN_SECRET 설정됨: true/false
```

**문제가 있는 경우:**
- `OWNER_PASSWORD 설정됨: false` → Render에서 환경변수가 설정되지 않음
- `OWNER_PASSWORD 길이: 0` → 환경변수 값이 비어있음

### 방법 2: 디버깅 엔드포인트 확인

브라우저에서 접속:
```
https://good-morning-tennis-club-v2.onrender.com/api/owner/debug
```

**정상 응답 예시:**
```json
{
  "ownerPasswordConfigured": true,
  "ownerPasswordLength": 9,
  "ownerPasswordTrimmedLength": 9,
  "ownerPasswordFirstChar": "o",
  "ownerPasswordLastChar": "5",
  "ownerPasswordPreview": "own...2025",
  "ownerTokenSecretConfigured": true,
  "ownerTokenSecretLength": 64,
  "allOwnerEnvVars": ["OWNER_PASSWORD", "OWNER_TOKEN_SECRET"]
}
```

**문제가 있는 경우:**
- `ownerPasswordConfigured: false` → 환경변수가 설정되지 않음
- `ownerPasswordLength: 0` → 환경변수 값이 비어있음

---

## 🎯 근본 원인별 해결 방법

### 원인 1: Render에서 환경변수가 설정되지 않음
**해결:** 위의 "2단계: 환경 변수 재설정" 실행

### 원인 2: 환경변수 값에 공백이나 특수문자 포함
**해결:** 
- Render에서 변수 삭제
- 새로 추가: 값만 입력 (공백 없이)
- `owner2025` (따옴표 없이)

### 원인 3: 서버가 환경변수를 읽지 못함
**해결:**
- Manual Deploy → Clear build cache & deploy
- 서버 재시작 확인

### 원인 4: 환경변수 이름 오타
**확인:**
- 정확히 `OWNER_PASSWORD` (대문자)
- `owner_password` (소문자) ❌
- `OWNER_PASS` ❌

---

## 📋 체크리스트

배포 전:
- [ ] Render에서 `OWNER_PASSWORD` 변수 존재 확인
- [ ] 값이 정확히 `owner2025` (9자)인지 확인
- [ ] 앞뒤 공백 없음 확인
- [ ] `OWNER_TOKEN_SECRET` 변수 존재 확인

배포 후:
- [ ] Render 로그에서 서버 시작 메시지 확인
- [ ] `/api/owner/debug` 엔드포인트 접속하여 확인
- [ ] Owner 로그인 테스트

---

## 🆘 여전히 안 되면

1. **Render Shell 접속:**
   - Render 대시보드 → Shell 탭
   - 다음 명령 실행:
   ```bash
   echo $OWNER_PASSWORD
   echo $OWNER_TOKEN_SECRET
   ```

2. **결과 확인:**
   - 값이 출력되면 → 환경변수는 설정됨 (코드 문제)
   - 값이 비어있으면 → Render 설정 문제

3. **코드 문제인 경우:**
   - `server/src/routes/ownerRoutes.js` 확인
   - `process.env.OWNER_PASSWORD` 읽기 로직 확인

---

## 💡 참고

- 환경변수는 **대소문자 구분**합니다
- Render에서 환경변수 변경 후 **반드시 Manual Deploy** 필요
- "Clear build cache & deploy"를 사용하면 더 확실합니다



