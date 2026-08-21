/**
 * 반·회차 목 데이터를 넣는다.
 * 시간표·출석 화면이 비어 보이지 않게, 기존 재원생 3명에게 수강을 붙인다.
 *
 * 실행: `npm run db:seed:classes` / `-- --execute`
 * 전제: ACTIVE DIRECTOR 1명, TEACHER|STAFF, ENROLLED 학생 3명 (보통 seed-test-data 이후).
 *
 * 쓰기: DIRECT_URL. 고정 UUID + ON CONFLICT UPDATE라 재실행이 스케줄을 최신으로 덮는다.
 * seed-test-data의 반(중2 수학 A 등)과 id 공간이 다르다 (`a1000001` vs `30000001`).
 *
 * todayHour는 "오늘" 회차를 업무시간 안에 넣기 위한 시드 시각이지 정규 스케줄이 아니다.
 * hour-9 UTC 변환은 seed-test-data와 같다.
 *
 * 의도적으로 하지 않는 일:
 * - User/Student를 만들지 않는다. 사람 시드가 먼저여야 한다.
 * - 출석·성적은 넣지 않는다 → `seed-report-evidence.mjs`.
 *
 * 관련: `seed-test-data.mjs`, `lib/date-kst.ts`.
 */

import pg from "pg"; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

const execute = process.argv.includes("--execute"); // 없으면 COUNT·계획만. 실수로 스케줄을 덮지 않게.
const connectionString = process.env.DIRECT_URL; // migrate와 같은 직접 연결. 앱 런타임 DATABASE_URL이 아님.

if (!connectionString) { // 시드 UUID와 충돌하지 않게 직접 Postgres. 사람 시드가 먼저여야 한다.
    throw new Error("DIRECT_URL이 필요합니다."); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
}

const url = new URL(connectionString); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
const client = new pg.Client({ connectionString }); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
const now = new Date(); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

const id = (group, sequence) => // a1000001 공간. seed-test-data의 30000001과 안 겹친다.
    `${group}-0000-4000-8000-${String(sequence).padStart(12, "0")}`; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

/** 정규 스케줄 + 오늘 임시 회차. teacherIndex는 이름순 TEACHER/STAFF 배열 모듈로. */
const classSpecs = [ // 정규 스케줄 + 오늘 임시 회차. teacherIndex는 이름순 TEACHER/STAFF 배열 모듈로.
    { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        id: id("a1000001", 1), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        name: "중1 수학 개념반", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        subject: "수학", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        schedule: { days: ["월", "수"], time: "17:00" }, // 블록 끝. 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        teacherIndex: 0, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        room: "301호", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        weekdays: [1, 3], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        hour: 17, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        durationMinutes: 90, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        todayHour: 10, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    },
    { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        id: id("a1000001", 2), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        name: "중2 수학 심화반", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        subject: "수학", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        schedule: { days: ["화", "목"], time: "19:00" }, // 블록 끝. 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        teacherIndex: 0, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        room: "302호", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        weekdays: [2, 4], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        hour: 19, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        durationMinutes: 90, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        todayHour: 13, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    },
    { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        id: id("a1000001", 3), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        name: "중3 영어 내신반", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        subject: "영어", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        schedule: { days: ["월", "금"], time: "18:30" }, // 블록 끝. 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        teacherIndex: 1, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        room: "201호", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        weekdays: [1, 5], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        hour: 18, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        minute: 30, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        durationMinutes: 100, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        todayHour: 15, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    },
    { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        id: id("a1000001", 4), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        name: "초6 과학 탐구반", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        subject: "과학", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        schedule: { days: ["토"], time: "11:00" }, // 블록 끝. 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        teacherIndex: 2, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        room: "과학실", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        weekdays: [6], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        hour: 11, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        durationMinutes: 90, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        todayHour: 20, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    },
]; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

await client.connect(); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

try { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const directorResult = await client.query( // ACTIVE DIRECTOR 1명, TEACHER|STAFF, ENROLLED 학생 3명 (보통 seed-test-data 이후).
        /* ACTIVE DIRECTOR 1명. 없으면 bootstrap 먼저. */ `SELECT id, name FROM users
         WHERE role = 'DIRECTOR' AND status = 'ACTIVE'
         ORDER BY created_at ASC
         LIMIT 1`,
    );
    const teacherResult = await client.query( // 이름순 TEACHER|STAFF. classSpecs.teacherIndex 모듈로.
        /* 이름순 TEACHER|STAFF. classSpecs.teacherIndex. */ `SELECT id, name FROM users
         WHERE role IN ('TEACHER', 'STAFF') AND status = 'ACTIVE'
         ORDER BY name ASC`,
    );
    const studentResult = await client.query( // ENROLLED 3명. PAUSED/WITHDRAWN은 출석 명단에 안 넣는다.
        /* ENROLLED 원생. PAUSED/WITHDRAWN은 시드 대상으로 안 씀. */ `SELECT id, name FROM students
         WHERE status = 'ENROLLED'
         ORDER BY created_at ASC, id ASC
         LIMIT 3`,
    );

    if (directorResult.rowCount !== 1) { // 원장이 없으면 부트스트랩부터. 어느 이메일을 쓸지 추측하지 않는다.
        throw new Error("활성 원장 계정이 필요합니다."); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    }

    const director = directorResult.rows[0]; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const teachers = teacherResult.rows; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const students = studentResult.rows; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

    if (students.length < 3) { // 반마다 3명을 넣어 출석 명단이 한 줄짜리가 되지 않게. 부족하면 사람 시드부터.
        throw new Error("목업 수강 배정에 필요한 재원생 3명이 필요합니다."); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    }
    const sessions = [ // 정규 스케줄 + 오늘 임시 슬롯. 대시보드 오늘 수업이 비지 않게.
        ...createSessions(classSpecs), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        ...createTodaySessions(classSpecs), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    ]; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

    console.log( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        JSON.stringify( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                mode: execute ? "execute" : "preview", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                target: { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    host: url.hostname, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    port: url.port || "5432", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    database: url.pathname.slice(1), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                },
                director: director.name, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                availableTeachers: teachers.map((teacher) => teacher.name), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                enrolledStudents: students.map((student) => student.name), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                planned: { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    classes: classSpecs.length, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    classSessions: sessions.length, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    classEnrollments: classSpecs.length * students.length, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                },
                classes: classSpecs.map((spec) => ({ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    name: spec.name, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    subject: spec.subject, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    teacher: // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                        teachers[spec.teacherIndex % teachers.length]?.name ?? // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                        "미지정", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    schedule: spec.schedule, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    classroom: spec.room, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                })),
            },
            null, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            2, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        ),
    );

    if (!execute) { // 미리보기만. 반·회차를 쓰지 않는다.
        console.log("미리보기만 완료했습니다. 생성하려면 --execute를 추가하세요."); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        process.exitCode = 0; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    } else { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        await client.query("BEGIN"); // 재실행이 스케줄을 최신으로 덮게 ON CONFLICT UPDATE. lock으로 겹침 방지.
        await client.query( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            "SELECT pg_advisory_xact_lock(hashtext('academy_class_mock_seed'))", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        );

        for (const spec of classSpecs) { // seed-test-data의 반과 id 공간이 다르다 (a1000001 vs 30000001).
            const teacher = // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                teachers[spec.teacherIndex % teachers.length] ?? null; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            await client.query( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                /* 반 목. seed-test의 30000001과 id 공간이 다름. */ `INSERT INTO classes
                    (id, name, subject, teacher_user_id, schedule, active, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5::jsonb, true, $6, $6)
                 ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    subject = EXCLUDED.subject,
                    teacher_user_id = EXCLUDED.teacher_user_id,
                    schedule = EXCLUDED.schedule,
                    active = true,
                    updated_at = EXCLUDED.updated_at`,
                [ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    spec.id, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    spec.name, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    spec.subject, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    teacher?.id ?? null, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    JSON.stringify(spec.schedule), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    now, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                ], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            );
        }

        for (const session of sessions) { // 정규 스케줄 + 오늘 임시 슬롯. 대시보드 오늘 수업이 비지 않게.
            await client.query( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                /* 회차. (class_id, starts_at) 충돌 시 UPDATE/NOTHING. */ `INSERT INTO class_sessions
                    (id, class_id, starts_at, ends_at, classroom, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6::class_session_status, $7, $7)
                 ON CONFLICT (id) DO UPDATE SET
                    starts_at = EXCLUDED.starts_at,
                    ends_at = EXCLUDED.ends_at,
                    classroom = EXCLUDED.classroom,
                    status = EXCLUDED.status,
                    updated_at = EXCLUDED.updated_at`,
                [ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    session.id, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    session.classId, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    session.startsAt, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    session.endsAt, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    session.room, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    session.status, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    now, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                ], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            );
        }

        let enrollmentSequence = 1; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        for (const spec of classSpecs) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            for (const student of students) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                await client.query( // ended_at=NULL로 덮는다. 퇴원 확정으로 CANCELLED가 된 목업을 다시 연다.
                    /* ACTIVE 수강. delete가 아니라 시드 INSERT. 출석 FK용. */ `INSERT INTO class_enrollments
                        (id, class_id, student_id, status, enrolled_at, ended_at, created_at, updated_at)
                     VALUES ($1, $2, $3, 'ACTIVE', $4, NULL, $5, $5)
                     ON CONFLICT (id) DO UPDATE SET
                        class_id = EXCLUDED.class_id,
                        student_id = EXCLUDED.student_id,
                        status = 'ACTIVE',
                        enrolled_at = EXCLUDED.enrolled_at,
                        ended_at = NULL,
                        updated_at = EXCLUDED.updated_at`,
                    [ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                        id("a4000001", enrollmentSequence++), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                        spec.id, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                        student.id, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                        getKstDateParts(now).date, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                        now, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    ], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                );
            }
        }

        await client.query( // 시드 출처를 남겨 운영 데이터와 구분한다.
            /* 시드 조치 audit. 페이지 뷰는 안 남긴다. */ `INSERT INTO audit_logs
                (id, actor_user_id, action, target_type, details, created_at)
             VALUES ($1, $2, 'CLASS_MOCK_DATA_SEEDED', 'CLASS', $3::jsonb, $4)
             ON CONFLICT (id) DO UPDATE SET
                actor_user_id = EXCLUDED.actor_user_id,
                details = EXCLUDED.details,
                created_at = EXCLUDED.created_at`,
            [ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                id("a9000001", 1), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                director.id, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                JSON.stringify({ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    source: "scripts/seed-class-mock-data.mjs", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    classes: classSpecs.length, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    classSessions: sessions.length, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    students: students.map((student) => student.name), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    classEnrollments: classSpecs.length * students.length, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                }),
                now, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            ], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        );

        await client.query("COMMIT"); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

        const verification = await client.query( // 이 스크립트가 넣은 UUID만 COUNT. 다른 시드 반과 섞이지 않게.
            /* 미리보기 건수. DIRECTOR OAuth는 보존. */ `SELECT
                (SELECT COUNT(*)::int FROM classes
                 WHERE id = ANY($1::uuid[])) AS classes,
                (SELECT COUNT(*)::int FROM class_sessions
                 WHERE class_id = ANY($1::uuid[])) AS class_sessions,
                (SELECT COUNT(*)::int FROM class_enrollments
                 WHERE id = ANY($2::uuid[])
                   AND status = 'ACTIVE'
                   AND ended_at IS NULL) AS class_enrollments`,
            [ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                classSpecs.map((spec) => spec.id), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                Array.from( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    { length: classSpecs.length * students.length }, // 블록 끝. 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    (_, index) => id("a4000001", index + 1), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                ),
            ], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        );
        console.log( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            JSON.stringify( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    completed: true, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                    verified: verification.rows[0], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                },
                null, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                2, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            ),
        );
    }
} catch (error) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    if (execute) { // execute 중에만. 미리보기는 쓰기가 없다.
        await client.query("ROLLBACK").catch(() => undefined); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    }
    throw error; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
} finally { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    await client.end(); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
}

function createSessions(specs) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const result = []; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    let sequence = 1; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

    for (const spec of specs) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        const dates = findScheduleDates(spec.weekdays, 3, 5); // 과거 3회 + 미래 5회. 끝난 회차는 COMPLETED — 출석 화면이 빈 예정만 아니게.
        for (const date of dates) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            const startsAt = kstDateTime( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                date, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                spec.hour, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                spec.minute ?? 0, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            );
            const endsAt = new Date( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                startsAt.getTime() + spec.durationMinutes * 60_000, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            );
            result.push({ // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                id: id("a2000001", sequence++), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                classId: spec.id, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                startsAt, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                endsAt, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                room: spec.room, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
                status: endsAt < now ? "COMPLETED" : "SCHEDULED", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            });
        }
    }

    return result; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
}

function createTodaySessions(specs) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const today = getKstDateParts(now); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

    return specs.map((spec, index) => { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        const startsAt = kstDateTime(today, spec.todayHour, 0); // 정규 요일과 무관하게 한 슬롯. 대시보드 오늘 수업이 요일 때문에 비는 것을 막음.
        const endsAt = new Date( // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            startsAt.getTime() + spec.durationMinutes * 60_000, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        );

        return { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            id: id("a3000001", index + 1), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            classId: spec.id, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            startsAt, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            endsAt, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            room: spec.room, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            status: endsAt < now ? "COMPLETED" : "SCHEDULED", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        };
    });
}

function findScheduleDates(weekdays, pastCount, futureCount) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const dates = []; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const today = getKstDateParts(now); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.

    for (let offset = -21; offset <= 35; offset += 1) { // -21~+35일에서 해당 요일만 고른 뒤, 과거/미래를 개수로 자른다.
        const candidate = addCalendarDays(today, offset); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        if (weekdays.includes(candidate.weekday)) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
            dates.push({ ...candidate, offset }); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        }
    }

    const past = dates.filter((date) => date.offset < 0).slice(-pastCount); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const todayOrFuture = dates // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        .filter((date) => date.offset >= 0) // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        .slice(0, futureCount); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    return [...past, ...todayOrFuture]; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
}

function getKstDateParts(date) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const parts = new Intl.DateTimeFormat("en-CA", { // en-CA + weekday short. getDay()는 서버 로컬이라 쓰지 않는다.
        timeZone: "Asia/Seoul", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        year: "numeric", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        month: "2-digit", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        day: "2-digit", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        weekday: "short", // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    }).formatToParts(date); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value])); // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }; // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    return { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        year: Number(value.year), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        month: Number(value.month), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        day: Number(value.day), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        weekday: weekdays[value.weekday], // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        date: `${value.year}-${value.month}-${value.day}`, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    };
}

function addCalendarDays(date, offset) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + offset)); // UTC 자정에 일수를 더해 KST 달력을 DST 없이 맞춘다 (한국은 DST 없음).
    return { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        year: utc.getUTCFullYear(), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        month: utc.getUTCMonth() + 1, // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        day: utc.getUTCDate(), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
        weekday: utc.getUTCDay(), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    };
}

function kstDateTime(date, hour, minute) { // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    return new Date( // Date.UTC 후 hour-9 = KST 벽시계. 타임존 문자열 파싱을 피한다.
        Date.UTC(date.year, date.month - 1, date.day, hour - 9, minute), // 반·회차 목. 사람 시드가 먼저. ON CONFLICT UPDATE.
    );
}
