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

import pg from "pg"; // 원장 이메일을 director@test.local로. OAuth 삭제.

const execute = process.argv.includes("--execute"); // 플래그 없으면 SELECT만. 실수로 npm run이 이메일을 바꿔 Google 로그인을 끊지 않게 한다.
const connectionString = process.env.DIRECT_URL; // migrate와 같은 직접 연결. 풀링 URL이 아님.
const testEmail = "director@test.local"; // parseDevTestEmail이 받는 도메인. ENABLE_DEV_LOGIN 전제.

if (!connectionString) { // 원장 이메일을 director@test.local로. OAuth 삭제.
    throw new Error("DIRECT_URL이 필요합니다."); // 원장 이메일을 director@test.local로. OAuth 삭제.
}

const url = new URL(connectionString); // 원장 이메일을 director@test.local로. OAuth 삭제.
const client = new pg.Client({ connectionString }); // 원장 이메일을 director@test.local로. OAuth 삭제.

await client.connect(); // 원장 이메일을 director@test.local로. OAuth 삭제.

try { // 원장 이메일을 director@test.local로. OAuth 삭제.
    const directorResult = await client.query( // 원장이 정확히 1명인지. 0/2명이면 어느 이메일을 개발용으로 쓸지 추측하지 않는다.
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

    if (directorResult.rowCount !== 1) { // 원장 이메일을 director@test.local로. OAuth 삭제.
        throw new Error( // 원장 이메일을 director@test.local로. OAuth 삭제.
            `원장 계정이 정확히 1개여야 합니다. 현재 ${directorResult.rowCount}개입니다.`, // 원장 이메일을 director@test.local로. OAuth 삭제.
        );
    }

    const director = directorResult.rows[0]; // 원장 이메일을 director@test.local로. OAuth 삭제.

    const targetResult = await client.query( // director@test.local을 다른 User가 쓰면 이메일을 덮지 않는다.
        `SELECT id FROM users WHERE email = $1 AND id <> $2`, // 원장 이메일을 director@test.local로. OAuth 삭제.
        [testEmail, director.id], // 원장 이메일을 director@test.local로. OAuth 삭제.
    );

    if (targetResult.rowCount > 0) { // 원장 이메일을 director@test.local로. OAuth 삭제.
        throw new Error(`${testEmail} 이메일을 다른 사용자가 사용 중입니다.`); // 원장 이메일을 director@test.local로. OAuth 삭제.
    }

    console.log( // execute 전에도 콘솔에 이메일 원문이 안 나가게 mask.
        JSON.stringify( // 원장 이메일을 director@test.local로. OAuth 삭제.
            { // 원장 이메일을 director@test.local로. OAuth 삭제.
                mode: execute ? "execute" : "preview", // 원장 이메일을 director@test.local로. OAuth 삭제.
                target: { // 원장 이메일을 director@test.local로. OAuth 삭제.
                    host: url.hostname, // 원장 이메일을 director@test.local로. OAuth 삭제.
                    port: url.port || "5432", // 원장 이메일을 director@test.local로. OAuth 삭제.
                    database: url.pathname.slice(1), // 원장 이메일을 director@test.local로. OAuth 삭제.
                },
                director: { // 원장 이메일을 director@test.local로. OAuth 삭제.
                    id: director.id, // 원장 이메일을 director@test.local로. OAuth 삭제.
                    name: director.name, // 원장 이메일을 director@test.local로. OAuth 삭제.
                    currentEmail: maskEmail(director.email), // 원장 이메일을 director@test.local로. OAuth 삭제.
                    nextEmail: testEmail, // 원장 이메일을 director@test.local로. OAuth 삭제.
                    oauthLinksToRemove: director.oauth_links, // Google provider id가 남으면 다음 Google 로그인이 충돌한다.
                    providers: director.providers, // 원장 이메일을 director@test.local로. OAuth 삭제.
                },
            },
            null, // 원장 이메일을 director@test.local로. OAuth 삭제.
            2, // 원장 이메일을 director@test.local로. OAuth 삭제.
        ),
    );

    if (!execute) { // 원장 이메일을 director@test.local로. OAuth 삭제.
        console.log("미리보기만 완료했습니다. 이전하려면 --execute를 추가하세요."); // 원장 이메일을 director@test.local로. OAuth 삭제.
        process.exitCode = 0; // 원장 이메일을 director@test.local로. OAuth 삭제.
    } else { // 원장 이메일을 director@test.local로. OAuth 삭제.
        await client.query("BEGIN"); // 재실행이 겹치지 않게 advisory lock. OAuth 삭제와 이메일 변경을 한 커밋.
        await client.query( // 원장 이메일을 director@test.local로. OAuth 삭제.
            "SELECT pg_advisory_xact_lock(hashtext('academy_director_test_login'))", // 원장 이메일을 director@test.local로. OAuth 삭제.
        );

        const deletedAccounts = await client.query( // Google provider id가 옛 User에 남으면 다음 Google 로그인이 충돌한다.
            `DELETE FROM oauth_accounts WHERE user_id = $1`, // 원장 이메일을 director@test.local로. OAuth 삭제.
            [director.id], // 원장 이메일을 director@test.local로. OAuth 삭제.
        );

        await client.query( // 이메일을 @test.local로. 사진·온보딩을 지금 찍어 /signup으로 떨어지지 않게.
            /* 이메일을 director@test.local로. 역할은 DIRECTOR 유지. */ `UPDATE users
             SET email = $1,
                 image_url = NULL,
                 email_verified_at = COALESCE(email_verified_at, now()),
                 onboarding_complete_at = COALESCE(onboarding_complete_at, now()),
                 updated_at = now()
             WHERE id = $2 AND role = 'DIRECTOR'`,
            [testEmail, director.id], // 원장 이메일을 director@test.local로. OAuth 삭제.
        );
        await client.query( // 원장 이메일을 director@test.local로. OAuth 삭제.
            /* 시드 조치 audit. 페이지 뷰는 안 남긴다. */ `INSERT INTO audit_logs
                (actor_user_id, action, target_type, target_id, details)
             VALUES ($1, 'DIRECTOR_MOVED_TO_TEST_LOGIN', 'USER', $1, $2::jsonb)`,
            [ // 원장 이메일을 director@test.local로. OAuth 삭제.
                director.id, // 원장 이메일을 director@test.local로. OAuth 삭제.
                JSON.stringify({ // 원장 이메일을 director@test.local로. OAuth 삭제.
                    nextEmail: testEmail, // 원장 이메일을 director@test.local로. OAuth 삭제.
                    removedOAuthLinks: deletedAccounts.rowCount, // 원장 이메일을 director@test.local로. OAuth 삭제.
                    removedProviders: director.providers, // 원장 이메일을 director@test.local로. OAuth 삭제.
                }),
            ], // 원장 이메일을 director@test.local로. OAuth 삭제.
        );

        await client.query("COMMIT"); // 원장 이메일을 director@test.local로. OAuth 삭제.

        const verification = await client.query( // 이메일이 바뀌고 OAuth가 0인지.
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
            [director.id], // 원장 이메일을 director@test.local로. OAuth 삭제.
        );
        console.log( // 원장 이메일을 director@test.local로. OAuth 삭제.
            JSON.stringify( // 원장 이메일을 director@test.local로. OAuth 삭제.
                { completed: true, verified: verification.rows[0] }, // 블록 끝. 원장 이메일을 director@test.local로. OAuth 삭제.
                null, // 원장 이메일을 director@test.local로. OAuth 삭제.
                2, // 원장 이메일을 director@test.local로. OAuth 삭제.
            ),
        );
    }
} catch (error) { // 원장 이메일을 director@test.local로. OAuth 삭제.
    if (execute) { // execute 중에만. preview는 쓰기가 없어서 ROLLBACK할 것이 없다.
        await client.query("ROLLBACK").catch(() => undefined); // 원장 이메일을 director@test.local로. OAuth 삭제.
    }
    throw error; // 원장 이메일을 director@test.local로. OAuth 삭제.
} finally { // 원장 이메일을 director@test.local로. OAuth 삭제.
    await client.end(); // 원장 이메일을 director@test.local로. OAuth 삭제.
}

/** 미리보기 로그에 로컬 파트 앞 2글자만. execute 전에도 콘솔에 원문이 안 나가게. */
function maskEmail(email) { // 원장 이메일을 director@test.local로. OAuth 삭제.
    const [local, domain] = String(email).split("@"); // 원장 이메일을 director@test.local로. OAuth 삭제.
    if (!domain) return "***"; // @가 없으면 마스킹할 도메인이 없다.
    return `${local.slice(0, 2)}***@${domain}`; // 원장 이메일을 director@test.local로. OAuth 삭제.
}
