/**
 * DIRECTOR만 남기고 업무 테이블을 비운다.
 * 시드를 다시 넣기 전에 사람·반·청구를 지워 로컬 DB를 원장 한 명 상태로 되돌린다.
 *
 * 실행: `npm run db:reset:keep-director` (미리보기)
 *       `npm run db:reset:keep-director -- --execute` (TRUNCATE)
 *
 * 쓰기: DIRECT_URL. `--execute`가 없으면 COUNT만 찍고 종료.
 * users는 TRUNCATE하지 않고 `role <> DIRECTOR` DELETE — 원장 OAuth·id를 유지하려고.
 * 수강/출석 등은 TRUNCATE CASCADE. 행을 남기지 않는 이유: 시드 UUID와 충돌하지 않게.
 *
 * 의도적으로 하지 않는 일:
 * - `_prisma_migrations`는 지우지 않는다. 스키마를 되돌리지 않음.
 * - DIRECTOR User / 그 OAuth는 보존. 다음 로그인이 원장 부트스트랩을 다시 요구하지 않게.
 * - churn_threshold_configs는 truncate 목록에 없고, id=1을 15/10/2/3으로 upsert한다.
 *
 * 관련: `seed-test-data.mjs`, `churn-detect.ts`.
 */

import pg from "pg"; // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.

const execute = process.argv.includes("--execute"); // 없으면 COUNT만. 실수로 TRUNCATE하지 않게.
const connectionString = process.env.DIRECT_URL; // migrate와 같은 직접 연결. 풀링 URL로 TRUNCATE하면 advisory lock이 실패할 수 있다.

if (!connectionString) { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    throw new Error("DIRECT_URL이 필요합니다."); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
}

const url = new URL(connectionString); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
const client = new pg.Client({ connectionString }); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.

const resetTables = [ // FK 자식부터. TRUNCATE CASCADE라 순서는 안전망이고, 목록에 없는 users는 아래에서 DELETE.
    "permission_grants", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "parent_student_links", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "class_enrollments", // CANCELLED 이력도 지운다. 시드 UUID와 충돌하지 않게.
    "attendance_records", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "absence_requests", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "learning_records", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "wrong_note_images", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "wrong_notes", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "grade_records", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "counseling_memos", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "churn_signal_logs", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "churn_cases", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "push_deliveries", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "message_recipients", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "push_subscriptions", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "messages", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "payments", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "invoices", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "ai_reports", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "class_sessions", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "classes", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "students", // Student 행 DELETE. 원장 User는 남긴다.
    "news_items", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "inquiries", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    "audit_logs", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
]; // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.

await client.connect(); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.

try { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    const before = await getSummary(); // 지우기 전 건수. execute 없어도 COUNT만 찍고 종료할 수 있게.

    console.log( // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        JSON.stringify( // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
            { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                mode: execute ? "execute" : "preview", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                target: { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                    host: url.hostname, // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                    port: url.port || "5432", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                    database: url.pathname.slice(1), // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                },
                before, // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                preserved: [ // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                    "DIRECTOR 역할의 users", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                    "해당 원장의 oauth_accounts", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                    "_prisma_migrations", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                    "기본 churn_threshold_configs", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
                ], // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
            },
            null, // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
            2, // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        ),
    );

    if (!execute) { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        console.log("미리보기만 완료했습니다. 삭제하려면 --execute를 추가하세요."); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        process.exitCode = 0; // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    } else { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        await client.query("BEGIN"); // 같은 스크립트 재실행이 겹치지 않게 lock.
        await client.query( // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
            "SELECT pg_advisory_xact_lock(hashtext('academy_reset_keep_director'))", // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        );

        const directors = await client.query( // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
            `SELECT id FROM users WHERE role = 'DIRECTOR' FOR UPDATE`, // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        );

        if (directors.rowCount === 0) { // 원장이 없으면 전부 지워 빈 DB가 된다. 부트스트랩을 다시 해야 해서 중단.
            throw new Error("보존할 DIRECTOR 계정이 없어 초기화를 중단합니다."); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        }

        await client.query( // 업무 테이블 TRUNCATE. users는 원장만 남기고 DELETE — OAuth·id를 유지.
            `TRUNCATE TABLE ${resetTables.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`, // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        );
        await client.query(`DELETE FROM users WHERE role <> 'DIRECTOR'`); // TEACHER/STAFF/PARENT/STUDENT/GUEST. 원장 행은 유지.

        await client.query( // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        /* id=1 임계 15/10/2/3. detectChurnCases가 이 행만 읽는다. */ `
            INSERT INTO churn_threshold_configs (
                id,
                attendance_drop_percent_point,
                score_drop_points,
                consecutive_absences,
                unpaid_days,
                updated_by,
                updated_at
            ) VALUES (1, 15, 10, 2, 3, NULL, NOW())
            ON CONFLICT (id) DO UPDATE SET
                attendance_drop_percent_point = EXCLUDED.attendance_drop_percent_point,
                score_drop_points = EXCLUDED.score_drop_points,
                consecutive_absences = EXCLUDED.consecutive_absences,
                unpaid_days = EXCLUDED.unpaid_days,
                updated_by = NULL,
                updated_at = NOW()
        `); // detectChurnCases가 id=1만 읽는다. 원장이 바꾼 값도 시드 기본으로 되돌린다.
        await client.query("COMMIT"); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.

        const after = await getSummary(); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
        console.log(JSON.stringify({ completed: true, after }, null, 2)); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    }
} catch (error) { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    if (execute) { // execute 중에만. preview는 COUNT만 해서 되돌릴 쓰기가 없다.
        await client.query("ROLLBACK").catch(() => undefined); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    }
    throw error; // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
} finally { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    await client.end(); // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
}

async function getSummary() { // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
    const result = await client.query( // 지울 수 있는 비원장 수와 보존되는 원장 OAuth만 보여 준다.
        /* 원장 1명+OAuth 건수. 0/2명이면 추측하지 않는다. */ `
        SELECT
            COUNT(*)::int AS total_users,
            COUNT(*) FILTER (WHERE role = 'DIRECTOR')::int AS directors,
            COUNT(*) FILTER (WHERE role <> 'DIRECTOR')::int AS removable_users,
            (
                SELECT COUNT(*)::int
                FROM oauth_accounts AS account
                JOIN users AS app_user ON app_user.id = account.user_id
                WHERE app_user.role = 'DIRECTOR'
            ) AS director_oauth_accounts,
            (SELECT COUNT(*)::int FROM students) AS students,
            (SELECT COUNT(*)::int FROM classes) AS classes,
            (SELECT COUNT(*)::int FROM messages) AS messages,
            (SELECT COUNT(*)::int FROM invoices) AS invoices,
            (SELECT COUNT(*)::int FROM inquiries) AS inquiries
        FROM users
    `);

    return result.rows[0]; // DIRECTOR만 남기고 TRUNCATE. 마이그레이션은 유지.
}
