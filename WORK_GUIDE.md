# 📑 [Travel Squad 11 - 업무 인수인계 및 개발 가이드]

> 본 문서는 다른 컴퓨터 환경이나 개발자가 본 프로젝트를 이어받아 동일한 맥락에서 즉시 개발을 지속할 수 있도록 작성된 **통합 업무 가이드**입니다.

---

## 📌 1. 프로젝트 개요 및 환경 정보

- **프로젝트명**: Travel Squad 11 (가족 여행 일정 관리 PWA 서비스)
- **배포 URL**: `https://travel-squad-73fe2.web.app/`
- **게스트 테스트 계정**:
  - **아이디**: `guest`
  - **비밀번호**: `guest0000`
  - **권한**: `👁️ 조회전용` (서버 및 클라이언트 단 데이터 생성/수정/삭제 차단)

### 🛠️ 기술 스택 (Tech Stack)
- **Frontend**: Vite + React (PWA v0.20.5, Service Worker 적용)
- **Backend**: Node.js Express + Firebase Firestore DB
- **API 연동**: Naver Map Open API (네이버 지도, 길찾기, 서치)
- **CSS System**: Vanilla CSS (`index.css` 기반 디자인 시스템)

---

## 🚀 2. 개발 및 서버 실행/배포 가이드

### 💻 로컬 개발 환경 실행
```bash
# 1. 프론트엔드 실행
cd frontend
npm run dev

# 2. 백엔드 실행
cd backend
npm start

# 3. 프론트엔드 빌드 검증
cd frontend
npm run build
```

### ☁️ GCP VM 운영 서버 배포 (Git Pull & PM2 재시작)
```bash
cd ~/Travel_Squad_11
git pull origin main
sudo pm2 restart travel-backend --update-env
```

---

## 🏛️ 3. 최근 주요 아키텍처 및 UX/UI 개선 이력

### ① 스크롤 반응형 FAB + 32px 하단 안전 여백
- 화면을 아래로 스크롤 시 `+` (Floating Action Button)이 부드럽게 아래로 자동 숨김(`transform: translateY(120px); opacity: 0; pointer-events: none;`) 처리됩니다.
- 스크롤을 위로 올리거나 멈추면 나타나며, 목록 하단에 32px 안전 여백이 적용되어 있습니다.

### ② 상단 헤더 탭 순서 및 규격 통일
- **헤더 버튼 순서**: **`홈` ➔ `일정` ➔ `장소` ➔ `준비물` ➔ `경비` ➔ `가족`**
- 기존 이모지 `🏠`를 **`홈`** 텍스트 버튼으로 변경하고 테두리(`border: 1px solid var(--border)`) 및 규격(`minWidth: 54px`)을 `"준비물"` 탭 너비에 맞춰 100% 동일하게 통일했습니다.

### ③ 모달 오버레이 계층 구조 (3단계 z-index)
모달 겹침 현상 방지를 위해 앱 전체 16개 모달의 z-index가 표준화되어 있습니다.
- **Level 1 (`1000 ~ 1100`)**: 1차 독립 모달 (`showModal`, `showAddTripModal`, `selectedDetailPlace`[1100] 등)
- **Level 2 (`1250 ~ 2000`)**: 2차 중첩 모달 (`alternativeForm`[1250], `editingPlace`[1250], `showTrashModal`[2000])
- **Level 3 (`3000`)**: 최상위 풀스크린 미디어 모달 (`lightboxImagesList` 사진 확대)

### ④ 1차 일정 상세 모달 (`selectedDetailPlace`) UI
- **2줄 컴팩트 헤더 구조**:
  - Line 1: `[카테고리 뱃지]` + `[전체 장소 타이틀]` & 우측 `[×]` (닫기)
  - Line 2: **`(✏️)` (수정)**, **`(📋)` (복사)**, **`(🗑️)` (삭제)** 28px 원형 아이콘 버튼 (왼쪽 정렬)
  - **삭제 안전장치**: `(🗑️)` 삭제 클릭 시 실수 방지 재확인 팝업(`window.confirm`)이 작동합니다.
- **Primary Content Action Bar**:
  - `[🗺️ 지도에서 보기]` 및 `[🎫 예약 필요 / ✅ 예약 완료]` 버튼은 `.btn-auto-width`(`flex: none !important; width: auto !important;`)가 적용되어 글자 길이에 맞춰 정갈하게 표시됩니다.

### ⑤ 2차 일정 상세 수정 모달 (`editingPlace`) UI
- **사진 드래그 앤 드롭 순서 변경 (Drag-and-Drop)**:
  - 업로드된 현장 사진 및 경로 지도 캡처 이미지를 마우스/손가락으로 드래그하여 순서를 자유롭게 변경할 수 있습니다.
- **헤더 우측 원형 아이콘 액션 버튼**:
  - 우측 상단에 **`(✓)` (저장)** 원형 버튼과 **`(×)` (닫기/취소)** 원형 버튼이 28px 대칭 구조로 들어갑니다.
- **중복 기능 완벽 제거**:
  - 복사(`📋`) 및 삭제(`🗑️`)는 1차 상세 모달에서만 제공하고 수정 모달에서는 완전 제거했습니다.
  - 닫기(`×`)와 취소(`[취소]`)가 동일하므로 하단 푸터(`modal-footer`)를 전면 삭제하여 모달 전체를 시원한 입력 폼으로 변환했습니다.

---

## 🔍 4. 향후 작업 시 유의사항

1. **`.btn-secondary-sm` CSS 주의점**:
   - `index.css`에 `.btn-secondary-sm`에 `flex: 1`이 설정되어 있으므로, 고유 크기가 필요한 버튼은 반드시 **`.btn-auto-width`** 또는 **`.icon-btn-circle`** 클래스를 함께 사용해야 늘어나지 않습니다.
2. **게스트 권한 변경 금지**:
   - `username === 'guest'`인 사용자는 백엔드 미들웨어(`backend/src/index.js`)에서 CUD(Create/Update/Delete) 요청이 HTTP 403으로 차단되므로 프론트엔드 `isGuest` 가드와 동기화되어 있어야 합니다.

---

## 🤝 5. 사용자 협업 및 AI 응대 표준 프로토콜 (AI Collaboration Protocol)

AI 어시스턴트는 본 프로젝트 작업 시 **사용자의 작업 스타일과 요청 처리 방식을 100% 일관되게 적용**합니다.

### 1. 사용자 지시 수용 및 분석 방식
- **현황 및 기능 간섭 분석 우선**: 사용자가 문제를 제기하거나 개선을 요청할 때, 섣불리 코드를 고치기 전에 **현황 파악 ➔ 기능 간섭 및 중복성 분석 ➔ 보편적 UX 디자인 대안 3가지 제시**의 절차를 거칩니다.
- **중복 기능의 과감한 정리**: 1차/2차 모달 간 기능이 중복되거나(예: 복사/삭제/취소 버튼), 시각적 노이즈를 유발하는 요소는 사용자의 의도에 맞춰 단일 진실점(Single Source)으로 깔끔하게 정돈합니다.

### 2. UI/UX 디자인 원칙
- **아이콘 전용 28px 원형 버튼 (`.icon-btn-circle`)**: 관리 기능(`✏️`, `📋`, `🗑️`, `✓`, `×`)은 텍스트 없이 28px 원형 아이콘 형태(`borderRadius: 50%`)로 디자인을 통일합니다.
- **자동 맞춤 폭 (`.btn-auto-width`)**: 메인 버튼들이 화면에 맞추어 억지로 100% 늘어나지 않도록 고유 텍스트 길이에 맞추는 `.btn-auto-width`를 적용합니다.
- **파괴적 액션 재확인 (`window.confirm`)**: 삭제(`🗑️`) 등 돌이킬 수 없는 작업에는 실수 방지 확인 팝업을 필수 포함합니다.
- **2줄 컴팩트 헤더 패턴**: 모바일 환경에서 긴 장소명이 버튼과 부딪쳐 생략(`...`)되는 현상을 방지하기 위해 타이틀과 아이콘 버튼 그룹을 2줄로 배치합니다.

### 3. 작업 프로세스 및 품질 검증 표준
- **실행 빌드 검증**: 코드 수정 후 반드시 `npm run build`를 실행하여 빌드 에러 0건임을 실증적으로 확인한 후 커밋합니다.
- **Conventional Commit & Git Push**: `feat:`, `fix:`, `style:`, `refactor:`, `docs:` 등의 커밋 라벨 규칙을 지켜 Git 커밋 후 `main` 브랜치로 즉시 push합니다.
- **정갈한 개조식 답변**: 작업 완료 후에는 이모지 bullet과 함께 변경 이유, 해결 내용, 확인 방법을 한눈에 알기 쉽게 개조식 한국어로 요약해 제공합니다.
