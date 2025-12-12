# DATABASE_URL 설정 옵션

## 프로젝트 정보

- **프로젝트 이름**: Good_morning club
- **project-ref**: tzulmmiudjcoghipoynq
- **password**: rjgkqeh12dlfdl
- **리전**: aws-1-ap-northeast-2

---

## 옵션 1: connect.psdb.cloud (Direct Connection - 권장 시도)

```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.connect.psdb.cloud:5432/postgres?sslmode=require&connection_limit=10
```

**특징:**
- Direct Connection (연결 풀 제한 없음)
- `sslmode=require` 필요
- 최대 100개 연결 가능

---

## 옵션 2: pooler 사용하되 pgbouncer 제거

```
postgresql://postgres.tzulmmiudjcoghipoynq:rjgkqeh12dlfdl@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?connection_limit=10
```

**특징:**
- pooler 사용하지만 pgbouncer 파라미터 제거
- 연결 제한이 Transaction Mode보다 높을 수 있음

---

## 옵션 3: Supabase 대시보드에서 확인한 정확한 형식

Supabase 대시보드에서 확인한 Direct Connection 문자열을 사용하세요:

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트: **Good_morning club** 선택

2. **Settings → Database** 클릭

3. **Connection string** 섹션에서:
   - **"Direct connection"** 또는
   - **"Connection pooling"** → **"Direct"** 옵션 선택
   - 표시된 연결 문자열 복사

4. **비밀번호 교체**
   - `[PASSWORD]` 부분을 `rjgkqeh12dlfdl`로 교체

5. **connection_limit 추가**
   - 연결 문자열 끝에 `&connection_limit=10` 추가 (없으면)

---

## Render Environment 설정 방법

1. Render 대시보드 → 서비스 선택 → **Environment** 탭
2. `DATABASE_URL` 환경 변수 찾기
3. 위 옵션 중 하나를 선택하여 입력
4. **Save Changes** 클릭
5. 서버 자동 재시작 대기 (1-2분)

---

## 테스트 순서

1. **옵션 1 시도** (connect.psdb.cloud)
2. 실패 시 **옵션 2 시도** (pooler, pgbouncer 제거)
3. 여전히 실패 시 **Supabase 대시보드에서 정확한 형식 확인**

---

## 확인 방법

변경 후 API 테스트:
```bash
curl https://tennis-club-server.onrender.com/api/users/1/stats
```

정상 응답이 오면 성공!


