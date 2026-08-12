/**
 * AI 리포트용 8월 근거 더미 시드 (앱 코드 변경 없음)
 * Usage:
 *   node --env-file=.env.local scripts/seed-report-evidence.mjs
 *   node --env-file=.env.local scripts/seed-report-evidence.mjs --execute
 */
import pg from "pg";
import { randomUUID } from "crypto";

const execute = process.argv.includes("--execute");
const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error("DIRECT_URL이 필요합니다.");

const MARKER = "[report-evidence-seed]";
const RANGE_START = "2026-08-01";
const RANGE_END = "2026-08-31";
const TS_START = "2026-08-01T00:00:00+09:00";
const TS_END = "2026-09-01T00:00:00+09:00";

function kstToUtc(year, month, day, hour, minute = 0) {
    return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0));
}

function dateOnly(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const WEEKLY = [
    { className: "중2 수학 A", day: 1, hour: 16, room: "301호" },
    { className: "중2 수학 A", day: 3, hour: 16, room: "301호" },
    { className: "중1 수학 개념반", day: 2, hour: 15, room: "302호" },
    { className: "중2 수학 심화반", day: 4, hour: 15, room: "303호" },
    { className: "중등 영어 B", day: 2, hour: 17, room: "201호" },
    { className: "중등 영어 B", day: 4, hour: 17, room: "201호" },
    { className: "중3 영어 내신반", day: 5, hour: 17, room: "202호" },
    { className: "과학 탐구", day: 1, hour: 18, room: "과학실" },
    { className: "과학 탐구", day: 3, hour: 18, room: "과학실" },
    { className: "초6 과학 탐구반", day: 5, hour: 16, room: "과학실2" },
    { className: "AI와 함께하는 프로그래밍", day: 2, hour: 19, room: "코딩실" },
    { className: "AI와 함께하는 프로그래밍", day: 6, hour: 11, room: "코딩실" },
];

const scoreByStudent = {
    강민준: [88, 92, 81],
    김서연: [76, 84, 79],
    박도윤: [62, 71, 68],
    이하린: [85, 80],
    정우진: [93, 87],
    최지아: [59, 66],
    윤시우: [74, 78],
    송예린: [90, 86],
};

const client = new pg.Client({ connectionString });
await client.connect();

try {
    const classes = (
        await client.query(`
      SELECT c.id, c.name, c.subject, c.teacher_user_id
      FROM classes c
      WHERE c.active = true AND c.teacher_user_id IS NOT NULL
    `)
    ).rows;
    const classById = new Map(classes.map((c) => [c.id, c]));
    const classByName = new Map(classes.map((c) => [c.name, c]));

    const enrollments = (
        await client.query(`
      SELECT e.class_id, e.student_id, s.name AS student_name
      FROM class_enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.status = 'ACTIVE' AND e.ended_at IS NULL
    `)
    ).rows;
    const students = [
        ...new Map(enrollments.map((e) => [e.student_id, e.student_name])).entries(),
    ].map(([id, name]) => ({ id, name }));

    const sessionRows = [];
    for (let day = 1; day <= 31; day += 1) {
        const weekday = new Date(Date.UTC(2026, 7, day)).getUTCDay();
        for (const slot of WEEKLY) {
            if (weekday !== slot.day) continue;
            const cls = classByName.get(slot.className);
            if (!cls) continue;
            const startsAt = kstToUtc(2026, 8, day, slot.hour, 0);
            sessionRows.push({
                classId: cls.id,
                startsAt,
                endsAt: new Date(startsAt.getTime() + 60 * 60_000),
                classroom: slot.room,
            });
        }
    }

    const gradeSpecs = [];
    for (const student of students) {
        const mine = enrollments.filter((e) => e.student_id === student.id);
        const seenSubject = new Set();
        let scoreIdx = 0;
        const scores = scoreByStudent[student.name] ?? [70, 75, 80];
        for (const enr of mine) {
            const cls = classById.get(enr.class_id);
            if (!cls || seenSubject.has(cls.subject)) continue;
            seenSubject.add(cls.subject);
            const score = scores[scoreIdx % scores.length];
            scoreIdx += 1;
            gradeSpecs.push({
                studentId: student.id,
                classId: cls.id,
                createdBy: cls.teacher_user_id,
                title: `8월 ${cls.subject} 주간평가`,
                subject: cls.subject,
                score,
                maxScore: 100,
                assessedAt: dateOnly(2026, 8, 5 + (scoreIdx % 7)),
            });
            gradeSpecs.push({
                studentId: student.id,
                classId: cls.id,
                createdBy: cls.teacher_user_id,
                title: `8월 ${cls.subject} 단원퀴즈`,
                subject: cls.subject,
                score: Math.min(100, Math.max(0, score + (scoreIdx % 2 === 0 ? 5 : -4))),
                maxScore: 100,
                assessedAt: dateOnly(2026, 8, 10 + (scoreIdx % 5)),
            });
        }
    }

    const learningSpecs = [];
    for (const student of students) {
        const primary = enrollments.find((e) => e.student_id === student.id);
        if (!primary) continue;
        const cls = classById.get(primary.class_id);
        if (!cls) continue;
        learningSpecs.push(
            {
                studentId: student.id,
                classId: cls.id,
                authorUserId: cls.teacher_user_id,
                type: "HOMEWORK",
                title: `${MARKER} 8월 과제 점검`,
                content: `${student.name} 학생 과제 제출이 대체로 성실합니다. 오답 복습을 이어서 지도합니다.`,
                recordDate: dateOnly(2026, 8, 6),
            },
            {
                studentId: student.id,
                classId: cls.id,
                authorUserId: cls.teacher_user_id,
                type: "CLASS_NOTE",
                title: `${MARKER} 수업 참여 관찰`,
                content: `질문 빈도와 집중도가 안정적입니다. ${cls.subject} 개념 연결을 강조했습니다.`,
                recordDate: dateOnly(2026, 8, 11),
            },
        );
    }

    console.log(
        JSON.stringify(
            {
                dryRun: !execute,
                students: students.length,
                plannedSessions: sessionRows.length,
                plannedGrades: gradeSpecs.length,
                plannedLearning: learningSpecs.length,
            },
            null,
            2,
        ),
    );

    if (!execute) {
        console.log("\n실제 반영하려면 --execute 를 붙이세요.");
    } else {
        await client.query("BEGIN");
        try {
            let sessionsInserted = 0;
            for (const row of sessionRows) {
                const result = await client.query(
                    `
                    INSERT INTO class_sessions
                      (id, class_id, starts_at, ends_at, classroom, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', NOW(), NOW())
                    ON CONFLICT (class_id, starts_at) DO NOTHING
                    `,
                    [randomUUID(), row.classId, row.startsAt, row.endsAt, row.classroom],
                );
                sessionsInserted += result.rowCount ?? 0;
            }

            const sessions = await client.query(
                `
                SELECT cs.id, cs.class_id, cs.starts_at
                FROM class_sessions cs
                WHERE cs.starts_at >= $1::timestamptz
                  AND cs.starts_at <  $2::timestamptz
                  AND cs.status IN ('SCHEDULED', 'COMPLETED')
                `,
                [TS_START, TS_END],
            );

            const statusCycle = [
                "PRESENT",
                "PRESENT",
                "PRESENT",
                "LATE",
                "PRESENT",
                "ABSENT",
                "PRESENT",
                "EXCUSED",
            ];
            let attendanceInserted = 0;
            let i = 0;
            for (const session of sessions.rows) {
                const classEnrolled = enrollments.filter(
                    (e) => e.class_id === session.class_id,
                );
                for (const enr of classEnrolled) {
                    const status = statusCycle[i % statusCycle.length];
                    i += 1;
                    const checkIn =
                        status === "PRESENT" || status === "LATE"
                            ? new Date(
                                  new Date(session.starts_at).getTime() +
                                      (status === "LATE" ? 10 : -3) * 60_000,
                              )
                            : null;
                    const result = await client.query(
                        `
                        INSERT INTO attendance_records
                          (id, student_id, session_id, status, check_in_at, note, updated_by, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                        ON CONFLICT (student_id, session_id) DO NOTHING
                        `,
                        [
                            randomUUID(),
                            enr.student_id,
                            session.id,
                            status,
                            checkIn,
                            `${MARKER} auto`,
                            classById.get(session.class_id)?.teacher_user_id ?? null,
                        ],
                    );
                    attendanceInserted += result.rowCount ?? 0;
                }
            }

            let gradesInserted = 0;
            for (const g of gradeSpecs) {
                const exists = await client.query(
                    `
                    SELECT 1 FROM grade_records
                    WHERE student_id = $1 AND title = $2 AND assessed_at = $3::date
                    LIMIT 1
                    `,
                    [g.studentId, g.title, g.assessedAt],
                );
                if (exists.rowCount) continue;
                const result = await client.query(
                    `
                    INSERT INTO grade_records
                      (id, student_id, class_id, created_by, title, subject, score, max_score, assessed_at, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,NOW(),NOW())
                    `,
                    [
                        randomUUID(),
                        g.studentId,
                        g.classId,
                        g.createdBy,
                        g.title,
                        g.subject,
                        g.score,
                        g.maxScore,
                        g.assessedAt,
                    ],
                );
                gradesInserted += result.rowCount ?? 0;
            }

            let learningInserted = 0;
            for (const row of learningSpecs) {
                const exists = await client.query(
                    `
                    SELECT 1 FROM learning_records
                    WHERE student_id = $1 AND title = $2 AND record_date = $3::date
                    LIMIT 1
                    `,
                    [row.studentId, row.title, row.recordDate],
                );
                if (exists.rowCount) continue;
                const result = await client.query(
                    `
                    INSERT INTO learning_records
                      (id, student_id, class_id, author_user_id, type, title, content, record_date, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,NOW(),NOW())
                    `,
                    [
                        randomUUID(),
                        row.studentId,
                        row.classId,
                        row.authorUserId,
                        row.type,
                        row.title,
                        row.content,
                        row.recordDate,
                    ],
                );
                learningInserted += result.rowCount ?? 0;
            }

            let wrongInserted = 0;
            for (const student of students) {
                const grade = await client.query(
                    `
                    SELECT id, class_id, created_by
                    FROM grade_records
                    WHERE student_id = $1
                      AND assessed_at >= $2::date
                      AND assessed_at <= $3::date
                    ORDER BY assessed_at DESC
                    LIMIT 1
                    `,
                    [student.id, RANGE_START, RANGE_END],
                );
                if (!grade.rows[0]) continue;
                const g = grade.rows[0];
                const qText = `${MARKER} 8월 오답 복습`;
                const exists = await client.query(
                    `
                    SELECT 1 FROM wrong_notes
                    WHERE student_id = $1 AND question_text = $2
                    LIMIT 1
                    `,
                    [student.id, qText],
                );
                if (exists.rowCount) continue;
                const result = await client.query(
                    `
                    INSERT INTO wrong_notes
                      (id, student_id, grade_record_id, class_id, author_user_id,
                       question_no, question_text, student_answer, correct_answer, explanation,
                       status, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,'3',$6,'오답 예시','정답 예시','개념 재확인 후 유사 문제로 연습하세요.','OPEN',
                            TIMESTAMPTZ '2026-08-08 12:00:00+09', NOW())
                    `,
                    [randomUUID(), student.id, g.id, g.class_id, g.created_by, qText],
                );
                wrongInserted += result.rowCount ?? 0;
            }

            await client.query("COMMIT");

            const verify = await client.query(
                `
                SELECT
                  (SELECT COUNT(*)::int FROM grade_records WHERE assessed_at >= $1::date AND assessed_at <= $2::date) AS grades,
                  (SELECT COUNT(*)::int FROM class_sessions WHERE starts_at >= $3::timestamptz AND starts_at < $4::timestamptz) AS sessions,
                  (SELECT COUNT(*)::int FROM attendance_records ar
                     JOIN class_sessions cs ON cs.id = ar.session_id
                    WHERE cs.starts_at >= $3::timestamptz AND cs.starts_at < $4::timestamptz) AS attendance,
                  (SELECT COUNT(*)::int FROM learning_records WHERE record_date >= $1::date AND record_date <= $2::date) AS learning,
                  (SELECT COUNT(*)::int FROM wrong_notes WHERE created_at >= $3::timestamptz AND created_at < $4::timestamptz) AS wrong_notes
                `,
                [RANGE_START, RANGE_END, TS_START, TS_END],
            );

            console.log(
                JSON.stringify(
                    {
                        inserted: {
                            sessionsInserted,
                            attendanceInserted,
                            gradesInserted,
                            learningInserted,
                            wrongInserted,
                        },
                        augustTotals: verify.rows[0],
                    },
                    null,
                    2,
                ),
            );
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    }
} finally {
    await client.end();
}
