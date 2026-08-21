/**
 * 첫 원장 계정을 만드는 운영 스크립트.
 * `BOOTSTRAP_SECRET`으로 `/api/admin/bootstrap-director`를 호출해 빈 DB에 DIRECTOR를 심는다.
 *
 * 실행: `npm run bootstrap:director -- director@example.com`
 * (package.json이 `.env.local`을 읽는다.)
 *
 * 쓰기는 이 파일이 SQL을 직접 하지 않는다 — HTTP API가 User를 만든다.
 * CLI에서 Prisma를 안 여는 이유: 앱과 같은 검증(이미 원장이 있으면 거부)을 타기 위함.
 *
 * 의도적으로 하지 않는 일:
 * - Google OAuth를 대신 로그인시키지 않는다. 이메일만 넣고, 본인이 Google로 붙인다.
 * - `--execute` 미리보기가 없다. secret+이메일이 있으면 바로 POST.
 * - 시드 학생/반은 만들지 않는다 → `seed-test-data.mjs`.
 *
 * 관련: `app/api/admin/bootstrap-director/route.ts`, `move-director-to-test-login.mjs`.
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
const email = process.argv[2]?.trim().toLowerCase();

if (!bootstrapSecret) {
    throw new Error("BOOTSTRAP_SECRET이 필요합니다.");
}
if (!email) {
    throw new Error("사용법: npm run bootstrap:director -- director@example.com");
}

const response = await fetch(`${appUrl}/api/admin/bootstrap-director`, {
    method: "POST",
    headers: {
        "content-type": "application/json",
        "x-bootstrap-secret": bootstrapSecret,
    },
    body: JSON.stringify({ email }),
});

const result = await response.json();

if (!response.ok) {
    throw new Error(JSON.stringify(result));
}

console.log(`DIRECTOR 설정 완료: ${result.user.email}`);
