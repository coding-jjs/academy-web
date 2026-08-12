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
        `SELECT
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
            `UPDATE users
             SET email = $1,
                 image_url = NULL,
                 email_verified_at = COALESCE(email_verified_at, now()),
                 onboarding_complete_at = COALESCE(onboarding_complete_at, now()),
                 updated_at = now()
             WHERE id = $2 AND role = 'DIRECTOR'`,
            [testEmail, director.id],
        );
        await client.query(
            `INSERT INTO audit_logs
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
            `SELECT
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

function maskEmail(email) {
    const [local, domain] = String(email).split("@");
    if (!domain) return "***";
    return `${local.slice(0, 2)}***@${domain}`;
}
