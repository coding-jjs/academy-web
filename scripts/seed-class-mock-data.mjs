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

import pg from "pg";

const execute = process.argv.includes("--execute");
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("DIRECT_URL이 필요합니다.");
}

const url = new URL(connectionString);
const client = new pg.Client({ connectionString });
const now = new Date();

const id = (group, sequence) =>
    `${group}-0000-4000-8000-${String(sequence).padStart(12, "0")}`;

/** 정규 스케줄 + 오늘 임시 회차. teacherIndex는 이름순 TEACHER/STAFF 배열 모듈로. */
const classSpecs = [
    {
        id: id("a1000001", 1),
        name: "중1 수학 개념반",
        subject: "수학",
        schedule: { days: ["월", "수"], time: "17:00" },
        teacherIndex: 0,
        room: "301호",
        weekdays: [1, 3],
        hour: 17,
        durationMinutes: 90,
        todayHour: 10,
    },
    {
        id: id("a1000001", 2),
        name: "중2 수학 심화반",
        subject: "수학",
        schedule: { days: ["화", "목"], time: "19:00" },
        teacherIndex: 0,
        room: "302호",
        weekdays: [2, 4],
        hour: 19,
        durationMinutes: 90,
        todayHour: 13,
    },
    {
        id: id("a1000001", 3),
        name: "중3 영어 내신반",
        subject: "영어",
        schedule: { days: ["월", "금"], time: "18:30" },
        teacherIndex: 1,
        room: "201호",
        weekdays: [1, 5],
        hour: 18,
        minute: 30,
        durationMinutes: 100,
        todayHour: 15,
    },
    {
        id: id("a1000001", 4),
        name: "초6 과학 탐구반",
        subject: "과학",
        schedule: { days: ["토"], time: "11:00" },
        teacherIndex: 2,
        room: "과학실",
        weekdays: [6],
        hour: 11,
        durationMinutes: 90,
        todayHour: 20,
    },
];

await client.connect();

try {
    const directorResult = await client.query(
        /* ACTIVE DIRECTOR 1명. 없으면 bootstrap 먼저. */ `SELECT id, name FROM users
         WHERE role = 'DIRECTOR' AND status = 'ACTIVE'
         ORDER BY created_at ASC
         LIMIT 1`,
    );
    const teacherResult = await client.query(
        /* 이름순 TEACHER|STAFF. classSpecs.teacherIndex. */ `SELECT id, name FROM users
         WHERE role IN ('TEACHER', 'STAFF') AND status = 'ACTIVE'
         ORDER BY name ASC`,
    );
    const studentResult = await client.query(
        /* ENROLLED 원생. PAUSED/WITHDRAWN은 시드 대상으로 안 씀. */ `SELECT id, name FROM students
         WHERE status = 'ENROLLED'
         ORDER BY created_at ASC, id ASC
         LIMIT 3`,
    );

    if (directorResult.rowCount !== 1) {
        throw new Error("활성 원장 계정이 필요합니다.");
    }

    const director = directorResult.rows[0];
    const teachers = teacherResult.rows;
    const students = studentResult.rows;

    if (students.length < 3) {
        throw new Error("목업 수강 배정에 필요한 재원생 3명이 필요합니다.");
    }
    const sessions = [
        ...createSessions(classSpecs),
        ...createTodaySessions(classSpecs),
    ];

    console.log(
        JSON.stringify(
            {
                mode: execute ? "execute" : "preview",
                target: {
                    host: url.hostname,
                    port: url.port || "5432",
                    database: url.pathname.slice(1),
                },
                director: director.name,
                availableTeachers: teachers.map((teacher) => teacher.name),
                enrolledStudents: students.map((student) => student.name),
                planned: {
                    classes: classSpecs.length,
                    classSessions: sessions.length,
                    classEnrollments: classSpecs.length * students.length,
                },
                classes: classSpecs.map((spec) => ({
                    name: spec.name,
                    subject: spec.subject,
                    teacher:
                        teachers[spec.teacherIndex % teachers.length]?.name ??
                        "미지정",
                    schedule: spec.schedule,
                    classroom: spec.room,
                })),
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
            "SELECT pg_advisory_xact_lock(hashtext('academy_class_mock_seed'))",
        );

        for (const spec of classSpecs) {
            const teacher =
                teachers[spec.teacherIndex % teachers.length] ?? null;
            await client.query(
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
                [
                    spec.id,
                    spec.name,
                    spec.subject,
                    teacher?.id ?? null,
                    JSON.stringify(spec.schedule),
                    now,
                ],
            );
        }

        for (const session of sessions) {
            await client.query(
                /* 회차. (class_id, starts_at) 충돌 시 UPDATE/NOTHING. */ `INSERT INTO class_sessions
                    (id, class_id, starts_at, ends_at, classroom, status, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6::class_session_status, $7, $7)
                 ON CONFLICT (id) DO UPDATE SET
                    starts_at = EXCLUDED.starts_at,
                    ends_at = EXCLUDED.ends_at,
                    classroom = EXCLUDED.classroom,
                    status = EXCLUDED.status,
                    updated_at = EXCLUDED.updated_at`,
                [
                    session.id,
                    session.classId,
                    session.startsAt,
                    session.endsAt,
                    session.room,
                    session.status,
                    now,
                ],
            );
        }

        let enrollmentSequence = 1;
        for (const spec of classSpecs) {
            for (const student of students) {
                await client.query(
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
                    [
                        id("a4000001", enrollmentSequence++),
                        spec.id,
                        student.id,
                        getKstDateParts(now).date,
                        now,
                    ],
                );
            }
        }

        await client.query(
            /* 시드 조치 audit. 페이지 뷰는 안 남긴다. */ `INSERT INTO audit_logs
                (id, actor_user_id, action, target_type, details, created_at)
             VALUES ($1, $2, 'CLASS_MOCK_DATA_SEEDED', 'CLASS', $3::jsonb, $4)
             ON CONFLICT (id) DO UPDATE SET
                actor_user_id = EXCLUDED.actor_user_id,
                details = EXCLUDED.details,
                created_at = EXCLUDED.created_at`,
            [
                id("a9000001", 1),
                director.id,
                JSON.stringify({
                    source: "scripts/seed-class-mock-data.mjs",
                    classes: classSpecs.length,
                    classSessions: sessions.length,
                    students: students.map((student) => student.name),
                    classEnrollments: classSpecs.length * students.length,
                }),
                now,
            ],
        );

        await client.query("COMMIT");

        const verification = await client.query(
            /* 미리보기 건수. DIRECTOR OAuth는 보존. */ `SELECT
                (SELECT COUNT(*)::int FROM classes
                 WHERE id = ANY($1::uuid[])) AS classes,
                (SELECT COUNT(*)::int FROM class_sessions
                 WHERE class_id = ANY($1::uuid[])) AS class_sessions,
                (SELECT COUNT(*)::int FROM class_enrollments
                 WHERE id = ANY($2::uuid[])
                   AND status = 'ACTIVE'
                   AND ended_at IS NULL) AS class_enrollments`,
            [
                classSpecs.map((spec) => spec.id),
                Array.from(
                    { length: classSpecs.length * students.length },
                    (_, index) => id("a4000001", index + 1),
                ),
            ],
        );
        console.log(
            JSON.stringify(
                {
                    completed: true,
                    verified: verification.rows[0],
                },
                null,
                2,
            ),
        );
    }
} catch (error) {
    if (execute) {
        await client.query("ROLLBACK").catch(() => undefined);
    }
    throw error;
} finally {
    await client.end();
}

function createSessions(specs) {
    const result = [];
    let sequence = 1;

    for (const spec of specs) {
        const dates = findScheduleDates(spec.weekdays, 3, 5);
        for (const date of dates) {
            const startsAt = kstDateTime(
                date,
                spec.hour,
                spec.minute ?? 0,
            );
            const endsAt = new Date(
                startsAt.getTime() + spec.durationMinutes * 60_000,
            );
            result.push({
                id: id("a2000001", sequence++),
                classId: spec.id,
                startsAt,
                endsAt,
                room: spec.room,
                status: endsAt < now ? "COMPLETED" : "SCHEDULED",
            });
        }
    }

    return result;
}

function createTodaySessions(specs) {
    const today = getKstDateParts(now);

    return specs.map((spec, index) => {
        const startsAt = kstDateTime(today, spec.todayHour, 0);
        const endsAt = new Date(
            startsAt.getTime() + spec.durationMinutes * 60_000,
        );

        return {
            id: id("a3000001", index + 1),
            classId: spec.id,
            startsAt,
            endsAt,
            room: spec.room,
            status: endsAt < now ? "COMPLETED" : "SCHEDULED",
        };
    });
}

function findScheduleDates(weekdays, pastCount, futureCount) {
    const dates = [];
    const today = getKstDateParts(now);

    for (let offset = -21; offset <= 35; offset += 1) {
        const candidate = addCalendarDays(today, offset);
        if (weekdays.includes(candidate.weekday)) {
            dates.push({ ...candidate, offset });
        }
    }

    const past = dates.filter((date) => date.offset < 0).slice(-pastCount);
    const todayOrFuture = dates
        .filter((date) => date.offset >= 0)
        .slice(0, futureCount);
    return [...past, ...todayOrFuture];
}

function getKstDateParts(date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const weekdays = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
        year: Number(value.year),
        month: Number(value.month),
        day: Number(value.day),
        weekday: weekdays[value.weekday],
        date: `${value.year}-${value.month}-${value.day}`,
    };
}

function addCalendarDays(date, offset) {
    const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + offset));
    return {
        year: utc.getUTCFullYear(),
        month: utc.getUTCMonth() + 1,
        day: utc.getUTCDate(),
        weekday: utc.getUTCDay(),
    };
}

function kstDateTime(date, hour, minute) {
    return new Date(
        Date.UTC(date.year, date.month - 1, date.day, hour - 9, minute),
    );
}
