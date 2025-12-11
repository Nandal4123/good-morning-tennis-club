# 🚨 DATABASE_URL 형식 오류 해결

## 현재 오류
```
error: Error validating datasource `db`: the URL must start with the protocol `postgresql://` or `post`
```

## 원인
Render 서버의 `DATABASE_URL` 환경 변수가:
- 설정되지 않았거나
- 잘못된 형식이거나
- 따옴표로 감싸져 있거나
- 공백이 포함되어 있을 수 있습니다

## ✅ 해결 방법

### Render 대시보드에서 DATABASE_URL 설정

1. **Render 대시보드 접속**
   - https://dashboard.render.com
   - `tennis-club-server` 서비스 선택

2. **Environment 탭 클릭**

3. **DATABASE_URL 찾기**
   - 없으면: **"Add Environment Variable"** 클릭
   - 있으면: **Edit** 클릭

4. **다음 값 입력** (따옴표 없이):
   ```
   postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
   ```

   ⚠️ **중요**:
   - 따옴표(`"` 또는 `'`)를 사용하지 마세요
   - 앞뒤 공백이 없어야 합니다
   - 전체를 한 줄로 입력하세요

5. **Save Changes 클릭**

6. **Manual Deploy → Clear build cache & deploy**

7. **배포 완료까지 대기 (2-5분)**

## ✅ 올바른 DATABASE_URL 형식

```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connect_timeout=15
```

**구성 요소**:
- 프로토콜: `postgresql://`
- 사용자: `postgres.tzulmmiudjcoghipoynq`
- 비밀번호: `rjgkqeh12dlfdl`
- 호스트: `aws-1-ap-northeast-2.pooler.supabase.com`
- 포트: `5432`
- 데이터베이스: `postgres`
- 파라미터: `?pgbouncer=true&connect_timeout=15`

## ❌ 잘못된 형식 예시

```
"postgresql://..."  (따옴표 포함)
'postgresql://...'  (따옴표 포함)
postgresql://...   (공백 포함)
postgres://...     (잘못된 프로토콜)
```

## 확인 방법

배포 완료 후:

```bash
curl https://tennis-club-server.onrender.com/api/health
curl https://tennis-club-server.onrender.com/api/users
```

**예상 결과**: 모든 API가 정상 응답

## 문제 해결 체크리스트

- [ ] DATABASE_URL 환경 변수가 존재하는지
- [ ] 따옴표 없이 입력했는지
- [ ] `postgresql://`로 시작하는지
- [ ] `?pgbouncer=true&connect_timeout=15` 파라미터가 있는지
- [ ] 앞뒤 공백이 없는지
- [ ] 서버를 재시작했는지

