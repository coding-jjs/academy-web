/**
 * 리포트 근거(성적·출석·학습기록·오답) 목 데이터를 넣는다.
 * Gemini 초안 생성을 로컬에서 재현하기 위해 2026-08 한 달을 채운다.
 *
 * 실행: `node --env-file=.env.local scripts/seed-report-evidence.mjs` (미리보기)
 *       같은 명령 + `--execute`. package.json 스크립트는 아직 없다.
 *
 * 전제: 활성 반·ACTIVE 수강이 있어야 한다 (seed-test 또는 seed-classes).
 * 쓰기: DIRECT_URL. 회차는 `(class_id, starts_at)` 충돌 시 DO NOTHING.
 * 성적/학습/오답은 제목+날짜로 존재 여부를 봐 중복을 피한다 (고정 UUID가 아님).
 *
 * MARKER 문자열로 시드 행을 구분한다. 출석 노트·오답 본문에 남아 운영 데이터와 섞여도 보인다.
 * 날짜를 2026-08로 고정한 이유: "이번 달"이 바뀌어도 초안 프롬프트 구간을 재현 가능하게.
 *
 * 의도적으로 하지 않는 일:
 * - User/반을 만들지 않는다. 이름 매칭(`강민준` 등)이 시드 학생과 같아야 점수가 붙는다.
 * - 이미 있는 출석을 덮어쓰지 않는다 (DO NOTHING).
 *
 * 관련: `features/reports/draft-generator.ts`, `seed-test-data.mjs`.
 */

import pg from "pg"; // 2026-08 리포트 근거. 출석은 DO NOTHING.
import { randomUUID } from "crypto"; // 이름만 가져온다. 역할 가드는 proxy·requireRole.

const execute = process.argv.includes("--execute"); // 없으면 계획만. 이미 있는 출석을 덮지 않게.
const connectionString = process.env.DIRECT_URL; // migrate와 같은 직접 연결. User/반을 만들지 않는다.

if (!connectionString) throw new Error("DIRECT_URL이 필요합니다."); // 회차는 (class_id, starts_at) 충돌 시 DO NOTHING.

const MARKER = "[report-evidence-seed]"; // 시드 행 구분. 운영 데이터와 섞여도 본문에 남는다.
const RANGE_START = "2026-08-01"; // "이번 달"이 바뀌어도 초안 프롬프트 구간을 재현 가능하게.
const RANGE_END = "2026-08-31"; // 2026-08 리포트 근거. 출석은 DO NOTHING.
const TS_START = "2026-08-01T00:00:00+09:00"; // 2026-08 리포트 근거. 출석은 DO NOTHING.
const TS_END = "2026-09-01T00:00:00+09:00"; // 2026-08 리포트 근거. 출석은 DO NOTHING.

/** KST 벽시계 → UTC Date. month는 1-12. */
function kstToUtc(year, month, day, hour, minute = 0) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
    return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0)); // hour-9를 Date.UTC에 넣어 한국 16시가 UTC 07시로 저장되게.
}

/** 성적/학습 `date` 컬럼용. 타임존 변환 없이 달력 문자열만. */
function dateOnly(year, month, day) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`; // 2026-08 리포트 근거. 출석은 DO NOTHING.
}

const WEEKLY = [ // day: Date.getUTCDay() (0=일). seed-test 반 이름과 같아야 classByName이 맞는다.
    { className: "중2 수학 A", day: 1, hour: 16, room: "301호" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "중2 수학 A", day: 3, hour: 16, room: "301호" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "중1 수학 개념반", day: 2, hour: 15, room: "302호" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "중2 수학 심화반", day: 4, hour: 15, room: "303호" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "중등 영어 B", day: 2, hour: 17, room: "201호" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "중등 영어 B", day: 4, hour: 17, room: "201호" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "중3 영어 내신반", day: 5, hour: 17, room: "202호" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "과학 탐구", day: 1, hour: 18, room: "과학실" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "과학 탐구", day: 3, hour: 18, room: "과학실" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "초6 과학 탐구반", day: 5, hour: 16, room: "과학실2" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "AI와 함께하는 프로그래밍", day: 2, hour: 19, room: "코딩실" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
    { className: "AI와 함께하는 프로그래밍", day: 6, hour: 11, room: "코딩실" }, // 블록 끝. 2026-08 리포트 근거. 출석은 DO NOTHING.
]; // 2026-08 리포트 근거. 출석은 DO NOTHING.

const scoreByStudent = { // SCORE_DROP 재현. 이름 매칭이 시드 학생과 같아야 한다.
    강민준: [88, 92, 81], // 2026-08 리포트 근거. 출석은 DO NOTHING.
    김서연: [76, 84, 79], // 2026-08 리포트 근거. 출석은 DO NOTHING.
    박도윤: [62, 71, 68], // 2026-08 리포트 근거. 출석은 DO NOTHING.
    이하린: [85, 80], // 2026-08 리포트 근거. 출석은 DO NOTHING.
    정우진: [93, 87], // 2026-08 리포트 근거. 출석은 DO NOTHING.
    최지아: [59, 66], // 2026-08 리포트 근거. 출석은 DO NOTHING.
    윤시우: [74, 78], // 2026-08 리포트 근거. 출석은 DO NOTHING.
    송예린: [90, 86], // 2026-08 리포트 근거. 출석은 DO NOTHING.
};

const client = new pg.Client({ connectionString }); // 2026-08 리포트 근거. 출석은 DO NOTHING.
await client.connect(); // 2026-08 리포트 근거. 출석은 DO NOTHING.

try { // 2026-08 리포트 근거. 출석은 DO NOTHING.
    const classes = ( // 활성 반·ACTIVE 수강. User/반을 만들지 않으므로 이름 매칭이 시드와 같아야 한다.
        await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
        /* 활성 반. 이름 매칭이 시드 학생과 같아야 점수가 붙는다. */ `
      SELECT c.id, c.name, c.subject, c.teacher_user_id
      FROM classes c
      WHERE c.active = true AND c.teacher_user_id IS NOT NULL
    `)
    ).rows; // 2026-08 리포트 근거. 출석은 DO NOTHING.
    const classById = new Map(classes.map((c) => [c.id, c])); // 2026-08 리포트 근거. 출석은 DO NOTHING.
    const classByName = new Map(classes.map((c) => [c.name, c])); // 2026-08 리포트 근거. 출석은 DO NOTHING.

    const enrollments = ( // ACTIVE + endedAt null. 끝난 수강으로 타반 학생을 끌어오지 않는다.
        await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
        /* 2026-08 리포트 근거 SQL. 출석은 DO NOTHING. */ `
      SELECT e.class_id, e.student_id, s.name AS student_name
      FROM class_enrollments e
      JOIN students s ON s.id = e.student_id
      WHERE e.status = 'ACTIVE' AND e.ended_at IS NULL
    `)
    ).rows; // 2026-08 리포트 근거. 출석은 DO NOTHING.
    const students = [ // 이름 매칭이 시드와 같아야 점수가 붙는다. User/반을 만들지 않는다.
        ...new Map(enrollments.map((e) => [e.student_id, e.student_name])).entries(), // 2026-08 리포트 근거. 출석은 DO NOTHING.
    ].map(([id, name]) => ({ id, name })); // 2026-08 리포트 근거. 출석은 DO NOTHING.

    const sessionRows = []; // 2026-08 리포트 근거. 출석은 DO NOTHING.
    for (let day = 1; day <= 31; day += 1) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
        const weekday = new Date(Date.UTC(2026, 7, day)).getUTCDay(); // UTC 2026-08-day의 요일 = 그날 KST 요일 (자정 UTC는 오전 9시 KST라 날짜가 안 밀림).
        for (const slot of WEEKLY) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
            if (weekday !== slot.day) continue; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            const cls = classByName.get(slot.className); // 2026-08 리포트 근거. 출석은 DO NOTHING.
            if (!cls) continue; // seed-test 반 이름이 없으면 그 슬롯만 건너뛴다. 없는 반을 만들지 않는다.
            const startsAt = kstToUtc(2026, 8, day, slot.hour, 0); // 2026-08 리포트 근거. 출석은 DO NOTHING.
            sessionRows.push({ // 2026-08 리포트 근거. 출석은 DO NOTHING.
                classId: cls.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                startsAt, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                endsAt: new Date(startsAt.getTime() + 60 * 60_000), // 2026-08 리포트 근거. 출석은 DO NOTHING.
                classroom: slot.room, // 2026-08 리포트 근거. 출석은 DO NOTHING.
            });
        }
    }

    const gradeSpecs = []; // 2026-08 리포트 근거. 출석은 DO NOTHING.
    for (const student of students) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
        const mine = enrollments.filter((e) => e.student_id === student.id); // 2026-08 리포트 근거. 출석은 DO NOTHING.
        const seenSubject = new Set(); // 2026-08 리포트 근거. 출석은 DO NOTHING.
        let scoreIdx = 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
        const scores = scoreByStudent[student.name] ?? [70, 75, 80]; // 2026-08 리포트 근거. 출석은 DO NOTHING.
        for (const enr of mine) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
            const cls = classById.get(enr.class_id); // 2026-08 리포트 근거. 출석은 DO NOTHING.
            if (!cls || seenSubject.has(cls.subject)) continue; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            seenSubject.add(cls.subject); // 2026-08 리포트 근거. 출석은 DO NOTHING.
            const score = scores[scoreIdx % scores.length]; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            scoreIdx += 1; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            gradeSpecs.push({ // 과목당 주간평가+단원퀴즈 두 점. SCORE_DROP 신호를 재현할 수 있게.
                studentId: student.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                classId: cls.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                createdBy: cls.teacher_user_id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                title: `8월 ${cls.subject} 주간평가`, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                subject: cls.subject, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                score, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                maxScore: 100, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                assessedAt: dateOnly(2026, 8, 5 + (scoreIdx % 7)), // 2026-08 리포트 근거. 출석은 DO NOTHING.
            });
            gradeSpecs.push({ // 2026-08 리포트 근거. 출석은 DO NOTHING.
                studentId: student.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                classId: cls.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                createdBy: cls.teacher_user_id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                title: `8월 ${cls.subject} 단원퀴즈`, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                subject: cls.subject, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                score: Math.min(100, Math.max(0, score + (scoreIdx % 2 === 0 ? 5 : -4))), // 2026-08 리포트 근거. 출석은 DO NOTHING.
                maxScore: 100, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                assessedAt: dateOnly(2026, 8, 10 + (scoreIdx % 5)), // 2026-08 리포트 근거. 출석은 DO NOTHING.
            });
        }
    }

    const learningSpecs = []; // 2026-08 리포트 근거. 출석은 DO NOTHING.
    for (const student of students) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
        const primary = enrollments.find((e) => e.student_id === student.id); // 2026-08 리포트 근거. 출석은 DO NOTHING.
        if (!primary) continue; // 2026-08 리포트 근거. 출석은 DO NOTHING.
        const cls = classById.get(primary.class_id); // 2026-08 리포트 근거. 출석은 DO NOTHING.
        if (!cls) continue; // 2026-08 리포트 근거. 출석은 DO NOTHING.
        learningSpecs.push( // MARKER로 시드 행을 구분. 운영 데이터와 섞여도 본문에 남는다.
            { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                studentId: student.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                classId: cls.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                authorUserId: cls.teacher_user_id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                type: "HOMEWORK", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                title: `${MARKER} 8월 과제 점검`, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                content: `${student.name} 학생 과제 제출이 대체로 성실합니다. 오답 복습을 이어서 지도합니다.`, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                recordDate: dateOnly(2026, 8, 6), // 2026-08 리포트 근거. 출석은 DO NOTHING.
            },
            { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                studentId: student.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                classId: cls.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                authorUserId: cls.teacher_user_id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                type: "CLASS_NOTE", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                title: `${MARKER} 수업 참여 관찰`, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                content: `질문 빈도와 집중도가 안정적입니다. ${cls.subject} 개념 연결을 강조했습니다.`, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                recordDate: dateOnly(2026, 8, 11), // 2026-08 리포트 근거. 출석은 DO NOTHING.
            },
        );
    }

    console.log( // 2026-08 리포트 근거. 출석은 DO NOTHING.
        JSON.stringify( // 2026-08 리포트 근거. 출석은 DO NOTHING.
            { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                dryRun: !execute, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                students: students.length, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                plannedSessions: sessionRows.length, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                plannedGrades: gradeSpecs.length, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                plannedLearning: learningSpecs.length, // 2026-08 리포트 근거. 출석은 DO NOTHING.
            },
            null, // 2026-08 리포트 근거. 출석은 DO NOTHING.
            2, // 2026-08 리포트 근거. 출석은 DO NOTHING.
        ),
    );

    if (!execute) { // 미리보기만. 회차·출석을 쓰지 않는다.
        console.log("\n실제 반영하려면 --execute 를 붙이세요."); // 2026-08 리포트 근거. 출석은 DO NOTHING.
    } else { // 2026-08 리포트 근거. 출석은 DO NOTHING.
        await client.query("BEGIN"); // 회차→출석→성적→학습→오답. 하나라도 실패하면 전부 되돌린다.
        try { // 2026-08 리포트 근거. 출석은 DO NOTHING.
            let sessionsInserted = 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            for (const row of sessionRows) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                const result = await client.query( // id는 매번 UUID. 같은 반·시작시각이면 건너뛰어 출석 FK를 안 바꿈.
                    /* 회차. (class_id, starts_at) 충돌 시 UPDATE/NOTHING. */ `
                    INSERT INTO class_sessions
                      (id, class_id, starts_at, ends_at, classroom, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', NOW(), NOW())
                      ON CONFLICT (class_id, starts_at) DO NOTHING
                    `,
                    [randomUUID(), row.classId, row.startsAt, row.endsAt, row.classroom], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                sessionsInserted += result.rowCount ?? 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            }

            const sessions = await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                /* 2026-08 리포트 근거 SQL. 출석은 DO NOTHING. */ `
                SELECT cs.id, cs.class_id, cs.starts_at
                FROM class_sessions cs
                WHERE cs.starts_at >= $1::timestamptz
                  AND cs.starts_at <  $2::timestamptz
                  AND cs.status IN ('SCHEDULED', 'COMPLETED')
                `,
                [TS_START, TS_END], // 2026-08 리포트 근거. 출석은 DO NOTHING.
            );

            const statusCycle = [ // 결석·지각이 초안 프롬프트에 섞이게. LATE만 시작+10분 check_in.
                "PRESENT", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                "PRESENT", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                "PRESENT", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                "LATE", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                "PRESENT", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                "ABSENT", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                "PRESENT", // 2026-08 리포트 근거. 출석은 DO NOTHING.
                "EXCUSED", // 2026-08 리포트 근거. 출석은 DO NOTHING.
            ]; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            let attendanceInserted = 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            let i = 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            for (const session of sessions.rows) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                const classEnrolled = enrollments.filter( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    (e) => e.class_id === session.class_id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                for (const enr of classEnrolled) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    const status = statusCycle[i % statusCycle.length]; // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    i += 1; // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    const checkIn = // PRESENT는 시작 3분 전, LATE는 10분 후. ABSENT/EXCUSED는 시각 없음.
                        status === "PRESENT" || status === "LATE" // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            ? new Date( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                                  new Date(session.starts_at).getTime() + // 2026-08 리포트 근거. 출석은 DO NOTHING.
                                      (status === "LATE" ? 10 : -3) * 60_000, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                              )
                            : null; // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    const result = await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        /* 시드 INSERT. 앱 런타임 Prisma가 아님. DIRECT_URL. */ `
                        INSERT INTO attendance_records
                          (id, student_id, session_id, status, check_in_at, note, updated_by, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
                        ON CONFLICT (student_id, session_id) DO NOTHING
                        `,
                        [ // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            randomUUID(), // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            enr.student_id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            session.id, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            status, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            checkIn, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            `${MARKER} auto`, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            classById.get(session.class_id)?.teacher_user_id ?? null, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        ], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    );
                    attendanceInserted += result.rowCount ?? 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
                }
            }

            let gradesInserted = 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            for (const g of gradeSpecs) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                const exists = await client.query( // 제목+평가일. UUID가 매번 달라 충돌 키로 쓸 수 없다.
                    /* 2026-08 리포트 근거 SQL. 출석은 DO NOTHING. */ `
                    SELECT 1 FROM grade_records
                    WHERE student_id = $1 AND title = $2 AND assessed_at = $3::date
                    LIMIT 1
                    `,
                    [g.studentId, g.title, g.assessedAt], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                if (exists.rowCount) continue; // 같은 제목+날짜가 있으면 건너뛴다. 재실행이 점수를 덮지 않게.
                const result = await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    /* 시드 INSERT. 앱 런타임 Prisma가 아님. DIRECT_URL. */ `
                    INSERT INTO grade_records
                      (id, student_id, class_id, created_by, title, subject, score, max_score, assessed_at, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,NOW(),NOW())
                    `,
                    [ // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        randomUUID(), // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.studentId, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.classId, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.createdBy, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.title, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.subject, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.score, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.maxScore, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        g.assessedAt, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    ], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                gradesInserted += result.rowCount ?? 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            }

            let learningInserted = 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            for (const row of learningSpecs) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                const exists = await client.query( // 같은 학생·제목·날짜면 건너뛴다. 재실행이 본문을 덮지 않게.
                    /* 2026-08 리포트 근거 SQL. 출석은 DO NOTHING. */ `
                    SELECT 1 FROM learning_records
                    WHERE student_id = $1 AND title = $2 AND record_date = $3::date
                    LIMIT 1
                    `,
                    [row.studentId, row.title, row.recordDate], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                if (exists.rowCount) continue; // MARKER 제목이 이미 있으면 본문을 덮지 않는다.
                const result = await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    /* 시드 INSERT. 앱 런타임 Prisma가 아님. DIRECT_URL. */ `
                    INSERT INTO learning_records
                      (id, student_id, class_id, author_user_id, type, title, content, record_date, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,NOW(),NOW())
                    `,
                    [ // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        randomUUID(), // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        row.studentId, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        row.classId, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        row.authorUserId, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        row.type, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        row.title, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        row.content, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        row.recordDate, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    ], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                learningInserted += result.rowCount ?? 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            }

            let wrongInserted = 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            for (const student of students) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                const grade = await client.query( // 8월 성적 한 건에 붙여 초안이 오답 복습을 인용하게.
                    /* 2026-08 리포트 근거 SQL. 출석은 DO NOTHING. */ `
                    SELECT id, class_id, created_by
                    FROM grade_records
                    WHERE student_id = $1
                      AND assessed_at >= $2::date
                      AND assessed_at <= $3::date
                    ORDER BY assessed_at DESC
                    LIMIT 1
                    `,
                    [student.id, RANGE_START, RANGE_END], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                if (!grade.rows[0]) continue; // 8월 성적이 없으면 오답을 만들지 않는다. FK가 비는 것을 막음.
                const g = grade.rows[0]; // 2026-08 리포트 근거. 출석은 DO NOTHING.
                const qText = `${MARKER} 8월 오답 복습`; // 2026-08 리포트 근거. 출석은 DO NOTHING.
                const exists = await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    /* 2026-08 리포트 근거 SQL. 출석은 DO NOTHING. */ `
                    SELECT 1 FROM wrong_notes
                    WHERE student_id = $1 AND question_text = $2
                    LIMIT 1
                    `,
                    [student.id, qText], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                if (exists.rowCount) continue; // 같은 오답 문항이 있으면 건너뛴다.
                const result = await client.query( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    /* 시드 INSERT. 앱 런타임 Prisma가 아님. DIRECT_URL. */ `
                    INSERT INTO wrong_notes
                      (id, student_id, grade_record_id, class_id, author_user_id,
                       question_no, question_text, student_answer, correct_answer, explanation,
                       status, created_at, updated_at)
                    VALUES ($1,$2,$3,$4,$5,'3',$6,'오답 예시','정답 예시','개념 재확인 후 유사 문제로 연습하세요.','OPEN',
                            TIMESTAMPTZ '2026-08-08 12:00:00+09', NOW())
                    `,
                    [randomUUID(), student.id, g.id, g.class_id, g.created_by, qText], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                );
                wrongInserted += result.rowCount ?? 0; // 2026-08 리포트 근거. 출석은 DO NOTHING.
            }

            await client.query("COMMIT"); // 2026-08 리포트 근거. 출석은 DO NOTHING.

            const verify = await client.query( // 2026-08 구간 건수. "이번 달"이 바뀌어도 초안 프롬프트 구간을 재현 가능하게.
                /* 미리보기 건수. DIRECTOR OAuth는 보존. */ `
                SELECT
                  (SELECT COUNT(*)::int FROM grade_records WHERE assessed_at >= $1::date AND assessed_at <= $2::date) AS grades,
                  (SELECT COUNT(*)::int FROM class_sessions WHERE starts_at >= $3::timestamptz AND starts_at < $4::timestamptz) AS sessions,
                  (SELECT COUNT(*)::int FROM attendance_records ar
                     JOIN class_sessions cs ON cs.id = ar.session_id
                    WHERE cs.starts_at >= $3::timestamptz AND cs.starts_at < $4::timestamptz) AS attendance,
                  (SELECT COUNT(*)::int FROM learning_records WHERE record_date >= $1::date AND record_date <= $2::date) AS learning,
                  (SELECT COUNT(*)::int FROM wrong_notes WHERE created_at >= $3::timestamptz AND created_at < $4::timestamptz) AS wrong_notes
                `,
                [RANGE_START, RANGE_END, TS_START, TS_END], // 2026-08 리포트 근거. 출석은 DO NOTHING.
            );

            console.log( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                JSON.stringify( // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        inserted: { // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            sessionsInserted, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            attendanceInserted, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            gradesInserted, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            learningInserted, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                            wrongInserted, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                        },
                        augustTotals: verify.rows[0], // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    },
                    null, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                    2, // 2026-08 리포트 근거. 출석은 DO NOTHING.
                ),
            );
        } catch (error) { // 2026-08 리포트 근거. 출석은 DO NOTHING.
            await client.query("ROLLBACK"); // 회차·출석·성적 중 하나라도 실패하면 8월 근거를 부분 저장하지 않는다.
            throw error; // 2026-08 리포트 근거. 출석은 DO NOTHING.
        }
    }
} finally { // 2026-08 리포트 근거. 출석은 DO NOTHING.
    await client.end(); // 2026-08 리포트 근거. 출석은 DO NOTHING.
}
