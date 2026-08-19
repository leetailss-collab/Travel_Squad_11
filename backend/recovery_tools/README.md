# 🛠️ Travel Squad 11 - 복구 및 백업 도구 (Recovery Tools)

본 폴더는 브라우저 캐시 분석, 개별 여행 카드 복구, 데이터베이스 백업을 위한 전용 유틸리티 도구 모음입니다.

---

## 📌 주요 도구 사용법 (Usage)

### 1. 🔍 브라우저 디스크 캐시 파싱 도구 (`parse_cache_folder.js`)
PC 상의 브라우저 디스크 캐시 폴더(`Cache_Data`)에서 수신되었던 원본 HTTP API 응답(JSON) 데이터를 자동으로 검색 및 추출합니다.

```bash
# 기본 사용법 (기본 경로 또는 대상 캐시 폴더 지정)
node recovery_tools/parse_cache_folder.js "C:/Users/user/Documents/Travel_Squad_11/캐시3"
```
- **기능**: GZIP 압축 해제, HTTP 헤더 제거, 여행 카드 JSON 자동 파싱 및 `extracted_cache_plans.json` 생성

---

### 2. 🛡️ 단일 여행 카드 안전 복원 도구 (`restore_single_plan.js`)
다른 여행 카드를 건드리지 않고, 특정 1개 여행 카드만 안전하게 Firestore DB 및 local `plans.json`에 복원/업데이트합니다.

```bash
# JSON 파일 지정하여 복원 실행
node recovery_tools/restore_single_plan.js discovered_original_plan3_authentic.json
```
- **기능**: Firestore `plans/{id}` 단일 문서 안전 set + `backend/data/plans.json` 동기화

---

### 3. 💾 전체 DB 실시간 백업 도구 (`backup_live_db.js`)
현재 라이브 Firestore의 모든 여행 카드(`plans`), 사용자(`users`), 알림 로그(`notifications`)를 날짜별 폴더로 백업합니다.

```bash
node recovery_tools/backup_live_db.js
```
- **저장 위치**: `backend/backups/backup_YYYYMMDD/`

---

## 📁 백업 파일 보존 위치

- 오늘자 백업 폴더: `backend/backups/backup_20260819/`
  - `plans_20260819.json` (복원 완료된 여행 카드 전체)
  - `users_20260819.json` (프로필 사진 매핑 완료된 사용자 전체)
  - `notifications_20260819.json` (감사 알림 전체)
  - `full_database_backup_20260819.json` (통합 백업 파일)
