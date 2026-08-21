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

import pg from "pg"; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.

const execute = process.argv.includes("--execute"); // 없으면 계획만. 실수로 출석을 덮지 않게.
const connectionString = process.env.DIRECT_URL; // migrate와 같은 직접 연결. 앱 런타임 풀링 URL이 아님.

if (!connectionString) { // 직접 연결. UUID를 고정해 재실행 시 ON CONFLICT DO NOTHING.
    throw new Error("DIRECT_URL이 필요합니다."); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
}

const url = new URL(connectionString); // 미리보기 로그에 호스트만. 이메일은 안 찍는다.
const client = new pg.Client({ connectionString }); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
const now = new Date(); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
/** KST 달력일 `YYYY-MM-DD`. Invoice.dueDate 같은 date 컬럼용. */
const dateOnly = (dayOffset = 0) => { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    const kst = new Date( // 서버 로컬이 아니라 Asia/Seoul 날짜에 dayOffset을 더한다.
        now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    );
    kst.setDate(kst.getDate() + dayOffset); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    return [kst.getFullYear(), kst.getMonth() + 1, kst.getDate()] // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        .map((value, index) => // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            index === 0 ? String(value) : String(value).padStart(2, "0"), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        )
        .join("-"); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
};
/** 인스턴트를 UTC로 만들되 시각은 KST. `hour - 9`가 Date.UTC에 들어간다. */
const kstDateTime = (dayOffset, hour, minute = 0) => { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    const kst = new Date( // 한국 16시가 UTC 07시로 저장되게. 서버 TZ와 무관.
        now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    );
    kst.setDate(kst.getDate() + dayOffset); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    return new Date( // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        Date.UTC( // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            kst.getFullYear(), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            kst.getMonth(), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            kst.getDate(), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            hour - 9, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            minute, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ),
    );
};
const daysAgo = (days) => new Date(now.getTime() - days * 86_400_000); // lastLoginAt·시드 시각. KST 달력일이 아님.
/** 고정 UUID. 그룹 8자리+시퀀스라 재시드가 같은 키로 no-op 된다. */
const id = (group, sequence) => // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    `${group}-0000-4000-8000-${String(sequence).padStart(12, "0")}`; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.

const userIds = { // @test.local 교사·직원·학부모·게스트. 원장 User는 만들지 않는다.
    teacherMath: id("10000001", 1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    teacherEnglish: id("10000001", 2), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    staff: id("10000001", 3), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    parent1: id("10000002", 1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    parent2: id("10000002", 2), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    parent3: id("10000002", 3), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    guest1: id("10000003", 1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    guest2: id("10000003", 2), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
};
const studentUserIds = Array.from({ length: 8 }, (_, index) => // STUDENT User. Student.userId와 1:1.
    id("10000004", index + 1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
);
const studentIds = Array.from({ length: 8 }, (_, index) => // 원생 카드. ENROLLED라 이탈 스캔 대상.
    id("20000001", index + 1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
);
const classIds = { // seed-class-mock의 a1000001과 id 공간이 다르다.
    math: id("30000001", 1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    english: id("30000001", 2), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    science: id("30000001", 3), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
};

const users = [ // TEACHER/STAFF/PARENT/GUEST/STUDENT. 원장 이메일을 덮지 않는다.
    [userIds.teacherMath, "teacher.math@test.local", "김수진", "010-1000-1001", "서울시 테스트구", null, null, "TEACHER"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    [userIds.teacherEnglish, "teacher.english@test.local", "박현우", "010-1000-1002", "서울시 테스트구", null, null, "TEACHER"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    [userIds.staff, "staff@test.local", "이하나", "010-1000-1003", "서울시 테스트구", null, null, "STAFF"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    [userIds.parent1, "parent.one@test.local", "최은정", "010-2000-1001", "서울시 테스트구 배움로 1", null, null, "PARENT"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    [userIds.parent2, "parent.two@test.local", "정민호", "010-2000-1002", "서울시 테스트구 배움로 2", null, null, "PARENT"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    [userIds.parent3, "parent.three@test.local", "한지영", "010-2000-1003", "서울시 테스트구 배움로 3", null, null, "PARENT"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    [userIds.guest1, "guest.waiting@test.local", "가입대기", "010-3000-1001", "서울시 테스트구", null, null, "GUEST"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    [userIds.guest2, "guest.inquiry@test.local", "상담예정", "010-3000-1002", "서울시 테스트구", null, null, "GUEST"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ...[ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.one@test.local", "강민준", "한빛중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.two@test.local", "김서연", "한빛중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.three@test.local", "박도윤", "새봄중학교", "3"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.four@test.local", "이하린", "새봄중학교", "1"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.five@test.local", "정우진", "푸른중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.six@test.local", "최지아", "푸른중학교", "3"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.seven@test.local", "윤시우", "한빛중학교", "1"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ["student.eight@test.local", "송예린", "새봄중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ].map(([email, name, school, grade], index) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        studentUserIds[index], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        email, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        name, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        `010-4000-${String(index + 1).padStart(4, "0")}`, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        `서울시 테스트구 학생로 ${index + 1}`, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        school, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        grade, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        "STUDENT", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ]),
]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.

const studentProfiles = [ // User와 1:1. ENROLLED.
    ["강민준", "2012-03-11", "한빛중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ["김서연", "2012-07-23", "한빛중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ["박도윤", "2011-05-08", "새봄중학교", "3"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ["이하린", "2013-01-17", "새봄중학교", "1"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ["정우진", "2012-11-02", "푸른중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ["최지아", "2011-09-14", "푸른중학교", "3"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ["윤시우", "2013-06-29", "한빛중학교", "1"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    ["송예린", "2012-12-05", "새봄중학교", "2"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.

await client.connect(); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.

try { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    const directorResult = await client.query( // 원장이 정확히 1명. 학부모 링크 linked_by를 누구로 할지 모호하면 중단.
        `SELECT id FROM users WHERE role = 'DIRECTOR' ORDER BY created_at LIMIT 2`, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    );
    if (directorResult.rowCount !== 1) { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        throw new Error( // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            `DIRECTOR 계정이 정확히 1개여야 합니다. 현재 ${directorResult.rowCount}개입니다.`, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );
    }
    const directorId = directorResult.rows[0].id; // 학부모 링크 linked_by. 원장 User는 만들지 않는다.
    const existing = await getSummary(); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.

    console.log( // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        JSON.stringify( // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                mode: execute ? "execute" : "preview", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                target: { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    host: url.hostname, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    port: url.port || "5432", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    database: url.pathname.slice(1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                },
                existing, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                planned: { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    users: users.length, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    students: studentProfiles.length, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    classes: 3, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    classSessions: 9, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    invoices: 5, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    churnCases: 3, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    messages: 3, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    newsItems: 3, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                },
            },
            null, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            2, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ),
    );

    if (!execute) { // 미리보기만. 출석·청구를 쓰지 않는다.
        console.log("미리보기만 완료했습니다. 생성하려면 --execute를 추가하세요."); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        process.exitCode = 0; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    } else { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await client.query("BEGIN"); // 지우지 않는다 — 리셋은 reset-data-keep-director. 재시드는 같은 UUID no-op.
        await client.query( // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            "SELECT pg_advisory_xact_lock(hashtext('academy_test_seed'))", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        await insertMany( // @test.local 교사·직원·학부모·게스트·학생. 원장 User는 만들지 않는다.
            "users", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "id", "email", "name", "phone", "address", "school_name", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "grade", "role", "status", "email_verified_at", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "onboarding_complete_at", "last_login_at", "created_at", "updated_at", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            users.map((row) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                ...row, "ACTIVE", daysAgo(30), daysAgo(30), daysAgo(1), daysAgo(30), now, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        await insertMany( // 교사 billing=false. resolvePermissions가 덮어도 끄지만 화면 기본값과 맞춘다.
            "permission_grants", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "user_id", "view_all_students", "view_parent_contact", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "edit_life_counseling", "write_ai_report", "ai_direct_send", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "own_class_attendance_grade", "other_teacher_attendance_grade", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "send_message", "billing", "link_parent_student", "updated_at", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [userIds.teacherMath, false, true, true, true, false, true, false, true, false, false, now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [userIds.teacherEnglish, false, false, true, true, false, true, false, true, false, false, now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [userIds.staff, true, true, true, true, true, true, true, true, true, true, now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        await insertMany( // User와 1:1. ENROLLED라 이탈 스캔·수강 배정 대상이 된다.
            "students", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "id", "user_id", "name", "birth_date", "school_name", "grade", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "phone", "status", "enrolled_at", "created_at", "updated_at", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            studentProfiles.map(([name, birthDate, school, grade], index) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                studentIds[index], studentUserIds[index], name, birthDate, school, grade, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                `010-4000-${String(index + 1).padStart(4, "0")}`, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "ENROLLED", dateOnly(-120 + index), daysAgo(120 - index), now, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        const parentLinks = [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [userIds.parent1, 0, "모"], [userIds.parent1, 1, "모"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [userIds.parent2, 2, "부"], [userIds.parent2, 3, "부"], [userIds.parent2, 4, "부"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [userIds.parent3, 5, "모"], [userIds.parent3, 6, "모"], [userIds.parent3, 7, "모"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // 자녀 여러 명. 퇴원 확정 시 남은 링크가 있으면 학부모 로그인을 유지하는 전제.
            "parent_student_links", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "parent_user_id", "student_id", "relationship", "linked_by", "linked_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            parentLinks.map(([parentId, studentIndex, relationship], index) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                id("21000001", index + 1), parentId, studentIds[studentIndex], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                relationship, directorId, daysAgo(90 - index), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        await insertMany( // 수학/영어/과학. seed-class-mock의 a1000001과 id 공간이 다르다.
            "classes", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "name", "subject", "teacher_user_id", "schedule", "active", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [classIds.math, "중2 수학 A", "수학", userIds.teacherMath, JSON.stringify({ days: ["월", "수"], time: "16:00" }), true, daysAgo(100), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [classIds.english, "중등 영어 B", "영어", userIds.teacherEnglish, JSON.stringify({ days: ["화", "목"], time: "18:00" }), true, daysAgo(95), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [classIds.science, "과학 탐구", "과학", userIds.staff, JSON.stringify({ days: ["금"], time: "19:30" }), true, daysAgo(80), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        const enrollmentSpecs = [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.math, 0], [classIds.math, 1], [classIds.math, 2], [classIds.math, 3], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.english, 0], [classIds.english, 4], [classIds.english, 5], [classIds.english, 6], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.science, 1], [classIds.science, 2], [classIds.science, 7], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // ACTIVE + endedAt null. 교사 스코프가 담당 반 명단을 그릴 때 쓴다.
            "class_enrollments", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "class_id", "student_id", "status", "enrolled_at", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            enrollmentSpecs.map(([classId, studentIndex], index) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                id("31000001", index + 1), classId, studentIds[studentIndex], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                "ACTIVE", dateOnly(-90), daysAgo(90), now, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        const sessionSpecs = [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.math, -7, 16, 0, "COMPLETED", "301호"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.math, 0, 16, 0, "SCHEDULED", "301호"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.math, 2, 16, 0, "SCHEDULED", "301호"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.english, -7, 18, 0, "COMPLETED", "201호"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.english, 0, 18, 0, "SCHEDULED", "201호"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.english, 2, 18, 0, "SCHEDULED", "201호"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.science, -7, 19, 30, "COMPLETED", "과학실"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.science, 0, 19, 30, "SCHEDULED", "과학실"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [classIds.science, 3, 19, 30, "SCHEDULED", "과학실"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        const sessions = sessionSpecs.map(([classId, day, hour, minute, status, room], index) => { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            const startsAt = kstDateTime(day, hour, minute); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            return { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                id: id("32000001", index + 1), classId, startsAt, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                endsAt: new Date(startsAt.getTime() + 90 * 60_000), status, room, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            };
        });
        await insertMany( // hour-9 UTC라 서버가 UTC여도 한국 16시로 보인다.
            "class_sessions", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "class_id", "starts_at", "ends_at", "classroom", "status", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            sessions.map((session) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                session.id, session.classId, session.startsAt, session.endsAt, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                session.room, session.status, daysAgo(14), now, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        const attendanceSpecs = [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [1, 0, "PRESENT", userIds.teacherMath], [1, 1, "LATE", userIds.teacherMath], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [1, 2, "ABSENT", userIds.teacherMath], [1, 3, "PRESENT", userIds.teacherMath], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [4, 0, "PRESENT", userIds.teacherEnglish], [4, 4, "PRESENT", userIds.teacherEnglish], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [4, 5, "EXCUSED", userIds.teacherEnglish], [4, 6, "PRESENT", userIds.teacherEnglish], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [7, 1, "PRESENT", userIds.staff], [7, 2, "ABSENT", userIds.staff], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [7, 7, "PRESENT", userIds.staff], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [0, 0, "PRESENT", userIds.teacherMath], [0, 1, "PRESENT", userIds.teacherMath], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [0, 2, "ABSENT", userIds.teacherMath], [0, 3, "PRESENT", userIds.teacherMath], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [3, 0, "PRESENT", userIds.teacherEnglish], [3, 4, "LATE", userIds.teacherEnglish], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [3, 5, "ABSENT", userIds.teacherEnglish], [3, 6, "PRESENT", userIds.teacherEnglish], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // PRESENT/LATE/ABSENT/EXCUSED를 섞어 이탈 스캔·대시보드가 비지 않게.
            "attendance_records", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "session_id", "status", "check_in_at", "check_out_at", "note", "updated_by", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            attendanceSpecs.map(([sessionIndex, studentIndex, status, updater], index) => { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                const session = sessions[sessionIndex]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                const attended = status === "PRESENT" || status === "LATE"; // PRESENT/LATE만 시각. LATE는 +12분, PRESENT는 -5분, 결석·사유결석은 null.
                const checkIn = attended // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    ? new Date(session.startsAt.getTime() + (status === "LATE" ? 12 : -5) * 60_000) // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    : null; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                const checkOut = attended ? new Date(session.endsAt.getTime() - 3 * 60_000) : null; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                return [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    id("33000001", index + 1), studentIds[studentIndex], session.id, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    status, checkIn, checkOut, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    status === "ABSENT" ? "테스트 결석 기록" : null, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                    updater, session.startsAt, now, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            }),
        );

        await insertMany( // 학부모 요청 한 건. 출석 화면의 미처리 요청 UI용.
            "absence_requests", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "session_id", "requested_by", "reason", "requested_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [[id("34000001", 1), studentIds[1], sessions[2].id, userIds.parent1, "학교 행사 참석", daysAgo(1)]], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        const learningRows = [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [0, classIds.math, userIds.teacherMath, "HOMEWORK", "연립방정식 복습", "교재 42~45쪽을 풀고 오답을 표시하세요."], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [0, classIds.english, userIds.teacherEnglish, "CLASS_NOTE", "독해 수업 기록", "주제문 찾기가 안정적이며 어휘 복습이 필요합니다."], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [1, classIds.math, userIds.teacherMath, "HOMEWORK", "일차함수 과제", "그래프 문제 10문제를 풀어오세요."], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [2, classIds.math, userIds.teacherMath, "LIFE_RECORD", "학습 태도", "최근 과제 제출이 늦어 학습 계획을 함께 조정했습니다."], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [4, classIds.english, userIds.teacherEnglish, "HOMEWORK", "영어 단어 테스트 준비", "Unit 5 단어를 암기하세요."], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [7, classIds.science, userIds.staff, "CLASS_NOTE", "과학 탐구 기록", "실험 설계 과정에서 적극적으로 의견을 제시했습니다."], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // 과제/수업/생활. 리포트 초안 근거.
            "learning_records", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "class_id", "author_user_id", "type", "title", "content", "record_date", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            learningRows.map((row, index) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                id("35000001", index + 1), studentIds[row[0]], ...row.slice(1), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                dateOnly(-index), daysAgo(index), now, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        const gradeRows = [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [0, classIds.math, userIds.teacherMath, "7월 단원평가", "수학", 92, 100, -12], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [0, classIds.english, userIds.teacherEnglish, "7월 어휘평가", "영어", 88, 100, -9], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [1, classIds.math, userIds.teacherMath, "7월 단원평가", "수학", 78, 100, -12], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [2, classIds.math, userIds.teacherMath, "7월 단원평가", "수학", 61, 100, -12], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [3, classIds.math, userIds.teacherMath, "기초 개념평가", "수학", 84, 100, -10], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [4, classIds.english, userIds.teacherEnglish, "7월 독해평가", "영어", 95, 100, -8], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [5, classIds.english, userIds.teacherEnglish, "7월 독해평가", "영어", 58, 100, -8], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [6, classIds.english, userIds.teacherEnglish, "7월 어휘평가", "영어", 73, 100, -9], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [7, classIds.science, userIds.staff, "과학 탐구평가", "과학", 89, 100, -6], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [2, classIds.science, userIds.staff, "과학 탐구평가", "과학", 67, 100, -6], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        const gradeIds = gradeRows.map((_, index) => id("40000001", index + 1)); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // 학생마다 점수가 갈라지게. SCORE_DROP·리포트 화면용.
            "grade_records", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "class_id", "created_by", "title", "subject", "score", "max_score", "assessed_at", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            gradeRows.map((row, index) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                gradeIds[index], studentIds[row[0]], ...row.slice(1, 7), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                dateOnly(row[7]), daysAgo(Math.abs(row[7])), now, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        await insertMany( // OPEN/REVIEWED. 성적 행에 붙여 초안이 인용하게.
            "wrong_notes", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "grade_record_id", "class_id", "author_user_id", "question_no", "question_text", "student_answer", "correct_answer", "explanation", "status", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("41000001", 1), studentIds[1], gradeIds[2], classIds.math, userIds.teacherMath, "12", "일차함수의 기울기를 구하세요.", "-2", "2", "두 점의 y 변화량을 x 변화량으로 나눕니다.", "OPEN", daysAgo(10), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("41000001", 2), studentIds[2], gradeIds[3], classIds.math, userIds.teacherMath, "18", "연립방정식의 해를 구하세요.", "(2, 1)", "(1, 2)", "대입 과정에서 x와 y를 바꾸지 않도록 확인합니다.", "REVIEWED", daysAgo(9), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("41000001", 3), studentIds[5], gradeIds[6], classIds.english, userIds.teacherEnglish, "7", "문맥에 맞는 접속사를 고르세요.", "however", "therefore", "앞 문장과 결과 관계를 확인합니다.", "OPEN", daysAgo(6), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        await insertMany( // 교사/직원 메모. 이탈 케이스 COUNSELING 화면과 맞춘다.
            "counseling_memos", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "author_user_id", "content", "counseled_at", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("42000001", 1), studentIds[2], userIds.teacherMath, "최근 결석이 이어져 학습 계획과 등원 시간을 조정했습니다.", daysAgo(2), daysAgo(2), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("42000001", 2), studentIds[5], userIds.teacherEnglish, "성적 하락 원인을 확인하고 어휘 복습량을 줄여 꾸준히 진행하기로 했습니다.", daysAgo(4), daysAgo(4), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("42000001", 3), studentIds[0], userIds.staff, "학부모 정기 상담에서 수학 심화반 진학 가능성을 안내했습니다.", daysAgo(7), daysAgo(7), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        const reportIds = Array.from({ length: 4 }, (_, index) => id("50000001", index + 1)); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // SENT/PENDING/REJECTED/DRAFTING를 한 세트. 승인 큐가 비지 않게.
            "ai_reports", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "author_user_id", "approver_user_id", "status", "period_start", "period_end", "keywords", "content", "rejection_reason", "approved_at", "sent_at", "parent_read_at", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [reportIds[0], studentIds[0], userIds.teacherMath, directorId, "SENT", dateOnly(-30), dateOnly(-1), JSON.stringify(["꾸준함", "개념 이해"]), "민준 학생은 개념 이해가 안정적이며 심화 문제에서도 풀이 과정을 잘 설명합니다.", null, daysAgo(2), daysAgo(2), daysAgo(1), daysAgo(3), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [reportIds[1], studentIds[1], userIds.teacherMath, null, "PENDING_APPROVAL", dateOnly(-30), dateOnly(-1), JSON.stringify(["일차함수", "오답 복습"]), "서연 학생은 오답 복습을 통해 일차함수 단원의 정확도가 향상되고 있습니다.", null, null, null, null, daysAgo(1), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [reportIds[2], studentIds[2], userIds.teacherMath, directorId, "REJECTED", dateOnly(-30), dateOnly(-1), JSON.stringify(["출결", "학습 계획"]), "도윤 학생의 출결 변화와 보완 계획을 정리했습니다.", "상담 이후 계획을 조금 더 구체적으로 작성해 주세요.", null, null, null, daysAgo(2), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [reportIds[3], studentIds[4], userIds.teacherEnglish, null, "DRAFTING", dateOnly(-30), dateOnly(-1), JSON.stringify(["독해", "어휘"]), "우진 학생은 독해 성취도가 높고 어휘 학습도 꾸준합니다.", null, null, null, null, daysAgo(1), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        const churnIds = [id("51000001", 1), id("51000001", 2), id("51000001", 3)]; // DETECTED/COUNSELING/IMPROVED. 스캔이 열린 케이스를 새로 만들지 않는지 확인.
        await insertMany( // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            "churn_cases", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "assigned_user_id", "status", "summary", "detected_at", "resolved_at", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [churnIds[0], studentIds[2], userIds.teacherMath, "DETECTED", "최근 연속 결석과 출석률 하락이 감지되었습니다.", daysAgo(2), null, daysAgo(2), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [churnIds[1], studentIds[5], userIds.teacherEnglish, "COUNSELING", "최근 영어 평가 점수가 이전 대비 하락했습니다.", daysAgo(5), null, daysAgo(5), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [churnIds[2], studentIds[7], userIds.staff, "IMPROVED", "상담 이후 출석과 과제 제출이 안정되었습니다.", daysAgo(20), daysAgo(3), daysAgo(20), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );
        await insertMany( // 케이스별 근거 숫자. 이탈 상세 화면이 비지 않게.
            "churn_signal_logs", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "churn_case_id", "type", "value", "threshold", "details", "detected_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("52000001", 1), churnIds[0], "CONSECUTIVE_ABSENCE", 2, 2, JSON.stringify({ source: "test-seed" }), daysAgo(2)], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("52000001", 2), churnIds[0], "ATTENDANCE_DROP", 22, 15, JSON.stringify({ source: "test-seed" }), daysAgo(2)], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("52000001", 3), churnIds[1], "SCORE_DROP", 18, 10, JSON.stringify({ source: "test-seed" }), daysAgo(5)], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("52000001", 4), churnIds[2], "UNPAID_DAYS", 5, 3, JSON.stringify({ source: "test-seed", resolved: true }), daysAgo(20)], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        const invoiceIds = Array.from({ length: 5 }, (_, index) => id("60000001", index + 1)); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // PAID/OVERDUE/ISSUED/DRAFT. UNPAID_DAYS 신호와 수납 화면용.
            "invoices", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "student_id", "parent_user_id", "title", "items", "total_amount", "status", "due_date", "issued_at", "paid_at", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [invoiceIds[0], studentIds[0], userIds.parent1, "8월 수강료", JSON.stringify([{ name: "수학·영어 수강료", amount: 420000 }]), 420000, "PAID", dateOnly(-10), daysAgo(20), daysAgo(9), daysAgo(20), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [invoiceIds[1], studentIds[1], userIds.parent1, "8월 수강료", JSON.stringify([{ name: "수학·과학 수강료", amount: 390000 }]), 390000, "OVERDUE", dateOnly(-5), daysAgo(20), null, daysAgo(20), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [invoiceIds[2], studentIds[2], userIds.parent2, "8월 수강료", JSON.stringify([{ name: "수학·과학 수강료", amount: 390000 }]), 390000, "ISSUED", dateOnly(5), daysAgo(5), null, daysAgo(5), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [invoiceIds[3], studentIds[5], userIds.parent3, "8월 영어 수강료", JSON.stringify([{ name: "영어 수강료", amount: 280000 }]), 280000, "DRAFT", dateOnly(10), null, null, daysAgo(1), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [invoiceIds[4], studentIds[7], userIds.parent3, "7월 과학 수강료", JSON.stringify([{ name: "과학 수강료", amount: 240000 }]), 240000, "OVERDUE", dateOnly(-18), daysAgo(30), null, daysAgo(30), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );
        await insertMany( // PAID 청구 한 건에 SUCCEEDED 결제. 수납 화면이 비지 않게.
            "payments", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "invoice_id", "payer_user_id", "provider", "order_id", "payment_key", "amount", "status", "method", "requested_at", "approved_at", "raw_payload", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [[id("61000001", 1), invoiceIds[0], userIds.parent1, "TOSS", "TEST-ORDER-0001", "TEST-PAYMENT-0001", 420000, "SUCCEEDED", "카드", daysAgo(9), daysAgo(9), JSON.stringify({ test: true }), daysAgo(9), now]], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        const messageIds = [id("70000001", 1), id("70000001", 2), id("70000001", 3)]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // 전체 공지 + 학부모 리포트 + 승인 대기. 역할별 쪽지함이 비지 않게.
            "messages", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "sender_user_id", "author_user_id", "approver_user_id", "report_id", "title", "content", "deep_link", "status", "audience", "target_student_id", "target_class_id", "submitted_at", "approved_at", "sent_at", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [messageIds[0], directorId, directorId, directorId, null, "8월 학사 일정 안내", "8월 휴원일과 보강 일정을 확인해 주세요.", "/parent/news", "SENT", "ALL", null, null, daysAgo(4), daysAgo(4), daysAgo(4), daysAgo(4), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [messageIds[1], userIds.teacherMath, userIds.teacherMath, directorId, reportIds[0], "민준 학생 7월 학습 리포트", "7월 학습 리포트가 발행되었습니다.", "/parent/reports", "SENT", "PARENT", studentIds[0], null, daysAgo(2), daysAgo(2), daysAgo(2), daysAgo(2), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [messageIds[2], null, userIds.teacherEnglish, null, null, "영어 B반 단어 시험 안내", "다음 수업에서 Unit 5 단어 시험을 진행합니다.", null, "PENDING_APPROVAL", "STUDENT", null, classIds.english, daysAgo(1), null, null, daysAgo(1), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );
        const recipientSpecs = [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [0, userIds.parent1, daysAgo(3)], [0, userIds.parent2, null], [0, userIds.parent3, null], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [1, userIds.parent1, null], [1, studentUserIds[0], daysAgo(1)], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        ]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        await insertMany( // 일부만 read_at. 안 읽은 쪽지 배지를 보여 주기 위함.
            "message_recipients", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "message_id", "recipient_user_id", "read_at", "created_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            recipientSpecs.map(([messageIndex, recipientId, readAt], index) => [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                id("71000001", index + 1), messageIds[messageIndex], recipientId, readAt, daysAgo(4 - Math.min(index, 3)), // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ]),
        );

        await insertMany( // 공지/배너. 스토리지 파일은 올리지 않고 경로 문자열만.
            "news_items", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "kind", "category", "audience", "title", "content", "image_url", "link_url", "sort_order", "published", "starts_at", "ends_at", "created_by", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("80000001", 1), "NOTICE", "GENERAL", "ALL", "8월 학사 일정 안내", "휴원일과 보강 수업 일정을 확인해 주세요.", null, null, 1, true, daysAgo(10), null, directorId, daysAgo(10), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("80000001", 2), "NOTICE", "PARENT_NOTICE", "PARENT", "학부모 정기 상담 신청", "담임 선생님과의 정기 상담 시간을 신청해 주세요.", null, "/guest/inquiry", 2, true, daysAgo(7), null, directorId, daysAgo(7), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("80000001", 3), "BANNER", "STUDENT_YOUTH", "STUDENT", "여름 집중 학습 프로그램", "취약 단원을 보완하는 집중 학습 프로그램입니다.", "/banners/summer-intensive-1080x1440.png", null, 3, true, daysAgo(5), null, directorId, daysAgo(5), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        await insertMany( // NEW/IN_PROGRESS/DONE. 게스트 상담·직원 문의 큐용.
            "inquiries", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "guardian_name", "phone", "student_grade", "interested_subject", "preferred_time", "message", "internal_memo", "status", "assigned_user_id", "created_at", "updated_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [ // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("81000001", 1), "테스트보호자A", "010-9000-0001", "중2", "수학", "평일 18시 이후", "수학 심화반 상담을 원합니다.", null, "NEW", null, daysAgo(1), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("81000001", 2), "테스트보호자B", "010-9000-0002", "중1", "영어", "토요일 오전", "레벨 테스트 가능 시간을 알고 싶습니다.", "전화 상담 예정", "IN_PROGRESS", userIds.staff, daysAgo(3), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
                [id("81000001", 3), "테스트보호자C", "010-9000-0003", "중3", "수학·과학", "평일 16시", "방학 프로그램 문의입니다.", "상담 완료", "DONE", userIds.staff, daysAgo(8), now], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        await insertMany( // 시드 한 번을 남겨 운영 데이터와 구분한다.
            "audit_logs", // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            ["id", "actor_user_id", "action", "target_type", "target_id", "details", "created_at"], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            [[id("90000001", 1), directorId, "TEST_DATA_SEEDED", "SYSTEM", null, JSON.stringify({ users: users.length, students: studentProfiles.length }), now]], // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        );

        await client.query("COMMIT"); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        console.log(JSON.stringify({ completed: true, after: await getSummary() }, null, 2)); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    }
} catch (error) { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    if (execute) { // execute 중에만. 미리보기는 쓰기가 없다.
        await client.query("ROLLBACK").catch(() => undefined); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    }
    throw error; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
} finally { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    await client.end(); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
}

/** 한 테이블에 여러 행 INSERT. 같은 UUID면 건너뛴다 — 재시드가 출석을 리셋하지 않게. */
async function insertMany(table, columns, rows) { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    if (rows.length === 0) return; // 빈 배열이면 SQL을 만들지 않는다.
    const values = []; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    const tuples = rows.map((row) => { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        const placeholders = row.map((value) => { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            values.push(value); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
            return `$${values.length}`; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        });
        return `(${placeholders.join(", ")})`; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    });
    const quotedColumns = columns.map((column) => `"${column}"`).join(", "); // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    await client.query( // DO NOTHING: 같은 UUID가 있으면 건너뛴다. 부분 시드된 DB를 덮어 출석을 리셋하지 않음.
        `INSERT INTO "${table}" (${quotedColumns}) VALUES ${tuples.join(", ")} ON CONFLICT DO NOTHING`, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
        values, // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    );
}

/** 미리보기/완료 로그용 @test.local 사용자·업무 테이블 건수. */
async function getSummary() { // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
    const result = await client.query( // 테스트 계정과 업무 테이블 건수. 미리보기/완료 로그가 같은 쿼리를 쓴다.
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
    return result.rows[0]; // @test.local User. 원장은 안 만듦. ON CONFLICT DO NOTHING.
}
