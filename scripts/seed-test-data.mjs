/**
 * 개발용 가짜 사람·반·출석·청구·이탈 케이스를 넣는다.
 * 역할별 화면을 Google 없이 클릭해볼 수 있게 `@test.local` User를 만든다.
 *
 * 실행: `npm run db:seed:test` (미리보기)
 *       `npm run db:seed:test -- --execute`
 *
 * 전제: DIRECTOR가 정확히 1명. 없으면 bootstrap 먼저.
 * 쓰기: DIRECT_URL. UUID를 `id(group, n)`으로 고정해 재실행 시 `ON CONFLICT DO NOTHING`.
 * 지우지 않는다 — 리셋은 `reset-data-keep-director.mjs`.
 *
 * KST: `kstDateTime`은 UTC 생성 시 `hour - 9`. 서버가 UTC여도 회차가 한국 16시로 보이게.
 *
 * 의도적으로 하지 않는 일:
 * - 원장 User를 만들지 않는다. 이메일을 덮으면 Google 원장이 깨진다.
 * - 스토리지 이미지 파일은 올리지 않는다. news banner는 경로 문자열만.
 *
 * 관련: `dev-login.ts`, `db:reset:keep-director`, `seed-class-mock-data.mjs`.
 */

import pg from "pg";

const execute = process.argv.includes("--execute");
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("DIRECT_URL이 필요합니다.");
}

const url = new URL(connectionString);
const client = new pg.Client({ connectionString });
const now = new Date();
/** KST 달력일 `YYYY-MM-DD`. Invoice.dueDate 같은 date 컬럼용. */
const dateOnly = (dayOffset = 0) => {
    const kst = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    );
    kst.setDate(kst.getDate() + dayOffset);
    return [kst.getFullYear(), kst.getMonth() + 1, kst.getDate()]
        .map((value, index) =>
            index === 0 ? String(value) : String(value).padStart(2, "0"),
        )
        .join("-");
};
/** 인스턴트를 UTC로 만들되 시각은 KST. `hour - 9`가 Date.UTC에 들어간다. */
const kstDateTime = (dayOffset, hour, minute = 0) => {
    const kst = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    );
    kst.setDate(kst.getDate() + dayOffset);
    return new Date(
        Date.UTC(
            kst.getFullYear(),
            kst.getMonth(),
            kst.getDate(),
            hour - 9,
            minute,
        ),
    );
};
const daysAgo = (days) => new Date(now.getTime() - days * 86_400_000);
/** 고정 UUID. 그룹 8자리+시퀀스라 재시드가 같은 키로 no-op 된다. */
const id = (group, sequence) =>
    `${group}-0000-4000-8000-${String(sequence).padStart(12, "0")}`;

const userIds = {
    teacherMath: id("10000001", 1),
    teacherEnglish: id("10000001", 2),
    staff: id("10000001", 3),
    parent1: id("10000002", 1),
    parent2: id("10000002", 2),
    parent3: id("10000002", 3),
    guest1: id("10000003", 1),
    guest2: id("10000003", 2),
};
const studentUserIds = Array.from({ length: 8 }, (_, index) =>
    id("10000004", index + 1),
);
const studentIds = Array.from({ length: 8 }, (_, index) =>
    id("20000001", index + 1),
);
const classIds = {
    math: id("30000001", 1),
    english: id("30000001", 2),
    science: id("30000001", 3),
};

const users = [
    [userIds.teacherMath, "teacher.math@test.local", "김수진", "010-1000-1001", "서울시 테스트구", null, null, "TEACHER"],
    [userIds.teacherEnglish, "teacher.english@test.local", "박현우", "010-1000-1002", "서울시 테스트구", null, null, "TEACHER"],
    [userIds.staff, "staff@test.local", "이하나", "010-1000-1003", "서울시 테스트구", null, null, "STAFF"],
    [userIds.parent1, "parent.one@test.local", "최은정", "010-2000-1001", "서울시 테스트구 배움로 1", null, null, "PARENT"],
    [userIds.parent2, "parent.two@test.local", "정민호", "010-2000-1002", "서울시 테스트구 배움로 2", null, null, "PARENT"],
    [userIds.parent3, "parent.three@test.local", "한지영", "010-2000-1003", "서울시 테스트구 배움로 3", null, null, "PARENT"],
    [userIds.guest1, "guest.waiting@test.local", "가입대기", "010-3000-1001", "서울시 테스트구", null, null, "GUEST"],
    [userIds.guest2, "guest.inquiry@test.local", "상담예정", "010-3000-1002", "서울시 테스트구", null, null, "GUEST"],
    ...[
        ["student.one@test.local", "강민준", "한빛중학교", "2"],
        ["student.two@test.local", "김서연", "한빛중학교", "2"],
        ["student.three@test.local", "박도윤", "새봄중학교", "3"],
        ["student.four@test.local", "이하린", "새봄중학교", "1"],
        ["student.five@test.local", "정우진", "푸른중학교", "2"],
        ["student.six@test.local", "최지아", "푸른중학교", "3"],
        ["student.seven@test.local", "윤시우", "한빛중학교", "1"],
        ["student.eight@test.local", "송예린", "새봄중학교", "2"],
    ].map(([email, name, school, grade], index) => [
        studentUserIds[index],
        email,
        name,
        `010-4000-${String(index + 1).padStart(4, "0")}`,
        `서울시 테스트구 학생로 ${index + 1}`,
        school,
        grade,
        "STUDENT",
    ]),
];

const studentProfiles = [
    ["강민준", "2012-03-11", "한빛중학교", "2"],
    ["김서연", "2012-07-23", "한빛중학교", "2"],
    ["박도윤", "2011-05-08", "새봄중학교", "3"],
    ["이하린", "2013-01-17", "새봄중학교", "1"],
    ["정우진", "2012-11-02", "푸른중학교", "2"],
    ["최지아", "2011-09-14", "푸른중학교", "3"],
    ["윤시우", "2013-06-29", "한빛중학교", "1"],
    ["송예린", "2012-12-05", "새봄중학교", "2"],
];

await client.connect();

try {
    const directorResult = await client.query(
        `SELECT id FROM users WHERE role = 'DIRECTOR' ORDER BY created_at LIMIT 2`,
    );
    if (directorResult.rowCount !== 1) {
        throw new Error(
            `DIRECTOR 계정이 정확히 1개여야 합니다. 현재 ${directorResult.rowCount}개입니다.`,
        );
    }
    const directorId = directorResult.rows[0].id;
    const existing = await getSummary();

    console.log(
        JSON.stringify(
            {
                mode: execute ? "execute" : "preview",
                target: {
                    host: url.hostname,
                    port: url.port || "5432",
                    database: url.pathname.slice(1),
                },
                existing,
                planned: {
                    users: users.length,
                    students: studentProfiles.length,
                    classes: 3,
                    classSessions: 9,
                    invoices: 5,
                    churnCases: 3,
                    messages: 3,
                    newsItems: 3,
                },
            },
            null,
            2,
        ),
    );

    if (!execute) {
        console.log("미리보기만 완료했습니다. 생성하려면 --execute를 추가하세요.");
        process.exitCode = 0;
    } else {
        await client.query("BEGIN");
        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext('academy_test_seed'))",
        );

        await insertMany(
            "users",
            [
                "id", "email", "name", "phone", "address", "school_name",
                "grade", "role", "status", "email_verified_at",
                "onboarding_complete_at", "last_login_at", "created_at", "updated_at",
            ],
            users.map((row) => [
                ...row, "ACTIVE", daysAgo(30), daysAgo(30), daysAgo(1), daysAgo(30), now,
            ]),
        );

        await insertMany(
            "permission_grants",
            [
                "user_id", "view_all_students", "view_parent_contact",
                "edit_life_counseling", "write_ai_report", "ai_direct_send",
                "own_class_attendance_grade", "other_teacher_attendance_grade",
                "send_message", "billing", "link_parent_student", "updated_at",
            ],
            [
                [userIds.teacherMath, false, true, true, true, false, true, false, true, false, false, now],
                [userIds.teacherEnglish, false, false, true, true, false, true, false, true, false, false, now],
                [userIds.staff, true, true, true, true, true, true, true, true, true, true, now],
            ],
        );

        await insertMany(
            "students",
            [
                "id", "user_id", "name", "birth_date", "school_name", "grade",
                "phone", "status", "enrolled_at", "created_at", "updated_at",
            ],
            studentProfiles.map(([name, birthDate, school, grade], index) => [
                studentIds[index], studentUserIds[index], name, birthDate, school, grade,
                `010-4000-${String(index + 1).padStart(4, "0")}`,
                "ENROLLED", dateOnly(-120 + index), daysAgo(120 - index), now,
            ]),
        );

        const parentLinks = [
            [userIds.parent1, 0, "모"], [userIds.parent1, 1, "모"],
            [userIds.parent2, 2, "부"], [userIds.parent2, 3, "부"], [userIds.parent2, 4, "부"],
            [userIds.parent3, 5, "모"], [userIds.parent3, 6, "모"], [userIds.parent3, 7, "모"],
        ];
        await insertMany(
            "parent_student_links",
            ["id", "parent_user_id", "student_id", "relationship", "linked_by", "linked_at"],
            parentLinks.map(([parentId, studentIndex, relationship], index) => [
                id("21000001", index + 1), parentId, studentIds[studentIndex],
                relationship, directorId, daysAgo(90 - index),
            ]),
        );

        await insertMany(
            "classes",
            ["id", "name", "subject", "teacher_user_id", "schedule", "active", "created_at", "updated_at"],
            [
                [classIds.math, "중2 수학 A", "수학", userIds.teacherMath, JSON.stringify({ days: ["월", "수"], time: "16:00" }), true, daysAgo(100), now],
                [classIds.english, "중등 영어 B", "영어", userIds.teacherEnglish, JSON.stringify({ days: ["화", "목"], time: "18:00" }), true, daysAgo(95), now],
                [classIds.science, "과학 탐구", "과학", userIds.staff, JSON.stringify({ days: ["금"], time: "19:30" }), true, daysAgo(80), now],
            ],
        );

        const enrollmentSpecs = [
            [classIds.math, 0], [classIds.math, 1], [classIds.math, 2], [classIds.math, 3],
            [classIds.english, 0], [classIds.english, 4], [classIds.english, 5], [classIds.english, 6],
            [classIds.science, 1], [classIds.science, 2], [classIds.science, 7],
        ];
        await insertMany(
            "class_enrollments",
            ["id", "class_id", "student_id", "status", "enrolled_at", "created_at", "updated_at"],
            enrollmentSpecs.map(([classId, studentIndex], index) => [
                id("31000001", index + 1), classId, studentIds[studentIndex],
                "ACTIVE", dateOnly(-90), daysAgo(90), now,
            ]),
        );

        const sessionSpecs = [
            [classIds.math, -7, 16, 0, "COMPLETED", "301호"],
            [classIds.math, 0, 16, 0, "SCHEDULED", "301호"],
            [classIds.math, 2, 16, 0, "SCHEDULED", "301호"],
            [classIds.english, -7, 18, 0, "COMPLETED", "201호"],
            [classIds.english, 0, 18, 0, "SCHEDULED", "201호"],
            [classIds.english, 2, 18, 0, "SCHEDULED", "201호"],
            [classIds.science, -7, 19, 30, "COMPLETED", "과학실"],
            [classIds.science, 0, 19, 30, "SCHEDULED", "과학실"],
            [classIds.science, 3, 19, 30, "SCHEDULED", "과학실"],
        ];
        const sessions = sessionSpecs.map(([classId, day, hour, minute, status, room], index) => {
            const startsAt = kstDateTime(day, hour, minute);
            return {
                id: id("32000001", index + 1), classId, startsAt,
                endsAt: new Date(startsAt.getTime() + 90 * 60_000), status, room,
            };
        });
        await insertMany(
            "class_sessions",
            ["id", "class_id", "starts_at", "ends_at", "classroom", "status", "created_at", "updated_at"],
            sessions.map((session) => [
                session.id, session.classId, session.startsAt, session.endsAt,
                session.room, session.status, daysAgo(14), now,
            ]),
        );

        const attendanceSpecs = [
            [1, 0, "PRESENT", userIds.teacherMath], [1, 1, "LATE", userIds.teacherMath],
            [1, 2, "ABSENT", userIds.teacherMath], [1, 3, "PRESENT", userIds.teacherMath],
            [4, 0, "PRESENT", userIds.teacherEnglish], [4, 4, "PRESENT", userIds.teacherEnglish],
            [4, 5, "EXCUSED", userIds.teacherEnglish], [4, 6, "PRESENT", userIds.teacherEnglish],
            [7, 1, "PRESENT", userIds.staff], [7, 2, "ABSENT", userIds.staff],
            [7, 7, "PRESENT", userIds.staff],
            [0, 0, "PRESENT", userIds.teacherMath], [0, 1, "PRESENT", userIds.teacherMath],
            [0, 2, "ABSENT", userIds.teacherMath], [0, 3, "PRESENT", userIds.teacherMath],
            [3, 0, "PRESENT", userIds.teacherEnglish], [3, 4, "LATE", userIds.teacherEnglish],
            [3, 5, "ABSENT", userIds.teacherEnglish], [3, 6, "PRESENT", userIds.teacherEnglish],
        ];
        await insertMany(
            "attendance_records",
            ["id", "student_id", "session_id", "status", "check_in_at", "check_out_at", "note", "updated_by", "created_at", "updated_at"],
            attendanceSpecs.map(([sessionIndex, studentIndex, status, updater], index) => {
                const session = sessions[sessionIndex];
                const attended = status === "PRESENT" || status === "LATE";
                const checkIn = attended
                    ? new Date(session.startsAt.getTime() + (status === "LATE" ? 12 : -5) * 60_000)
                    : null;
                const checkOut = attended ? new Date(session.endsAt.getTime() - 3 * 60_000) : null;
                return [
                    id("33000001", index + 1), studentIds[studentIndex], session.id,
                    status, checkIn, checkOut,
                    status === "ABSENT" ? "테스트 결석 기록" : null,
                    updater, session.startsAt, now,
                ];
            }),
        );

        await insertMany(
            "absence_requests",
            ["id", "student_id", "session_id", "requested_by", "reason", "requested_at"],
            [[id("34000001", 1), studentIds[1], sessions[2].id, userIds.parent1, "학교 행사 참석", daysAgo(1)]],
        );

        const learningRows = [
            [0, classIds.math, userIds.teacherMath, "HOMEWORK", "연립방정식 복습", "교재 42~45쪽을 풀고 오답을 표시하세요."],
            [0, classIds.english, userIds.teacherEnglish, "CLASS_NOTE", "독해 수업 기록", "주제문 찾기가 안정적이며 어휘 복습이 필요합니다."],
            [1, classIds.math, userIds.teacherMath, "HOMEWORK", "일차함수 과제", "그래프 문제 10문제를 풀어오세요."],
            [2, classIds.math, userIds.teacherMath, "LIFE_RECORD", "학습 태도", "최근 과제 제출이 늦어 학습 계획을 함께 조정했습니다."],
            [4, classIds.english, userIds.teacherEnglish, "HOMEWORK", "영어 단어 테스트 준비", "Unit 5 단어를 암기하세요."],
            [7, classIds.science, userIds.staff, "CLASS_NOTE", "과학 탐구 기록", "실험 설계 과정에서 적극적으로 의견을 제시했습니다."],
        ];
        await insertMany(
            "learning_records",
            ["id", "student_id", "class_id", "author_user_id", "type", "title", "content", "record_date", "created_at", "updated_at"],
            learningRows.map((row, index) => [
                id("35000001", index + 1), studentIds[row[0]], ...row.slice(1),
                dateOnly(-index), daysAgo(index), now,
            ]),
        );

        const gradeRows = [
            [0, classIds.math, userIds.teacherMath, "7월 단원평가", "수학", 92, 100, -12],
            [0, classIds.english, userIds.teacherEnglish, "7월 어휘평가", "영어", 88, 100, -9],
            [1, classIds.math, userIds.teacherMath, "7월 단원평가", "수학", 78, 100, -12],
            [2, classIds.math, userIds.teacherMath, "7월 단원평가", "수학", 61, 100, -12],
            [3, classIds.math, userIds.teacherMath, "기초 개념평가", "수학", 84, 100, -10],
            [4, classIds.english, userIds.teacherEnglish, "7월 독해평가", "영어", 95, 100, -8],
            [5, classIds.english, userIds.teacherEnglish, "7월 독해평가", "영어", 58, 100, -8],
            [6, classIds.english, userIds.teacherEnglish, "7월 어휘평가", "영어", 73, 100, -9],
            [7, classIds.science, userIds.staff, "과학 탐구평가", "과학", 89, 100, -6],
            [2, classIds.science, userIds.staff, "과학 탐구평가", "과학", 67, 100, -6],
        ];
        const gradeIds = gradeRows.map((_, index) => id("40000001", index + 1));
        await insertMany(
            "grade_records",
            ["id", "student_id", "class_id", "created_by", "title", "subject", "score", "max_score", "assessed_at", "created_at", "updated_at"],
            gradeRows.map((row, index) => [
                gradeIds[index], studentIds[row[0]], ...row.slice(1, 7),
                dateOnly(row[7]), daysAgo(Math.abs(row[7])), now,
            ]),
        );

        await insertMany(
            "wrong_notes",
            ["id", "student_id", "grade_record_id", "class_id", "author_user_id", "question_no", "question_text", "student_answer", "correct_answer", "explanation", "status", "created_at", "updated_at"],
            [
                [id("41000001", 1), studentIds[1], gradeIds[2], classIds.math, userIds.teacherMath, "12", "일차함수의 기울기를 구하세요.", "-2", "2", "두 점의 y 변화량을 x 변화량으로 나눕니다.", "OPEN", daysAgo(10), now],
                [id("41000001", 2), studentIds[2], gradeIds[3], classIds.math, userIds.teacherMath, "18", "연립방정식의 해를 구하세요.", "(2, 1)", "(1, 2)", "대입 과정에서 x와 y를 바꾸지 않도록 확인합니다.", "REVIEWED", daysAgo(9), now],
                [id("41000001", 3), studentIds[5], gradeIds[6], classIds.english, userIds.teacherEnglish, "7", "문맥에 맞는 접속사를 고르세요.", "however", "therefore", "앞 문장과 결과 관계를 확인합니다.", "OPEN", daysAgo(6), now],
            ],
        );

        await insertMany(
            "counseling_memos",
            ["id", "student_id", "author_user_id", "content", "counseled_at", "created_at", "updated_at"],
            [
                [id("42000001", 1), studentIds[2], userIds.teacherMath, "최근 결석이 이어져 학습 계획과 등원 시간을 조정했습니다.", daysAgo(2), daysAgo(2), now],
                [id("42000001", 2), studentIds[5], userIds.teacherEnglish, "성적 하락 원인을 확인하고 어휘 복습량을 줄여 꾸준히 진행하기로 했습니다.", daysAgo(4), daysAgo(4), now],
                [id("42000001", 3), studentIds[0], userIds.staff, "학부모 정기 상담에서 수학 심화반 진학 가능성을 안내했습니다.", daysAgo(7), daysAgo(7), now],
            ],
        );

        const reportIds = Array.from({ length: 4 }, (_, index) => id("50000001", index + 1));
        await insertMany(
            "ai_reports",
            ["id", "student_id", "author_user_id", "approver_user_id", "status", "period_start", "period_end", "keywords", "content", "rejection_reason", "approved_at", "sent_at", "parent_read_at", "created_at", "updated_at"],
            [
                [reportIds[0], studentIds[0], userIds.teacherMath, directorId, "SENT", dateOnly(-30), dateOnly(-1), JSON.stringify(["꾸준함", "개념 이해"]), "민준 학생은 개념 이해가 안정적이며 심화 문제에서도 풀이 과정을 잘 설명합니다.", null, daysAgo(2), daysAgo(2), daysAgo(1), daysAgo(3), now],
                [reportIds[1], studentIds[1], userIds.teacherMath, null, "PENDING_APPROVAL", dateOnly(-30), dateOnly(-1), JSON.stringify(["일차함수", "오답 복습"]), "서연 학생은 오답 복습을 통해 일차함수 단원의 정확도가 향상되고 있습니다.", null, null, null, null, daysAgo(1), now],
                [reportIds[2], studentIds[2], userIds.teacherMath, directorId, "REJECTED", dateOnly(-30), dateOnly(-1), JSON.stringify(["출결", "학습 계획"]), "도윤 학생의 출결 변화와 보완 계획을 정리했습니다.", "상담 이후 계획을 조금 더 구체적으로 작성해 주세요.", null, null, null, daysAgo(2), now],
                [reportIds[3], studentIds[4], userIds.teacherEnglish, null, "DRAFTING", dateOnly(-30), dateOnly(-1), JSON.stringify(["독해", "어휘"]), "우진 학생은 독해 성취도가 높고 어휘 학습도 꾸준합니다.", null, null, null, null, daysAgo(1), now],
            ],
        );

        const churnIds = [id("51000001", 1), id("51000001", 2), id("51000001", 3)];
        await insertMany(
            "churn_cases",
            ["id", "student_id", "assigned_user_id", "status", "summary", "detected_at", "resolved_at", "created_at", "updated_at"],
            [
                [churnIds[0], studentIds[2], userIds.teacherMath, "DETECTED", "최근 연속 결석과 출석률 하락이 감지되었습니다.", daysAgo(2), null, daysAgo(2), now],
                [churnIds[1], studentIds[5], userIds.teacherEnglish, "COUNSELING", "최근 영어 평가 점수가 이전 대비 하락했습니다.", daysAgo(5), null, daysAgo(5), now],
                [churnIds[2], studentIds[7], userIds.staff, "IMPROVED", "상담 이후 출석과 과제 제출이 안정되었습니다.", daysAgo(20), daysAgo(3), daysAgo(20), now],
            ],
        );
        await insertMany(
            "churn_signal_logs",
            ["id", "churn_case_id", "type", "value", "threshold", "details", "detected_at"],
            [
                [id("52000001", 1), churnIds[0], "CONSECUTIVE_ABSENCE", 2, 2, JSON.stringify({ source: "test-seed" }), daysAgo(2)],
                [id("52000001", 2), churnIds[0], "ATTENDANCE_DROP", 22, 15, JSON.stringify({ source: "test-seed" }), daysAgo(2)],
                [id("52000001", 3), churnIds[1], "SCORE_DROP", 18, 10, JSON.stringify({ source: "test-seed" }), daysAgo(5)],
                [id("52000001", 4), churnIds[2], "UNPAID_DAYS", 5, 3, JSON.stringify({ source: "test-seed", resolved: true }), daysAgo(20)],
            ],
        );

        const invoiceIds = Array.from({ length: 5 }, (_, index) => id("60000001", index + 1));
        await insertMany(
            "invoices",
            ["id", "student_id", "parent_user_id", "title", "items", "total_amount", "status", "due_date", "issued_at", "paid_at", "created_at", "updated_at"],
            [
                [invoiceIds[0], studentIds[0], userIds.parent1, "8월 수강료", JSON.stringify([{ name: "수학·영어 수강료", amount: 420000 }]), 420000, "PAID", dateOnly(-10), daysAgo(20), daysAgo(9), daysAgo(20), now],
                [invoiceIds[1], studentIds[1], userIds.parent1, "8월 수강료", JSON.stringify([{ name: "수학·과학 수강료", amount: 390000 }]), 390000, "OVERDUE", dateOnly(-5), daysAgo(20), null, daysAgo(20), now],
                [invoiceIds[2], studentIds[2], userIds.parent2, "8월 수강료", JSON.stringify([{ name: "수학·과학 수강료", amount: 390000 }]), 390000, "ISSUED", dateOnly(5), daysAgo(5), null, daysAgo(5), now],
                [invoiceIds[3], studentIds[5], userIds.parent3, "8월 영어 수강료", JSON.stringify([{ name: "영어 수강료", amount: 280000 }]), 280000, "DRAFT", dateOnly(10), null, null, daysAgo(1), now],
                [invoiceIds[4], studentIds[7], userIds.parent3, "7월 과학 수강료", JSON.stringify([{ name: "과학 수강료", amount: 240000 }]), 240000, "OVERDUE", dateOnly(-18), daysAgo(30), null, daysAgo(30), now],
            ],
        );
        await insertMany(
            "payments",
            ["id", "invoice_id", "payer_user_id", "provider", "order_id", "payment_key", "amount", "status", "method", "requested_at", "approved_at", "raw_payload", "created_at", "updated_at"],
            [[id("61000001", 1), invoiceIds[0], userIds.parent1, "TOSS", "TEST-ORDER-0001", "TEST-PAYMENT-0001", 420000, "SUCCEEDED", "카드", daysAgo(9), daysAgo(9), JSON.stringify({ test: true }), daysAgo(9), now]],
        );

        const messageIds = [id("70000001", 1), id("70000001", 2), id("70000001", 3)];
        await insertMany(
            "messages",
            ["id", "sender_user_id", "author_user_id", "approver_user_id", "report_id", "title", "content", "deep_link", "status", "audience", "target_student_id", "target_class_id", "submitted_at", "approved_at", "sent_at", "created_at", "updated_at"],
            [
                [messageIds[0], directorId, directorId, directorId, null, "8월 학사 일정 안내", "8월 휴원일과 보강 일정을 확인해 주세요.", "/parent/news", "SENT", "ALL", null, null, daysAgo(4), daysAgo(4), daysAgo(4), daysAgo(4), now],
                [messageIds[1], userIds.teacherMath, userIds.teacherMath, directorId, reportIds[0], "민준 학생 7월 학습 리포트", "7월 학습 리포트가 발행되었습니다.", "/parent/reports", "SENT", "PARENT", studentIds[0], null, daysAgo(2), daysAgo(2), daysAgo(2), daysAgo(2), now],
                [messageIds[2], null, userIds.teacherEnglish, null, null, "영어 B반 단어 시험 안내", "다음 수업에서 Unit 5 단어 시험을 진행합니다.", null, "PENDING_APPROVAL", "STUDENT", null, classIds.english, daysAgo(1), null, null, daysAgo(1), now],
            ],
        );
        const recipientSpecs = [
            [0, userIds.parent1, daysAgo(3)], [0, userIds.parent2, null], [0, userIds.parent3, null],
            [1, userIds.parent1, null], [1, studentUserIds[0], daysAgo(1)],
        ];
        await insertMany(
            "message_recipients",
            ["id", "message_id", "recipient_user_id", "read_at", "created_at"],
            recipientSpecs.map(([messageIndex, recipientId, readAt], index) => [
                id("71000001", index + 1), messageIds[messageIndex], recipientId, readAt, daysAgo(4 - Math.min(index, 3)),
            ]),
        );

        await insertMany(
            "news_items",
            ["id", "kind", "category", "audience", "title", "content", "image_url", "link_url", "sort_order", "published", "starts_at", "ends_at", "created_by", "created_at", "updated_at"],
            [
                [id("80000001", 1), "NOTICE", "GENERAL", "ALL", "8월 학사 일정 안내", "휴원일과 보강 수업 일정을 확인해 주세요.", null, null, 1, true, daysAgo(10), null, directorId, daysAgo(10), now],
                [id("80000001", 2), "NOTICE", "PARENT_NOTICE", "PARENT", "학부모 정기 상담 신청", "담임 선생님과의 정기 상담 시간을 신청해 주세요.", null, "/guest/inquiry", 2, true, daysAgo(7), null, directorId, daysAgo(7), now],
                [id("80000001", 3), "BANNER", "STUDENT_YOUTH", "STUDENT", "여름 집중 학습 프로그램", "취약 단원을 보완하는 집중 학습 프로그램입니다.", "/banners/summer-intensive-1080x1440.png", null, 3, true, daysAgo(5), null, directorId, daysAgo(5), now],
            ],
        );

        await insertMany(
            "inquiries",
            ["id", "guardian_name", "phone", "student_grade", "interested_subject", "preferred_time", "message", "internal_memo", "status", "assigned_user_id", "created_at", "updated_at"],
            [
                [id("81000001", 1), "테스트보호자A", "010-9000-0001", "중2", "수학", "평일 18시 이후", "수학 심화반 상담을 원합니다.", null, "NEW", null, daysAgo(1), now],
                [id("81000001", 2), "테스트보호자B", "010-9000-0002", "중1", "영어", "토요일 오전", "레벨 테스트 가능 시간을 알고 싶습니다.", "전화 상담 예정", "IN_PROGRESS", userIds.staff, daysAgo(3), now],
                [id("81000001", 3), "테스트보호자C", "010-9000-0003", "중3", "수학·과학", "평일 16시", "방학 프로그램 문의입니다.", "상담 완료", "DONE", userIds.staff, daysAgo(8), now],
            ],
        );

        await insertMany(
            "audit_logs",
            ["id", "actor_user_id", "action", "target_type", "target_id", "details", "created_at"],
            [[id("90000001", 1), directorId, "TEST_DATA_SEEDED", "SYSTEM", null, JSON.stringify({ users: users.length, students: studentProfiles.length }), now]],
        );

        await client.query("COMMIT");
        console.log(JSON.stringify({ completed: true, after: await getSummary() }, null, 2));
    }
} catch (error) {
    if (execute) {
        await client.query("ROLLBACK").catch(() => undefined);
    }
    throw error;
} finally {
    await client.end();
}

/** 한 테이블에 여러 행 INSERT. 같은 UUID면 건너뛴다 — 재시드가 출석을 리셋하지 않게. */
async function insertMany(table, columns, rows) {
    if (rows.length === 0) return;
    const values = [];
    const tuples = rows.map((row) => {
        const placeholders = row.map((value) => {
            values.push(value);
            return `$${values.length}`;
        });
        return `(${placeholders.join(", ")})`;
    });
    const quotedColumns = columns.map((column) => `"${column}"`).join(", ");
    await client.query(
        `INSERT INTO "${table}" (${quotedColumns}) VALUES ${tuples.join(", ")} ON CONFLICT DO NOTHING`,
        values,
    );
}

/** 미리보기/완료 로그용 @test.local 사용자·업무 테이블 건수. */
async function getSummary() {
    const result = await client.query(
        /* ENROLLED 원생. PAUSED/WITHDRAWN은 시드 대상으로 안 씀. */ `
        SELECT
            (SELECT COUNT(*)::int FROM users WHERE email LIKE '%@test.local') AS test_users,
            (SELECT COUNT(*)::int FROM students) AS students,
            (SELECT COUNT(*)::int FROM classes) AS classes,
            (SELECT COUNT(*)::int FROM class_sessions) AS class_sessions,
            (SELECT COUNT(*)::int FROM attendance_records) AS attendance,
            (SELECT COUNT(*)::int FROM grade_records) AS grades,
            (SELECT COUNT(*)::int FROM ai_reports) AS reports,
            (SELECT COUNT(*)::int FROM churn_cases) AS churn_cases,
            (SELECT COUNT(*)::int FROM invoices) AS invoices,
            (SELECT COUNT(*)::int FROM messages) AS messages,
            (SELECT COUNT(*)::int FROM news_items) AS news_items,
            (SELECT COUNT(*)::int FROM inquiries) AS inquiries
    `);
    return result.rows[0];
}
