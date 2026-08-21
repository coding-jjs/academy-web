/**
 * Next.js 빌드 설정.
 * `output: "standalone"`으로 컨테이너/서버에서 `.next/standalone`만 복사해 실행한다
 * (node_modules 전체를 이미지에 넣지 않기 위함).
 *
 * 호출: `next build` / `next dev`. 앱 런타임 코드는 이 파일을 import하지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 이미지 원격 호스트 화이트리스트를 여기 늘리지 않는다. 공지 이미지는 Supabase 공개 URL.
 * - rewrite/redirect로 역할 URL을 바꾸지 않는다 → `proxy.ts`.
 * - env를 여기서 주입하지 않는다 → `.env.local`.
 *
 * 관련: `src/proxy.ts` (요청 가드), Docker 배포 산출물.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
};

export default nextConfig;
