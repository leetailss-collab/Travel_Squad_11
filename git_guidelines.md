# 🚀 Travel Squad 11 - 개발 환경 세팅 & Git 동기화 트러블슈팅 가이드

이 문서는 집/회사/새 컴퓨터 등 **서로 다른 개발 환경에서 프로젝트를 새로 내려받거나 작업할 때 발생할 수 있는 오류(네이버 지도 API, ECONNREFUSED, 파이어베이스 키 미설정, 데이터 유실)를 100% 방지하기 위한 통합 가이드**입니다.

---

## 📌 1. 새 컴퓨터 환경 세팅 체크리스트 (3단계)

새 컴퓨터에서 최초 설치하거나 클론(`git clone`)한 후, 아래 **3개 파일 및 설정**이 구비되었는지 확인해 주세요.

### ① `backend/.env` 파일 생성 (네이버 지도 API 키)
네이버 지도 검색 및 길찾기/주소 변환(Geocoding)을 위해 `backend/` 폴더 바로 아래에 `.env` 파일이 있어야 합니다. 보안상 Git에 올라가지 않으므로 수동으로 만듭니다.

`backend/.env` 파일 내용 예시:
```env
PORT=5000
NAVER_CLIENT_ID=사용자의_네이버_클라이언트_ID
NAVER_CLIENT_SECRET=사용자의_네이버_클라이언트_SECRET
```
> ⚠️ **주의**: `.env` 파일이 없으면 프론트엔드에서 `/api/config/naver-client-id` 연동 실패 및 지도 API 오류가 발생합니다.

---

### ② `backend/firebase-service-account.json` 파일 복사 (Firebase 키)
Firestore 실시간 데이터베이스 연동을 위한 서비스 계정키 파일입니다. Git 추적에서 제외(`.gitignore`)되어 있습니다.

* **복사 위치**: `backend/firebase-service-account.json`
* **주의**: 이 파일이 없으면 백엔드 실행 시 파이어베이스 연동 오류가 뜨거나 데이터 저장이 취소될 수 있습니다. 기존 작업 컴퓨터나 백업 폴더에서 복사해 넣어주세요.

---

### ③ 의존성 패키지 설치 (`npm install`)
새로 클론한 경우 백엔드와 프론트엔드 폴더 각각에서 `npm install`을 실행합니다.

```bash
# 1) 백엔드 패키지 설치
cd backend
npm install

# 2) 프론트엔드 패키지 설치
cd ../frontend
npm install
```

---

## 🛠️ 2. 서버 실행 방법 & 자주 발생하는 오류 (FAQ)

### 🚀 서버 실행 (권장)
프로젝트 최상위 폴더에 있는 **`run_local.bat`** 배치 파일을 더블 클릭하여 실행합니다.

* **프론트엔드**: `http://localhost:3000` (Vite)
* **백엔드**: `http://localhost:5000` (Express API Server)

---

### ❓ FAQ 1: `AggregateError [ECONNREFUSED] /api/...` 오류가 발생해요!
* **원인**: 프론트엔드(Vite)는 구동 중이지만, 백엔드 Express 서버(포트 5000)가 꺼져있거나 실행되지 않았을 때 발생하는 프록시 연결 거부 오류입니다.
* **해결책**: 백엔드 서버가 5000번 포트에서 실행 중인지 확인하세요. `backend` 폴더로 이동하여 `npm run dev`를 실행하거나 `run_local.bat`으로 두 서버를 동시에 띄우세요.

---

### ❓ FAQ 2: 네이버 지도 검색이 안 되거나 주소 변환이 안 돼요!
1. `backend/.env` 파일에 `NAVER_CLIENT_ID`와 `NAVER_CLIENT_SECRET`이 제대로 작성되어 있는지 확인하세요.
2. 네이버 개발자 센터(Cloud Platform) 콘솔에서 등록된 App에 **`Web Dynamic Map`**과 **`Geocoding`** 서비스가 모두 선택되어 있는지 확인하세요.
3. 명확한 도로명 주소가 없는 관광지/장소명(예: `속초 중앙시장`, `성심당`)은 지도 검색 페이지로 자동 연결되는 **POI 명칭 검색 모드**로 작동합니다.

---

### ❓ FAQ 3: 업로드한 이미지가 엑박(Broken Image)으로 떠요!
* **원인**: 업로드된 이미지 파일(`backend/public/uploads/`)은 보안 및 용량 문제로 Git에 올리지 않도록 제외(`.gitignore`)되어 있습니다.
* **해결책**: 다른 컴퓨터로 이동하여 작업할 때 이전 컴퓨터의 `backend/public/uploads/` 폴더 안의 이미지 파일들을 새로운 컴퓨터의 동일 경로로 **수동 복사**해 주어야 합니다.

---

## 📌 3. Git 동기화 & 데이터 보호 수칙

| 항목 | Git 추적 여부 | 위험 요소 | 예방 및 해결책 |
| :--- | :---: | :--- | :--- |
| **`plans.json`**<br>(로컬 DB) | **O** | `git pull` 시 로컬 데이터 덮어쓰기 발생 | 1. Pull 직전 로컬 DB 복사/백업<br>2. 작업 완료 후 즉시 commit/push |
| **`uploads/`**<br>(업로드 이미지) | **X** | 기기 변경 시 업로드 이미지 보이지 않음 | 기기 이동 시 `backend/public/uploads` 수동 복사 |
| **`firebase-service-account.json`** | **X** | Firestore DB 연동 실패 | 새 컴퓨터 세팅 시 `backend/` 폴더에 파일 수동 복사 |
| **`backend/.env`** | **X** | 지도 API 인증 실패 | 새 컴퓨터 세팅 시 `backend/.env` 수동 작성 |

---

## 🚨 4. 비상 데이터 복구 요령 (로컬 스토리지 백업)

만약 Git 동기화 과정에서 최신 데이터가 덮어씌워졌더라도, 브라우저에 접속한 적이 있다면 로컬 백업본이 남아있습니다.

1. 크롬 브라우저에서 `F12` 키를 눌러 **개발자 도구**를 엽니다.
2. 상단 탭에서 **Application(애플리케이션)** 선택 ➔ **Local Storage ➔ http://localhost:3000** 클릭.
3. `family_travel_plans` 키에 있는 JSON 백업 데이터를 복사합니다.
4. 이 데이터를 복사하여 `backend/data/plans.json` 파일에 덮어씌운 뒤 서버를 재시작하면 원래 일정 데이터가 복구됩니다.
