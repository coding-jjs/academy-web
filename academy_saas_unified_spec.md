# A학원 SaaS — 통합 명세서 (현재 확정본)

> **본 문서만 따르면 된다.** `md/` 하위 버전별 파일(v1~v5, folder, server)을 현재 시점 기준으로 통합한 단일 원본이다.  
> 과거에 논의되었으나 **폐기된 항목(게스트「연결 대기」메인 UI, 문의→원생 자동 전환, 폴더 5분할 방안 B 등)은 기록하지 않는다.**

---

## 1. 서비스 개요

**서비스명:** (A학원 전용) 성적 향상 & 밀착 소통 특화 관리 시스템

**포지셔닝**

- 외부 CRM **비연동**. A학원 단독 운영
- 원생·수업·출결·성적·수납을 본 시스템에 **수동 등록·관리**
- Google **단일 로그인**만 사용
- 대구 지역 교육 정보(1차 수동, 공공 API 후순위)

**핵심 기능**

1. AI 학부모 리포트 (키워드 → 초안 → 교사 검수 → 원장 승인 → 쪽지·푸시)
2. 이탈(퇴원) 위험 **전자동 감지** + 상태 관리
3. 담당 학생 한정 RBAC + 감사 로그(열람 포함)
4. 토스페이먼츠 결제 MVP + 쪽지/푸시 딥링크
5. 학부모/학생 뷰 분리
6. 인앱 쪽지 + Web Push
7. 원장·권한 사무원의 **학부모↔자녀 수동 연결**

---

## 2. 의사결정 요약 (유효 항목만)

| ID | 주제 | 확정 |
|----|------|------|
| Q1 | CRM | 비연동 · A학원 단독 |
| Q2 | 로그인 | 전원 Google OAuth (Auth.js) |
| Q3 | 자녀 연동 | **수동 연결** (원장·권한 STAFF). 이미 Google 가입된 계정끼리만 |
| Q4 | 다중 역할 | 계정 1개 = 역할 1개 |
| Q5 | 부분 퇴원 | 퇴원 자녀만 차단. 다른 재원 자녀·학부모 계정 유지 |
| Q6 | 출결 | 교사/사무원 웹 체크. 학부모·학생 조회만. 하원=수업 종료 자동 |
| Q7 | 이탈 | 전자동 + 원장 임계값 설정 |
| Q8 | 권한 UI | **체크박스**로 권한 선택 후 **저장** 버튼으로 확정 |
| Q9 | 수납 | 원장+사무원만. 교사에게 부여 불가 |
| Q10 | 결제 MVP | 수동 청구 + 토스 + 미납 재알림. 환불·부분납·정기청구 제외 |
| Q11 | 생활/오답 | 생활기록부 + 오답 사진(OCR 없음) |
| Q14 | 푸시 | 전 역할 Web Push. 거부 시 쪽지함. iOS 홈화면 안내 |
| Q15-1 | AI PII | LLM에는 가명만. DB·학부모 노출은 실명 |
| Q15-2 | 보관 | 퇴원 후 개인정보 1년 → 파기/익명화 |
| Q15-3 | 감사 로그 | 강화+학생 열람. 원장만 조회. 1년 |
| Q15-4 | 퇴원 차단 | 즉시 제한 + 당일 00:00 KST까지 관련 데이터 조회만 가능 |
| Q16 | 출시 | 기능 전부 1차. 대구 API는 후순위(수동 우선) |
| Q17 | 쪽지 | 원장 기본. 교사 발송은 스위치 |
| Q18 | Sent | 쪽지 생성 + 푸시 **시도** 완료 (읽음 무관) |

---

## 3. 역할 · 클라이언트 · UX

### 3.1 역할

| Role | 셸 | 요약 |
|------|-----|------|
| `DIRECTOR` | AdminShell | 전권, 권한, 감사 로그, AI 승인, 쪽지, 설정, 수동 연결 |
| `TEACHER` | AdminShell | 담당 학생 중심. 수납 **불가** |
| `STAFF` | AdminShell | 출결·수납 등. `linkParentStudent` ON 시 연결 가능 |
| `PARENT` | MemberShell | 자녀, 결제, AI 리포트, 사유결석, 쪽지 |
| `STUDENT` | MemberShell | 시간표·출석·성적/오답·소식. 결제·AI코멘트·결석신청·상담 차단 |
| `GUEST` | MemberShell | **학원 소개·문의** (미연결 Google 사용자, 퇴원·연동 해제 후 포함) |

계정 1개 = 역할 1개. 필수 동의: 이용약관, 개인정보, 정보제공.

### 3.2 반응형

| 구분 | PC (≥768px) | Mobile |
|------|-------------|--------|
| 교직원 | 상단바 + 좌측 사이드바 | 사이드 축소·상단 중심 |
| 학부모·학생·게스트 | 상단 가로 메뉴, 콘텐츠 ~960px | 상단 바 + **하단 탭**, 풀폭 |
| 금지 | 가운데 폰 목업 프레임 | — |

PWA(Manifest·SW·홈화면 추가)는 모바일 푸시·설치 강화용.

### 3.3 GUEST (미연결 · 퇴원 후 공통)

퇴원·연동 해제·비활성화된 계정도 **별도 접근 거부 화면 없이 GUEST와 동일**하게 취급한다.

- 화면: 학원 소개·위치·전화·약도 자리·문의 (`/guest/waiting`, 메뉴「소개」)
- 하단 짧은 안내 허용: 「계정 연결 후 학부모·학생 기능을 이용할 수 있습니다」
- PARENT/STUDENT/교직원 전용 메뉴·API는 사용 불가

### 3.4 역할 → 기본 홈

| Role | Path |
|------|------|
| DIRECTOR | `/director/dashboard` |
| TEACHER / STAFF | `/staff/dashboard` |
| PARENT | `/parent/dashboard` |
| STUDENT | `/student/dashboard` |
| GUEST | `/guest/waiting` |

---

## 4. 운영 규칙 (R)

### R1. 첫 원장 (원장 초기 설정)

개발자가 **1회만** DIRECTOR 부여. DIRECTOR가 이미 있으면 거부. Self-elevate 금지.  
수단: 원장 초기 설정 (`BOOTSTRAP_SECRET` + API/CLI). 대상은 Google 로그인으로 User가 생긴 뒤.  
감사 로그: `BOOTSTRAP_DIRECTOR`.

### R1b. 원장 이양

현재 DIRECTOR만 실행. 대상 1명 → DIRECTOR, 기존 → TEACHER 또는 STAFF. 동시 원장 1명.  
감사 로그: `TRANSFER_DIRECTOR`.

### R2. 학부모–자녀 연결

- 셀프/자동 연동 **없음**
- 학부모·학생 각자 Google 가입 → GUEST → 원장 또는 **`linkParentStudent` ON인 STAFF**가 수동 연결 → `PARENT` / `STUDENT` + `ParentStudentLink`
- UI: 학생 상세「학부모 지정」, 학부모 상세「자녀 추가」
- **이미 가입된 계정만** 연결. 명부 선등록 후 Google 병합 **없음**
- 오연결: 즉시 해제·재연결. 회복 불가 시 개발자 DB 초기화
- 감사 로그: `PARENT_STUDENT_LINK` / `PARENT_STUDENT_UNLINK`

### R3. 학부모 수

자녀(학생)당 학부모 계정 **1명**. `ParentStudentLink.studentId` unique.  
다자녀: 동일 학부모에 여러 학생 연결 가능. 부모 동시 2계정 **미지원**(1차).

### R4. 사유 결석

신청 기록 + 알림만. 출석 **자동 반영 없음**. 승인/반려 워크플로 없음. 실제 결석은 출석 체크에서 처리.

### R6. 이탈 감지 기본값 (원장 변경 가능)

| 신호 | 기본값 |
|------|--------|
| `ATTENDANCE_DROP` | 최근 14일 출석률이 직전 14일 대비 **15%p** 이상 하락 |
| `SCORE_DROP` | 동일 과목 최근 평가가 직전 대비 **10점** 이상 하락 |
| `CONSECUTIVE_ABSENCE` | 연속 결석 **2**회 |
| `UNPAID_DAYS` | 미납 **3**일 이상 |

하나라도 충족 시 `DETECTED` (이미 COUNSELING 이상이면 사유 로그만 추가).

### R7. 게스트 문의

목록·상태(`NEW`/`IN_PROGRESS`/`DONE`/`SPAM`)·내부 메모만.  
**원생 등록 전환 없음.** 원생은 별도 수동 등록.

### R8. GUEST · 퇴원

| 시점 | 동작 |
|------|------|
| 미연결 Google 로그인 | role=`GUEST` → 학원 소개·문의 |
| 퇴원 처리 | 해당 학생 즉시 서비스 제한 + 당일 관련 데이터 **조회만**(~24:00 KST) |
| 당일 24:00 KST | 권한 초기화 · 연동 해제 · role=`GUEST` (학원 소개 UI). 별도 `/blocked` 없음 |
| 부분 퇴원 | 퇴원 자녀 연동만 해제. 다른 재원 자녀 있으면 학부모 유지 |
| 연결 해제 후 | 유효 연결 없으면 `GUEST` |

타임존: **Asia/Seoul**.

---

## 5. 권한 모델 (교사·사무원)

경로: `/director/permissions` — 목록 → 권한 설정 모달.

**저장 방식:** 각 권한을 **체크박스**로 켜고/끈 뒤 **저장** 버튼으로 DB에 반영한다.  
(역할 프리셋으로 체크 상태를 한 번에 채운 뒤, 체크박스를 개별 수정하고 저장하는 흐름도 가능.)

| 권한 항목 | 일반 교사 | 수석 교사 | 사무원 |
|--------|-----------|-----------|--------|
| 전체 학생 DB 조회 | OFF | ON | OFF(업무 시 ON 가능) |
| 학부모 연락처 열람 | OFF | OFF | ON 가능 |
| 생활기록부/상담 수정 | ON(담당) | ON | OFF |
| AI 리포트 작성 | ON | ON | OFF |
| AI 직발송(승인 스킵) | OFF | OFF | OFF |
| 본인 수업 출결/성적 | ON | ON | ON |
| 타 교사 출결/성적 수정 | OFF | OFF | ON 가능 |
| 쪽지 발송 | OFF | OFF | OFF(교사에게 별도 허용 가능) |
| 수납/결제 | **불가** | **불가** | ON |
| 학부모↔자녀 수동 연결 | OFF | OFF | ON 가능 |

전체 DB 조회 ON 시 경고. 연락처: 마스킹 + hover + 복사 방지, 서버도 권한 없으면 미전송.

---

## 6. 사이트 맵 (현재)

```
/
├── 인증·온보딩/
│   ├── /login (Google)
│   ├── 약관·동의
│   ├── PWA/푸시·iOS 홈화면 안내
│
├── 원장 /director/
│   ├── dashboard, churn, ai-reports
│   ├── classes (반·시간표)
│   ├── students (학부모 지정·연결 해제)
│   ├── parents (자녀 추가·연결 해제)
│   ├── permissions, users(GUEST 후보), audit(감사 로그)
│   ├── billing, messages, inquiries, news, settings
│
├── 교사·사무원 /staff/
│   ├── dashboard, attendance, students
│   ├── grades, ai-reports, counseling, billing(STAFF), messages
│
├── 학부모 /parent/
│   ├── 홈 /dashboard
│   │   └── 선택한 자녀의 오늘 일정·출결·새 리포트·알림 요약
│   ├── 일정 /schedule
│   │   └── 한 페이지: 시간표·출결 조회·사유결석 신청
│   ├── 학습 /learning
│   │   └── 한 페이지: 성적·오답·학습 리포트·AI 학부모 코멘트
│   ├── 알림 /inbox
│   │   └── 한 페이지: 학부모 공지·상담/결제 알림·학원/교사 쪽지
│   └── 더보기 /more
│       └── 한 페이지: 결제·학원 소식·자녀 관리·내 정보
│
├── 학생 /student/
│   ├── 홈 /dashboard
│   │   └── 오늘 수업·출결·학습 현황·새 공지 요약
│   ├── 일정 /schedule
│   │   └── 한 페이지: 시간표·출결 조회
│   ├── 학습 /learning
│   │   └── 한 페이지: 성적·오답
│   ├── 알림 /inbox
│   │   └── 한 페이지: 학생 대상 공지·학원/교사 쪽지
│   └── 더보기 /more
│       └── 한 페이지: 학원 소식·내 정보
│
├── 게스트 /guest/
│   ├── waiting (학원 소개), inquiry
│
└── 공개 /, 미리보기 /preview, 404
```

### 주요 화면 요약

- **원장 대시보드:** AI 승인·이탈·미납·문의 미처리, 출결·결제 요약
- **출석 체크:** 미체크/출석/지각/결석, 일괄, 하원 자동
- **AI 리포트:** 키워드·톤·초안(가명)·에디터(실명)·승인요청 / 원장 일괄 승인→Sent
- **이탈:** DETECTED→COUNSELING→IMPROVED/WITHDRAWN
- **학생 등록:** 이름·생년월일·학년·반. 연결은 가입 계정 수동 (명부만으로 Google 병합 없음)
- **청구:** DRAFT→ISSUED→PAID/OVERDUE, 토스, 미납 재알림
- **쪽지:** 대상·딥링크·푸시. 학생 민감 딥링크 금지
- **학부모 홈:** 다자녀는 상단 자녀 스위처로 대상을 전환한다. 선택한 자녀의 오늘 일정, 출결 상태, 새 학습 리포트, 미확인 알림을 우선 노출한다.
- **학부모 일정:** 별도 하위 화면으로 나누지 않고, 한 페이지에서 시간표와 출결을 함께 조회하고 사유결석을 신청한다. 신청은 알림 기록만 생성하며 출석 상태를 자동 변경하지 않는다.
- **학부모 학습:** 별도 하위 화면으로 나누지 않고, 한 페이지에서 성적 추이·오답과 교사가 검수·발송한 학습 리포트(AI 학부모 코멘트)를 함께 제공한다.
- **학부모 알림:** 한 페이지에 학부모 대상 공지, 상담·결제 알림, 학원/교사 쪽지를 통합한다. 학생 계정의 공지·쪽지는 학원 정책으로 허용된 범위에서만 읽기 전용으로 제공한다.
- **학부모 더보기:** 한 페이지에 결제, 학원 소식(대구 교육 정보 포함), 자녀 관리, 내 정보를 섹션으로 제공한다.
- **학생 홈:** 오늘 수업, 출결 상태, 성적·오답 요약, 새 공지를 우선 노출한다. 직접 등원 처리 버튼은 제공하지 않는다.
- **학생 일정:** 별도 하위 화면으로 나누지 않고, 한 페이지에서 시간표와 본인 출결을 함께 조회한다. 사유결석 신청·결제 기능은 노출하지 않는다.
- **학생 학습:** 한 페이지에서 본인 성적과 오답 기록을 함께 제공한다. 학부모용 AI 코멘트와 상담 기록은 노출하지 않는다.
- **학생 알림:** 한 페이지에 학생 대상 공지와 학원/교사 쪽지를 통합한다. 학부모 대상 공지·결제 알림은 노출하지 않는다.
- **학생 더보기:** 한 페이지에 학원 소식과 내 정보를 섹션으로 제공한다.
- **공통 내비게이션:** 모바일 하단 탭은 두 역할 모두 `홈 · 일정 · 학습 · 알림 · 더보기` 순서로 고정하고, 역할에 따라 각 탭의 내용과 실행 권한만 다르게 한다. PC도 동일한 정보 구조를 상단 가로 메뉴로 제공한다.

---

## 7. AI · 대구 소식 · 결제

### AI 상태

```
UNWRITTEN → DRAFTING → PENDING_APPROVAL → SENT
                         ↘ REJECTED → (수정) → PENDING_APPROVAL
```

Sent = 학부모 공개 + 쪽지 생성 + 푸시 시도 완료. `parentReadAt`은 별개. 직발송은 권한 ON만.

### 대구 소식

1차: 원장 수동 등록. 후순위: 공공 API/RSS.  
카테고리: `PARENT_ADMISSION` | `PARENT_NOTICE` | `STUDENT_YOUTH` | `GENERAL`

### 결제 MVP

학원비·교재비. 제외: 부분납, 환불, 정기청구, 현금영수증 자동.

---

## 8. 기술 스택 · 인증

| 구분 | 기술 |
|------|------|
| 앱 | Next.js App Router + Route Handlers |
| ORM/DB | Prisma + PostgreSQL (로컬 Docker / 운영 Lightsail Managed 또는 RDS) |
| 파일 | AWS S3 |
| AI | OpenAI 또는 Claude |
| 결제 | 토스페이먼츠 + 웹훅 |
| 인증 | Auth.js (next-auth v5) + Google + Prisma Adapter, 세션 JWT |
| 알림 | 인앱 쪽지 + Web Push (VAPID) |
| TZ | Asia/Seoul |

### 인증·가드

- 최초 가입 role = `GUEST`
- `middleware`: 역할 prefix 보호. 퇴원·연동 해제 후는 `GUEST` 홈(`/guest/waiting`)
- 공개 와이어프레임은 `/preview`만 허용하고 역할별 운영 라우트는 항상 인증한다.

### 원장 초기 설정

```bash
# Google 1회 로그인 후
npm run bootstrap:director -- you@gmail.com
# 또는 POST /api/admin/bootstrap-director + x-bootstrap-secret
# 재로그인 필수
```

---

## 9. 데이터 모델

```
User
 ├── OAuthAccount
 ├── PermissionGrant
 ├── Student (Google 계정 연결은 nullable)
 │    ├── ParentStudentLink
 │    ├── ClassEnrollment → Class → ClassSession → AttendanceRecord
 │    │                                      └── AbsenceRequest
 │    ├── LearningRecord
 │    ├── GradeRecord → WrongNote → WrongNoteImage
 │    ├── CounselingMemo
 │    ├── AiReport
 │    ├── ChurnCase → ChurnSignalLog
 │    └── Invoice → Payment
 ├── Message → MessageRecipient → PushDelivery
 ├── PushSubscription
 ├── NewsItem
 ├── Inquiry
 └── AuditLog

ChurnThresholdConfig (단일 설정 행)
```

### 9.1 모델링 원칙

- Prisma 모델을 데이터 구조의 단일 원본으로 사용하고, 변경 이력은 `prisma/migrations`에서 관리한다.
- 체크 제약과 부분 고유 인덱스처럼 Prisma로 완전히 표현하기 어려운 규칙은 migration SQL에 명시한다.
- `StaffProfile`, `ParentProfile`은 역할 전용 정보가 충분히 생기기 전까지 만들지 않는다. 공통 이름·연락처·주소는 `User`에 둔다.
- 출결은 반(`Class`)이 아니라 실제 수업 회차(`ClassSession`)에 연결한다.
- 생활·수업 기록은 `LearningRecord`로 통합하되, 수치 분석이 필요한 성적과 문항 단위 복습이 필요한 오답은 별도 모델로 분리한다.
- 신청 기록과 실제 출결을 분리하기 위해 `AbsenceRequest`는 `AttendanceRecord`와 별도 저장한다. 승인·반려 상태는 두지 않는다.
- 결제·쪽지·푸시는 시도 및 수신자별 이력을 보존하도록 각각 분리한다.

### 9.2 핵심 모델

**User**

- `id`, `email`, `name`, `phone`, `address`, `imageUrl`
- `role`: `GUEST | DIRECTOR | TEACHER | STAFF | PARENT | STUDENT`
- `status`: `ACTIVE | BLOCKED | WITHDRAWN`

**PermissionGrant**

- `userId` 1:1
- `viewAllStudents`, `viewParentContact`, `editLifeCounseling`
- `writeAiReport`, `aiDirectSend`
- `ownClassAttendanceGrade`, `otherTeacherAttendanceGrade`
- `sendMessage`, `billing`, `linkParentStudent`

**Student**

- `userId` nullable, `name`, `birthDate`, `schoolName`, `grade`, `phone`
- `status`, `enrolledAt`, `withdrawnAt`, `viewOnlyUntil`
- 연결 여부는 `userId`와 활성 `ParentStudentLink`로 계산하며 중복 상태 필드를 두지 않는다.

**ParentStudentLink**

- 연결·해제 이력을 보존한다.
- `endedAt IS NULL`인 활성 연결에서만 학생당 학부모 1명 및 동일 관계 중복 금지를 적용한다.

**Class · ClassEnrollment · ClassSession**

- `Class.schedule`은 반복 시간표 템플릿이다.
- 실제 출결·결석 요청은 날짜와 시간이 확정된 `ClassSession`에 연결한다.
- 동일 반·학생의 활성 수강 배정은 하나만 허용하되 과거 배정 이력은 보존한다.

**AttendanceRecord · AbsenceRequest**

- `AttendanceRecord`: `studentId + sessionId` unique, 출석 상태·등하원 시각·수정자
- `AbsenceRequest`: 신청자·사유·신청/취소 시각만 저장. 승인·반려 없음
- 결석 신청이 출결 상태를 자동 변경하지 않는다.

**LearningRecord · GradeRecord · WrongNote**

- `LearningRecord`: `CLASS_NOTE | HOMEWORK | LIFE_RECORD`
- `GradeRecord`: 시험명·과목·점수·만점·평가일
- `WrongNote`: 문항·학생 답·정답·해설·복습 상태
- `WrongNoteImage`: S3 URL, storage key, MIME, 정렬 순서

**CounselingMemo · AiReport**

- 상담 기록은 민감 권한 적용을 위해 별도 저장한다.
- AI 리포트 상태: `UNWRITTEN | DRAFTING | PENDING_APPROVAL | REJECTED | SENT | FAILED`
- `SENT`는 `sentAt` 필수이며 `parentReadAt`은 별도다.

**ChurnCase · ChurnSignalLog · ChurnThresholdConfig**

- 이탈 상태: `DETECTED | COUNSELING | IMPROVED | WITHDRAWN`
- 신호: `ATTENDANCE_DROP | SCORE_DROP | CONSECUTIVE_ABSENCE | UNPAID_DAYS`
- 학생당 열린 이탈 건(`DETECTED`, `COUNSELING`)은 하나만 허용한다.
- 임계값 설정은 단일 행으로 관리하며 기본값은 R6과 같다.

**Invoice · Payment**

- 청구서와 토스 결제 시도/결과를 분리한다.
- 청구 상태: `DRAFT | ISSUED | PAID | OVERDUE | CANCELLED`
- 결제 상태: `PENDING | SUCCEEDED | FAILED | CANCELLED`
- `Payment`에 주문 ID, 결제 키, 실패 정보, 원본 웹훅 payload를 보존한다.

**Message · MessageRecipient · PushSubscription · PushDelivery**

- 메시지 본문은 한 번 저장하고 수신자별 읽음 상태를 `MessageRecipient`에 저장한다.
- 기기별 Web Push 구독과 전송 성공·실패 이력을 분리한다.
- 민감 학생 정보로 직접 연결되는 딥링크는 생성하지 않는다.

**NewsItem · Inquiry · AuditLog**

- 뉴스 종류: `NOTICE | BANNER`
- 카테고리: `PARENT_ADMISSION | PARENT_NOTICE | STUDENT_YOUTH | GENERAL`
- 노출 대상: `PARENT | STUDENT | ALL`
- 문의 상태: `NEW | IN_PROGRESS | DONE | SPAM`
- 감사 로그는 actor·action·target·details·IP·user agent를 기록한다.

### 9.3 물리 스키마

- Prisma: `prisma/schema.prisma`
- 최초 migration: `prisma/migrations/20260729050000_initial_schema/migration.sql`
- DB 적용 이력: `prisma/migrations/` (중복 초기 SQL은 관리하지 않음)
- 실제 운영 변경은 migration을 사용하고 초기화 SQL은 동일 구조의 참조본으로 유지한다.

---

## 10. 주요 API

세션·role·PermissionGrant·담당 범위 서버 검증. 프리픽스 예: `/api` 또는 `/api/v1`.

| 영역 | 예시 |
|------|------|
| Auth | Auth.js `/api/auth/*`, `GET /api/me`, `POST /api/me/refresh` |
| Admin | `POST /api/admin/bootstrap-director`, `POST/DELETE …/parent-student-links`, permissions |
| Students/Classes | CRUD students, classes, sessions, enrollments |
| Attendance/Grades | sessions attendance, jobs/auto-checkout, grades, wrong-notes, life-records |
| AI | generate, submit, approve, reject, parent read |
| Churn | cases, thresholds, jobs/churn-detect |
| Billing | invoices, toss confirm/webhook, remind |
| Messages/Push | messages, inbox, push/subscribe |
| News/Inquiry | news CRUD, inquiries |
| Audit(감사 로그) | audit-logs (원장) |

민감 학생 상세 조회 시 `STUDENT_VIEW` 감사 로그.

---

## 11. 감사 로그 · 배치

**감사 로그(원장만, 1년):** 로그인, 권한 변경, 연락처 열람, 학생 열람, AI 승인·Sent, 청구·결제, 쪽지, CRUD, 파일, 연결/해제, 퇴원, 원장 초기 설정·이양.

| Job | 내용 |
|-----|------|
| `auto-checkout` | 하원 시각 |
| `churn-detect` | 이탈 DETECTED |
| `expire-withdraw-view` | viewOnly 만료 + 연동 해제 · role=`GUEST` |
| `mark-overdue-invoices` | OVERDUE |
| `purge-personal-data` | 퇴원 1년 파기/익명화 |
| `purge-audit-logs` | 1년 초과 감사 로그 삭제 |
| `fetch-daegu-news` | API 확보 후 |

---

## 12. 레포 · 폴더 구조

| 역할 | URL | 레이아웃 |
|------|-----|----------|
| 원장 | `/director/*` | AdminShell |
| 교사·사무원 | `/staff/*` | AdminShell |
| 학부모 | `/parent/*` | MemberShell |
| 학생 | `/student/*` | MemberShell |
| 게스트 | `/guest/*` | MemberShell |
| 인증 | `/login` | (auth) |

---

## 13. 1차 출시 · 구현 현황 · 온보딩

### 1차 범위

전체 기능. 대구 API는 수동만. 결제 고도화 제외.

권장 스프린트 순서: Auth·역할·수동연결·RBAC → 출결·성적·생활/오답 → Member 뷰·PWA·푸시 → AI Sent → 쪽지 → 토스 → 이탈 → 대구 소식.

### 구현 현황 (요약)

**됨:** 전 역할 화면, Member/Admin 셸, GUEST 소개·문의, 권한 관리, Prisma 스키마·마이그레이션, Auth.js·역할 가드, 최초 원장 설정, `/api/me`, 출결·성적·리포트·쪽지·청구 흐름.

**미완:** 연결/출결/성적/AI/청구/쪽지/푸시 실연동, 권한 DB 저장, 이양 UI, 퇴원 배치, PWA·약관·운영 키·Lightsail.

### 온보딩

```
1. DB up → migrate
2. DATABASE_URL · DIRECT_URL · AUTH_SECRET · Google OAuth
3. npm run dev
4. Google 로그인(GUEST) → 원장 초기 설정(`bootstrap:director`) → 재로그인
5. 권한·학부모↔자녀 연결 → 일상 운영
6. 퇴원 자정 후 GUEST(소개) 전환 검증
```

---

## 14. 외부 vs 자체

**외부:** Google, OpenAI/Claude, 토스, PostgreSQL/S3, Web Push, (후순위) 대구 API  

**자체:** RBAC, 수동 연결, 출결·성적, AI 상태머신, 이탈, 쪽지, 생활/오답, 청구 MVP, 감사 로그, 문의, 수동 대구 소식

---

*통합일: 2026-07-29 · 출처 정리: final_spec v2~v5(유효분) + folder_structure v3 + server_and_integrations v2~v3(유효분)*
