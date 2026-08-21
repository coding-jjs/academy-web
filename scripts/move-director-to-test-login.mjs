/**
 * 원장 이메일을 `director@test.local` 개발 로그인으로 옮긴다.
 * Google 없이 로컬에서 원장 화면을 열기 위한 운영 보조.
 *
 * 실행: `npm run auth:director:test-login` (미리보기)
 *       `npm run auth:director:test-login -- --execute` (실제 UPDATE)
 *
 * 쓰기: DIRECT_URL로 Postgres에 직접 붙는다 (Prisma migrate와 같은 직접 연결).
 * OAuthAccount를 DELETE하는 이유: 이메일을 바꿔도 Google provider id가 옛 User에
 * 묶여 있으면 다음 Google 로그인이 충돌한다. 개발 로그인은 Credentials라 OAuth가 필요 없다.
 *
 * 의도적으로 하지 않는 일:
 * - User를 새로 만들지 않는다. 기존 DIRECTOR 한 명의 이메일만 바꾼다.
 * - 원장이 0명/2명이면 중단 — 어느 행을 옮길지 추측하지 않는다.
 * - 프로덕션에서 돌리지 말 것. @test.local은 ENABLE_DEV_LOGIN 전제.
 *
 * 관련: `dev-login.ts`, `bootstrap-director.mjs`.
 */

import pg from "pg";

const execute = process.argv.includes("--execute");
const connectionString = process.env.DIRECT_URL;
const testEmail = "director@test.local";

if (!connectionString) {
    throw new Error("DIRECT_URL이 필요합니다.");
}

const url = new URL(connectionString);
const client = new pg.Client({ connectionString });

await client.connect();

try {
    const directorResult = await client.query(
        /* 원장 1명+OAuth 건수. 0/2명이면 추측하지 않는다. */ `SELECT
            u.id,
            u.email,
            u.name,
            u.status,
            COUNT(o.id)::int AS oauth_links,
            array_remove(array_agg(DISTINCT o.provider), NULL) AS providers
         FROM users u
         LEFT JOIN oauth_accounts o ON o.user_id = u.id
         WHERE u.role = 'DIRECTOR'
         GROUP BY u.id, u.email, u.name, u.status, u.created_at
         ORDER BY u.created_at ASC`,
    );

    if (directorResult.rowCount !== 1) {
        throw new Error(
            `원장 계정이 정확히 1개여야 합니다. 현재 ${directorResult.rowCount}개입니다.`,
        );
    }

    const director = directorResult.rows[0];

    const targetResult = await client.query(
        `SELECT id FROM users WHERE email = $1 AND id <> $2`,
        [testEmail, director.id],
    );

    if (targetResult.rowCount > 0) {
        throw new Error(`${testEmail} 이메일을 다른 사용자가 사용 중입니다.`);
    }

    console.log(
        JSON.stringify(
            {
                mode: execute ? "execute" : "preview",
                target: {
                    host: url.hostname,
                    port: url.port || "5432",
                    database: url.pathname.slice(1),
                },
                director: {
                    id: director.id,
                    name: director.name,
                    currentEmail: maskEmail(director.email),
                    nextEmail: testEmail,
                    oauthLinksToRemove: director.oauth_links,
                    providers: director.providers,
                },
            },
            null,
            2,
        ),
    );

    if (!execute) {
        console.log("미리보기만 완료했습니다. 이전하려면 --execute를 추가하세요.");
        process.exitCode = 0;
    } else {
        await client.query("BEGIN");
        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext('academy_director_test_login'))",
        );

        const deletedAccounts = await client.query(
            `DELETE FROM oauth_accounts WHERE user_id = $1`,
            [director.id],
        );

        await client.query(
            /* 이메일을 director@test.local로. 역할은 DIRECTOR 유지. */ `UPDATE users
             SET email = $1,
                 image_url = NULL,
                 email_verified_at = COALESCE(email_verified_at, now()),
                 onboarding_complete_at = COALESCE(onboarding_complete_at, now()),
                 updated_at = now()
             WHERE id = $2 AND role = 'DIRECTOR'`,
            [testEmail, director.id],
        );
        await client.query(
            /* 시드 조치 audit. 페이지 뷰는 안 남긴다. */ `INSERT INTO audit_logs
                (actor_user_id, action, target_type, target_id, details)
             VALUES ($1, 'DIRECTOR_MOVED_TO_TEST_LOGIN', 'USER', $1, $2::jsonb)`,
            [
                director.id,
                JSON.stringify({
                    nextEmail: testEmail,
                    removedOAuthLinks: deletedAccounts.rowCount,
                    removedProviders: director.providers,
                }),
            ],
        );

        await client.query("COMMIT");

        const verification = await client.query(
            /* 원장 1명+OAuth 건수. 0/2명이면 추측하지 않는다. */ `SELECT
                u.email,
                u.name,
                u.role,
                u.status,
                COUNT(o.id)::int AS oauth_links
             FROM users u
             LEFT JOIN oauth_accounts o ON o.user_id = u.id
             WHERE u.id = $1
             GROUP BY u.id`,
            [director.id],
        );
        console.log(
            JSON.stringify(
                { completed: true, verified: verification.rows[0] },
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

/** 미리보기 로그에 로컬 파트 앞 2글자만. execute 전에도 콘솔에 원문이 안 나가게. */
function maskEmail(email) {
    const [local, domain] = String(email).split("@");
    if (!domain) return "***";
    return `${local.slice(0, 2)}***@${domain}`;
}
