# ✅ 다음 단계: OWNER_PASSWORD 문제 해결

Render에서 `OWNER_PASSWORD`가 `owner2025`로 설정되어 있는 것을 확인했습니다.

---

## 🚀 즉시 실행할 단계

### 1단계: Manual Deploy 실행

1. **Render 대시보드에서:**
   - `good-morning-tennis-club-v2` 서비스 선택
   - **Manual Deploy** 클릭
   - **Clear build cache & deploy** 선택
   - 배포 완료까지 대기 (2-5분)

### 2단계: 서버 시작 로그 확인

배포 완료 후 Render **Logs 탭**에서 다음 메시지 확인:

```
🔍 [Server Start] 환경변수 확인:
  - OWNER_PASSWORD 설정됨: true  ← 이게 true여야 함
  - OWNER_PASSWORD 길이: 9        ← 이게 9여야 함
  - OWNER_TOKEN_SECRET 설정됨: true
```

**문제가 있는 경우:**
- `OWNER_PASSWORD 설정됨: false` → Render 설정 문제
- `OWNER_PASSWORD 길이: 0` → 값이 비어있음

### 3단계: 디버깅 엔드포인트 확인

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
  "ownerTokenSecretLength": 64
}
```

### 4단계: Owner 로그인 테스트

1. 앱에서 Owner 로그인 시도
2. 비밀번호: `owner2025` 입력
3. 정상 로그인되는지 확인

---

## 🔍 문제가 계속되면

### Render Shell에서 직접 확인

1. Render 대시보드 → **Shell 탭** 클릭
2. 다음 명령 실행:
   ```bash
   echo $OWNER_PASSWORD
   echo $OWNER_TOKEN_SECRET
   ```

**결과 해석:**
- 값이 출력되면 → 환경변수는 설정됨 (코드 문제 가능)
- 값이 비어있으면 → Render 설정 문제

---

## 📋 체크리스트

- [ ] Manual Deploy 실행 완료
- [ ] 서버 시작 로그에서 `OWNER_PASSWORD 설정됨: true` 확인
- [ ] `/api/owner/debug` 엔드포인트에서 `ownerPasswordConfigured: true` 확인
- [ ] Owner 로그인 테스트 성공

---

## 💡 참고

- 환경변수 변경 후 **반드시 Manual Deploy** 필요
- "Clear build cache & deploy"를 사용하면 더 확실합니다
- 배포 완료까지 2-5분 소요됩니다

