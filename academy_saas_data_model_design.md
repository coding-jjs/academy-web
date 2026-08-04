# A학원 SaaS 데이터 모델 설계

> 기준 문서: `academy_saas_unified_spec.md` 9번  
> 구현 원본: `prisma/schema.prisma`

## 1. 목적

이 문서는 A학원 SaaS의 최종 데이터 구조와 그 구조를 선택한 이유를 설명한다. 단순 화면 표시용 데이터가 아니라 출결, 성적 변화, 이탈 감지, 권한, 결제, 쪽지와 푸시의 운영 이력을 안정적으로 보존하는 것을 목표로 한다.

## 2. 최종 구조

```text
User
├── OAuthAccount
├── PermissionGrant
├── Student
│   ├── ParentStudentLink
│   ├── ClassEnrollment → Class → ClassSession
│   │                              ├── AttendanceRecord
│   │                              └── AbsenceRequest
│   ├── LearningRecord
│   ├── GradeRecord → WrongNote → WrongNoteImage
│   ├── CounselingMemo
│   ├── AiReport
│   ├── ChurnCase → ChurnSignalLog
│   └── Invoice → Payment
├── Message → MessageRecipient → PushDelivery
├── PushSubscription
├── NewsItem
├── Inquiry
└── AuditLog

ChurnThresholdConfig
```

## 3. 기존 구조에서 달라진 점

| 영역 | 기존 | 변경 |
|------|------|------|
| 권한 | `users.permissions` JSON | `PermissionGrant` 1:1 |
| 수업 | `Class.schedule` JSON만 사용 | 반복 템플릿 + 실제 `ClassSession` |
| 출결 | 반+날짜 기준 | 학생+수업 회차 기준 |
| 결석 신청 | 출결 행 안의 승인 상태 | 별도 `AbsenceRequest`, 승인·반려 없음 |
| 성적 | 일반 학습 기록에 표현 불가 | `GradeRecord` 분리 |
| 오답 | `learning_records`와 이미지 URL 배열 | 문항 모델과 이미지 메타데이터 분리 |
| 상담 | 일반 메모로 혼합 | `CounselingMemo` 분리 |
| 이탈 | 저장 구조 없음 | Case·Signal·Threshold 3계층 |
| 결제 | 청구서에 결제 결과 포함 | `Invoice`와 `Payment` 분리 |
| 쪽지 | 메시지 한 행당 수신자 1명 | 본문과 수신자 목록 분리 |
| 푸시 | 메시지에 최종 상태만 저장 | 구독과 기기별 전송 이력 분리 |
| 뉴스 | 공지·배너만 구분 | 종류·카테고리·대상 역할 구분 |
| Prisma | DB introspection 형태의 모델명 | 도메인 중심 PascalCase 모델 |

## 4. 구조를 이렇게 잡은 이유

### 4.1 수업 회차와 출결

반의 반복 시간표만으로 출결을 저장하면 같은 날 보강이나 특강이 있을 때 구분할 수 없다. `ClassSession`을 두면 정규 수업, 보강, 취소 수업을 각각 식별하고 학생의 출결을 정확히 한 회차에 연결할 수 있다.

### 4.2 결석 신청과 실제 출결 분리

결석 신청은 학부모가 전달한 의사이고 실제 출결은 교직원이 기록한 사실이다. 둘을 같은 행에 저장하면 신청이 출석 상태를 자동으로 바꾸는 것처럼 해석될 수 있다. 별도 모델로 분리해 R4의 “신청 기록+알림만, 승인·반려 없음” 규칙을 유지한다.

### 4.3 성적과 오답 분리

성적 하락 감지는 점수, 만점, 과목, 평가일이 구조화되어야 한다. 오답은 한 성적에 여러 문항이 연결되고 문항별 복습 상태와 사진이 필요하다. 일반 텍스트 기록이나 JSON 배열로 합치면 성적 추이 쿼리와 복습 관리가 복잡해지므로 별도 모델로 분리했다.

### 4.4 권한을 JSON 대신 명시적 모델로 관리

이 서비스는 단순 메뉴 노출이 아니라 담당 학생 범위, 연락처 열람, 타 교사 데이터 수정, 수납 등 서버 검증이 필요한 권한을 다룬다. 명시적 boolean 필드는 타입 안정성, 변경 추적, 관리자 UI와의 일치성이 좋다. 권한 변경 자체는 `AuditLog`에도 기록한다.

### 4.5 이탈 감지의 설명 가능성

현재 상태만 저장하면 왜 이탈 위험으로 판단했는지 설명할 수 없다. `ChurnCase`는 업무 상태를, `ChurnSignalLog`는 감지 근거를, `ChurnThresholdConfig`는 판단 기준을 보존한다. 이 구조는 자동 감지 결과를 원장과 교사가 검토할 수 있게 한다.

### 4.6 청구와 결제 분리

하나의 청구서에도 실패 후 재결제 등 여러 결제 시도가 생길 수 있다. 토스 주문 ID, 결제 키, 실패 이유, 웹훅 원문을 `Payment`에 분리하면 청구 상태와 결제 이력을 혼동하지 않고 장애 조사도 가능하다.

### 4.7 메시지·수신자·푸시 분리

공지 하나를 여러 사람에게 보낼 때 본문을 사용자 수만큼 복제할 필요가 없다. 본문은 `Message`, 읽음 상태는 `MessageRecipient`, 기기별 전송 결과는 `PushDelivery`에 저장한다. `PushSubscription`을 별도로 두어 한 사용자의 여러 기기와 만료된 구독도 관리한다.

### 4.8 프로필 테이블을 당장 만들지 않은 이유

현재 학부모·교직원 전용 프로필에 들어갈 확정 필드가 많지 않다. `ParentProfile`, `StaffProfile`을 `userId`만 가진 빈 1:1 테이블로 만들면 조회와 관리만 복잡해진다. 공통 정보는 `User`에 두고, 직책·담당 과목·보호자 관계처럼 역할 전용 필드가 확정될 때 추가한다. 보호자와 학생의 관계는 연결 자체의 속성이므로 `ParentStudentLink.relationship`에 둔다.

## 5. 주요 무결성 규칙

- 학생 한 명은 동시에 활성 학부모 연결을 하나만 가진다.
- 동일 학부모·학생의 활성 연결은 중복될 수 없다.
- 과거 연결과 수강 배정 이력은 삭제하지 않고 종료 시각·상태로 보존한다.
- 실제 수업 종료 시각은 시작 시각보다 늦어야 한다.
- 학생은 한 수업 회차에 출결 기록 하나만 가진다.
- 결석 신청은 학생·수업 회차당 하나만 가진다.
- 점수는 0 이상, 만점 이하이며 만점은 0보다 커야 한다.
- 학생당 열린 이탈 건은 하나만 가진다.
- `SENT` AI 리포트에는 발송 시각이 필요하다.
- `PAID` 청구서에는 결제 완료 시각이 필요하다.
- 배너 뉴스에는 이미지가 필요하다.

Prisma가 직접 표현하지 못하는 활성 행 부분 unique 인덱스와 체크 제약은 최초 migration SQL에 포함한다.

## 6. 스키마 운영 방식

1. `schema.prisma`를 모델 구조의 단일 원본으로 관리한다.
2. 모든 변경은 새 Prisma migration으로 생성한다.
3. 부분 인덱스·체크 제약 등은 생성된 migration SQL에 추가한다.
4. `prisma migrate deploy`로 운영 DB에 적용한다.
5. 초기 SQL을 별도로 복제하지 않고 migration을 유일한 적용 이력으로 사용한다.
6. 운영 DB를 직접 수정한 경우 `prisma db pull`로 덮어쓰기 전에 migration으로 변경 내용을 먼저 기록한다.

## 7. 적용 시 주의사항

현재 프로젝트의 로컬 PostgreSQL이 실행되지 않아 기존 데이터 변환은 수행하지 않았다. 추가된 migration은 빈 데이터베이스를 기준으로 한 최초 migration이다.

이미 별도 초기 SQL로 만들어진 데이터베이스가 있다면 최초 migration을 그대로 실행하면 안 된다. 다음 항목을 포함한 별도의 전환 migration이 필요하다.

- 기존 `attendance`를 `ClassSession`과 `AttendanceRecord`로 변환
- `learning_records.WRONG_ANSWER`를 `WrongNote`로 이동
- `reports`를 `ai_reports`로 이동
- `notices`를 `news_items`로 이동
- `messages`의 수신자를 `message_recipients`로 이동
- `invoices`의 토스 결제 필드를 `payments`로 이동
- `users.permissions` JSON을 `permission_grants`로 변환

운영 데이터가 있는 경우에는 백업, 변환 검증, 행 개수 대조 후 전환해야 한다.
