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

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"; // 로컬 기본. Prisma를 직접 열지 않는다.
const bootstrapSecret = process.env.BOOTSTRAP_SECRET; // API와 같은 secret. 빈 DB에 잘못된 원장을 심지 않게.
const email = process.argv[2]?.trim().toLowerCase(); // Google로 붙일 원장 이메일. User만 만들고 OAuth는 본인이.

if (!bootstrapSecret) { // secret·이메일이 없으면 POST하지 않는다.
    throw new Error("BOOTSTRAP_SECRET이 필요합니다."); // 공개 API가 아님. 시드 학생은 만들지 않는다.
}
if (!email) { // argv 없으면 사용법을 보여주고 중단.
    throw new Error("사용법: npm run bootstrap:director -- director@example.com"); // Google 이메일을 넣는다. @test.local은 move-director.
}

const response = await fetch(`${appUrl}/api/admin/bootstrap-director`, { // Prisma를 직접 열지 않는다. 앱과 같은 검증(이미 원장이 있으면 거부)을 탄다.
    method: "POST", // 쓰기. 이미 원장이 있으면 API가 거부.
    headers: { // secret은 헤더. 바디는 이메일만.
        "content-type": "application/json", // 이메일 JSON. 시드 학생은 만들지 않는다.
        "x-bootstrap-secret": bootstrapSecret, // 공개 API가 아님. 시드 학생은 만들지 않는다.
    },
    body: JSON.stringify({ email }), // Google로 붙일 이메일. OAuth는 본인이.
});

const result = await response.json(); // 성공이면 user.email. 실패면 API 메시지.

if (!response.ok) { // API 메시지를 그대로 올려 이미 원장이 있는 경우를 CLI에서 보게.
    throw new Error(JSON.stringify(result)); // 이미 원장이 있으면 거부. 추측해 덮지 않는다.
}

console.log(`DIRECTOR 설정 완료: ${result.user.email}`); // Google 로그인은 본인이. ENABLE_DEV_LOGIN은 move-director.
