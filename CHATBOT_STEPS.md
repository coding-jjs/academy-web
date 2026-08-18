# A학원 챗봇 작업 로그

학부모·학생·교사·직원·원장이 **확인된 기록만** 질문할 수 있는 조회 전용 챗봇을 붙인 과정입니다.  
Gemini에 DB를 통째로 넣지 않고, 서버가 권한 스코프 안에서 요약한 JSON만 프롬프트에 붙입니다.

핵심 파일:

- `src/features/chatbot/types.ts`
- `src/features/chatbot/context.ts`
- `src/features/chatbot/prompt.ts`
- `src/app/api/chat/route.ts`
- `src/features/chatbot/ChatbotWidget.tsx`
- `src/components/layout/MemberShell.tsx` (학부모·학생)
- `src/components/layout/AdminShell.tsx` (교사·직원·원장)

---

## 공통 원칙

1. 조회는 서버에서만 (`import "server-only"`). `GEMINI_API_KEY`는 클라이언트로 나가지 않음.
2. 화면과 같은 함수를 재사용. 챗봇 전용 Prisma 우회 조회는 만들지 않음.
3. JSON에 없는 점수·학생·출결·수업은 추측 금지. 없으면 “확인된 기록이 없습니다”.
4. 성적 수정, 출결 정정, 연락처, UUID는 안내하지 않음.
5. 질문/답변 전문은 감사 로그에 남기지 않음 (`role`, `messageLength` 정도만).

---

## 1차 — 학부모·학생, 성적·오답 Q&A

범위: `PARENT` / `STUDENT`만. 출결·시간표·교사 셸은 아직 없음.

### Step 1 — 컨텍스트 JSON

- `types.ts`: `ChatbotGrade`, `ChatbotWrongNote`, `ChatbotStudentSnapshot`, `ChatbotContext` (`PARENT` | `STUDENT`)
- `context.ts`: `buildParentChatContext`, `buildStudentChatContext`
- 재사용: `getParentGradesChildren`, `getStudentGradesData`
- 성적/오답은 최근 10건. `id`·이메일·오답 정답 본문은 제외

### Step 2 — 프롬프트

- `prompt.ts`: `buildChatPrompt(context, userMessage)`
- 규칙 + `[데이터]` JSON + `[질문]`을 한 문자열로 합침
- Gemini 호출은 이 단계에서 하지 않음

### Step 3 — API

- `POST /api/chat`
- `auth()` → 역할 확인 → 컨텍스트 빌드 → `generateText(prompt)` → `{ reply }`
- 키가 없으면 안내 문구, Gemini 실패는 503 + 사용자용 `reply`

참고: 리포트 AI는 Gemini가 죽으면 템플릿 초안으로 대체하지만, 챗봇은 대체 본문이 없어서 실패가 바로 보임.  
모델 기본값이 `gemini-2.5-flash`일 때 신규 키는 404가 났고, `GEMINI_MODEL=gemini-3.6-flash`로 맞춤.

### Step 4 — 위젯

- `ChatbotWidget.tsx` + CSS
- `MemberShell`에 `role === "parent" | "student"`일 때만 마운트
- `fetch("/api/chat", { body: JSON.stringify({ message }) })`

### Step 5 — UX

- `createPortal(..., document.body)` + `position: fixed` (스크롤 고정)
- 첫 열기 welcome 말풍선 (`handleOpen`)
- 추천 질문은 대화 중에도 유지
- `prefers-reduced-motion`이면 스크롤 `auto`
- 성공 조회 후 `auditLog` (`CHATBOT_REQUEST`)

---

## 2차 — 학부모·학생 출결·시간표

역할은 그대로. JSON만 넓힘. `route.ts` 골격은 그대로.

### Step 2-1 — 타입

- `ChatbotAttendanceSummary`, `ChatbotSessionSummary`
- 스냅샷에 `attendances`, `todaySession`, `weekSessions`

### Step 2-2 — 컨텍스트 merge

- 학부모: `getParentAttendanceChildren` + `getParentTimetableData`를 **id로** 성적 자녀와 합침
- 학생: `getStudentTimetableData`로 주간 세션·오늘 수업. 월 출결 API가 없어 `attendances`는 `null`

### Step 2-3 — 프롬프트 규칙

- 출결·수업 시간도 JSON만 사용
- 학생 `attendances === null`이면 이번 달 출석 횟수를 만들지 말 것

### Step 2-4 — API 확인만

- 코드 변경 없음. 학부모/학생 질문으로 200 응답 확인

### Step 2-5 — 위젯 칩·welcome

- “이번 달 출석”, “오늘 수업”, “이번 주 시간표” 추가
- 학생 칩에는 “이번 달 출석 몇 번?”을 넣지 않음

---

## 3차 — 교사·직원·원장

같은 조회 전용. 범위는 `getStaffScope()` + `getStaffStudentsData()`.

### Step 3-1 — 타입

- `ChatbotContext`에 `DIRECTOR | TEACHER | STAFF`
- `viewAllStudents`, `students`, `truncated`

세션 역할은 `STAFF`, 셸 `role`은 `"employee"`.

### Step 3-2 — `buildStaffChatContext`

- 재원 `ENROLLED` + `studentScopeWhere`
- 목록 최대 20명, 넘으면 `truncated: true`
- 목록 스냅샷: 최근 성적 소수, `wrongNotes: []`, 출결 없음
- `getDirectorStudentsData`는 쓰지 않음 (연락처·상담이 섞임)

### Step 3-3 — 프롬프트

- `students`에 있는 이름만
- `truncated`면 요약이 일부라고 안내
- `viewerLabel`에 교사/직원/원장

### Step 3-4 — API

- `TEACHER` / `STAFF` / `DIRECTOR` 허용
- staff면 `buildStaffChatContext(...)`

### Step 3-5 — 위젯 + AdminShell

- `ChatRole`에 `teacher` | `employee` | `director`
- `AdminShell`에 로그인 시 `<ChatbotWidget role={role} />`

이 시점의 한계: 목록 20명 밖 학생, 오답 상세, 스태프 출결은 아직 약함. 담당이 적으면 이름만으로도 요약 답은 됨.

---

## 4-A — 스태프 “이름 지정 → 학생 1명 상세”

목록 JSON을 키우지 않고, 질문에 이름이 있으면 그 학생만 다시 조회.

### 4-A-1 — 타입 + placeholder

- `focusedStudent`, `focusedStatus`: `"none" | "matched" | "ambiguous" | "not_found"`
- 처음엔 `null` / `"none"`만 넣고 typecheck 맞춤
- 인자 순서는 `(userId, viewerName, role)` 유지 (질문을 3번째로 넣으면 역할 문자열이 질문이 됨)

### 4-A-2 — 이름 매칭

- 스코프 안 `findMany({ select: { id, name } })` (20명 잘림과 무관)
- `message.includes(이름)`, 긴 이름 우선
- 0 → `none`, 1 → `matched`, 2+ → `ambiguous`
- staff 프롬프트 JSON은 `students`만이 아니라 **전체 context**

### 4-A-3 — `loadFocusedStudent`

- `matched`일 때만
- `findFirst`로 id + `studentScopeWhere` 재확인 후 `getGradesManagementData`
- 성적·오답 최대 10건. 문항 정답 본문 제외
- 출결 필드는 아직 비움

### 4-A-4 — 프롬프트

- `focusedStudent` 우선
- `ambiguous`면 한 명 추측 금지
- `truncated` = 요약이 일부. 이름은 물어보면 상세 가능 (목록에 없으면 무조건 불가라고 하지 않음)

### 4-A-5 — 위젯

- staff welcome: 이름 넣으면 성적·오답이 더 정확함
- 칩에 실명 하드코딩 금지
- staff 헤더에서 아직 없는 출석을 단정하지 않음 (출석은 4-B)

---

## 4-B — 스태프 focusedStudent에 출결·시간표

20명 `students`에는 넣지 않음. 이름 매칭된 1명만.

학부모 함수·교사 출석부 전체 세션 덤프는 쓰지 않음.

### 4-B-1 — 이번 달 출결 요약

- `loadFocusedStudent`에서 해당 `studentId`의 `attendanceRecord` count
- `attendances`: `monthLabel`, present / late / absent / earlyLeave
- `todaySession` / `weekSessions`는 아직 비움

### 4-B-2 — 오늘 수업·이번 주 시간표

- `getStaffAttendanceSessions({ startOfWeek, endOfWeek })`
- 그 학생 id가 들어 있는 세션만 `ChatbotSessionSummary`로 매핑
- `date`는 `YYYY-MM-DD` (`toDateLabel`) — 오늘과 비교하려고
- `todaySession` = `weekSessions` 중 오늘 첫 건
- 최대 10건

### 4-B-3 — 프롬프트

- focused가 있으면 성적·오답·출결·시간표 모두 그 학생 기준
- focused가 없으면 이번 달 출석/오늘 수업을 지어내지 말고 이름을 요청

### 4-B-4 — 위젯

- staff welcome·헤더에 출결 포함
- 출결 칩만 이름 없이 두지 않음 (`focusedStatus: none`이면 데이터가 없음)

---

## 현재 상태 (2026-08-18)

| 단계 | 상태 |
|------|------|
| 1차 학부모·학생 성적·오답 | 완료 |
| 1차 UX (Portal, welcome, 감사 로그) | 완료 |
| 2차 학부모·학생 출결·시간표 | 완료 (학생 월 출결 요약은 `null`) |
| 3차 스태프 목록 챗봇 | 완료 |
| 4-A 이름 → 1명 상세(성적·오답) | 완료 |
| 4-B focused 출결·주간 시간표 | 완료 |

아직 안 한 것 예:

- 상담 메모, 청구·수납, 학부모 연락처
- Gemini function calling
- 대화 히스토리 DB 저장
- 학생 계정 월 출결 전용 조회

---

## 동작 요약

```
질문 POST /api/chat { message }
  → auth + 역할
  → PARENT  → buildParentChatContext
     STUDENT → buildStudentChatContext
     그 외   → buildStaffChatContext(..., message)
              → 목록 20명 + 이름 매칭 시 focusedStudent(성적·오답·월출결·주간수업)
  → buildChatPrompt → generateText
  → { reply }
```

위젯은 `MemberShell`(학부모·학생), `AdminShell`(교사·직원·원장)에 플로팅.

---

## 테스트 메모

공통: `.env.local`에 `GEMINI_API_KEY`, `GEMINI_MODEL` (예: `gemini-3.6-flash`). 모델이 바뀌면 서버 재시작.

| 역할 | 질문 예 | 기대 |
|------|---------|------|
| 학부모 | 이번 달 출석, 오늘 수업 | 자녀 JSON 기준 |
| 학생 | 오늘 수업, 이번 주 시간표 | 본인 세션. 월 출석 횟수는 지어내지 않음 |
| 교사 등 | 담당 학생 최근 성적 요약 | 최대 20명 요약 |
| 교사 등 | `(이름) 오답` / `이번 달 출석` / `오늘 수업` | `focusedStudent` 상세 |
| 교사 등 | 담당 아닌 이름 | 확인 불가 |
| 교사 등 | 동명이인 | 한 명 추측하지 않음 |
