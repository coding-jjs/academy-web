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

import pg from "pg";

const execute = process.argv.includes("--execute");
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("DIRECT_URL이 필요합니다.");
}

const url = new URL(connectionString);
const client = new pg.Client({ connectionString });

const resetTables = [
    "permission_grants",
    "parent_student_links",
    "class_enrollments",
    "attendance_records",
    "absence_requests",
    "learning_records",
    "wrong_note_images",
    "wrong_notes",
    "grade_records",
    "counseling_memos",
    "churn_signal_logs",
    "churn_cases",
    "push_deliveries",
    "message_recipients",
    "push_subscriptions",
    "messages",
    "payments",
    "invoices",
    "ai_reports",
    "class_sessions",
    "classes",
    "students",
    "news_items",
    "inquiries",
    "audit_logs",
];

await client.connect();

try {
    const before = await getSummary();

    console.log(
        JSON.stringify(
            {
                mode: execute ? "execute" : "preview",
                target: {
                    host: url.hostname,
                    port: url.port || "5432",
                    database: url.pathname.slice(1),
                },
                before,
                preserved: [
                    "DIRECTOR 역할의 users",
                    "해당 원장의 oauth_accounts",
                    "_prisma_migrations",
                    "기본 churn_threshold_configs",
                ],
            },
            null,
            2,
        ),
    );

    if (!execute) {
        console.log("미리보기만 완료했습니다. 삭제하려면 --execute를 추가하세요.");
        process.exitCode = 0;
    } else {
        await client.query("BEGIN");
        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext('academy_reset_keep_director'))",
        );

        const directors = await client.query(
            `SELECT id FROM users WHERE role = 'DIRECTOR' FOR UPDATE`,
        );

        if (directors.rowCount === 0) {
            throw new Error("보존할 DIRECTOR 계정이 없어 초기화를 중단합니다.");
        }

        await client.query(
            `TRUNCATE TABLE ${resetTables.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`,
        );
        await client.query(`DELETE FROM users WHERE role <> 'DIRECTOR'`);

        await client.query(
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
        `);
        await client.query("COMMIT");

        const after = await getSummary();
        console.log(JSON.stringify({ completed: true, after }, null, 2));
    }
} catch (error) {
    if (execute) {
        await client.query("ROLLBACK").catch(() => undefined);
    }
    throw error;
} finally {
    await client.end();
}

async function getSummary() {
    const result = await client.query(
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

    return result.rows[0];
}
