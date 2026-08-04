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
