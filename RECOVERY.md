# 복구(Recovery) 가이드

이 문서는 “문제 발생 시 언제든지 지금 시점으로 되돌릴 수 있도록” 준비된 복구 절차를 정리합니다.

## 기본 원칙
- **DB 복구는 파괴적 작업**입니다. (기존 DB 데이터를 삭제하고 스냅샷으로 되돌림)
- 코드는 **현재 작업 폴더 덮어쓰기 위험**이 있으므로, 기본은 **별도 폴더로 복원**을 권장합니다.
- 안정적 운영을 위해 스냅샷은 **외부 저장소(클라우드/외장)에 복사**해 두는 것을 권장합니다.
- “안전하고 완벽한 복구”를 위해 **위험 작업 전/후 체크포인트 스냅샷 + 무결성 검증**을 습관화합니다.

---

## 스냅샷 구성
스냅샷은 `club-attendance/snapshots/snapshot-YYYY-MM-DDTHH-MM-SS/` 형태로 저장됩니다.

각 스냅샷 폴더에는:
- `db.json` : DB 데이터 덤프(JSON)
- `code.tar.gz` : 코드 아카이브(대용량 제외)
- `RESTORE_GUIDE.md` : 해당 스냅샷 기준 복구 안내

또한 최신 스냅샷을 가리키는 포인터:
- `club-attendance/snapshots/snapshot-latest.txt`

---

## 1) 스냅샷 생성(백업)
```bash
cd club-attendance/server
pnpm run db:snapshot
```

---

## 2) 스냅샷 목록/검증
### 목록 보기
```bash
cd club-attendance/server
pnpm run snapshot:list
```

### 최신 스냅샷 검증
```bash
cd club-attendance/server
pnpm run snapshot:verify
```

특정 스냅샷 검증:
```bash
cd club-attendance/server
pnpm run snapshot:verify -- --snapshot ../snapshots/snapshot-YYYY-MM-DDTHH-MM-SS
```

---

## 3) 코드 복구(안전하게 별도 폴더에)
기본 대상 폴더: `/tmp/club-attendance-restore` (빈 폴더만 허용)

```bash
cd club-attendance/server
pnpm run code:restore-snapshot -- --yes
```

대상 폴더 지정:
```bash
cd club-attendance/server
pnpm run code:restore-snapshot -- --dir /tmp/club-attendance-restore --yes
```

---

## 4) DB 복구(최신 스냅샷으로 완전 롤백)
⚠️ **기존 DB 데이터를 삭제하고 스냅샷으로 되돌립니다.**

```bash
cd club-attendance/server
pnpm run db:restore-snapshot -- --yes
```

### (중요) 복구 전 자동 2중 백업(pre-restore)
`db:restore-snapshot`는 복구를 실행하기 직전에 현재 DB를 `club-attendance/snapshots/pre-restore/`에 자동으로 백업합니다.
복구 도중 문제가 생겨도 “복구 직전 상태”로 다시 되돌릴 수 있는 **안전망**입니다.

> 예외적으로 생략하려면 `--no-prebackup` 옵션이 필요합니다(권장하지 않음).

특정 스냅샷 파일로 복구:
```bash
cd club-attendance/server
pnpm run db:restore-snapshot -- --file ../snapshots/snapshot-YYYY-MM-DDTHH-MM-SS/db.json --yes
```

---

## 5) 스냅샷 번들(오프사이트 보관용 단일 파일)
스냅샷 폴더를 단일 tar.gz로 묶어 **클라우드/외장으로 옮기기 쉽게** 합니다.

```bash
cd club-attendance/server
pnpm run snapshot:bundle
```

출력 예: `club-attendance/snapshots/snapshot-YYYY...tar.gz`

---

## 추천 운영 규칙(체크포인트)
운영 기능/마이그레이션/데이터 정리처럼 위험 작업을 하기 전에는 아래 2개를 **세트로** 실행하는 것을 추천합니다.

```bash
cd club-attendance/server
pnpm run db:snapshot
pnpm run snapshot:verify
```



