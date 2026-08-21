import "server-only";

/**
 * Supabase service role 클라이언트.
 * 공지 이미지처럼 브라우저 RLS를 우회해야 하는 서버 업로드만 쓴다.
 *
 * 호출: `lib/supabase/notice-storage.ts`만. 페이지/클라이언트가 직접 import하지 않는다.
 *
 * 서버 전용 쓰기. anon 키가 아니라 service role이라 Storage RLS를 건너뛴다.
 * 세션을 persist하지 않는 이유: 요청마다 짧은 업로드이고, 서버에 유저 세션을 남길 일이 없다.
 *
 * 의도적으로 하지 않는 일:
 * - 로그인/회원 Auth를 Supabase에 두지 않는다 → NextAuth + Prisma User.
 * - 공지 본문은 여기 없다 → Prisma `newsItem`.
 * - 클라이언트 컴포넌트에서 쓰지 않는다. 키가 번들에 들어가면 버킷이 열린다.
 *
 * 관련: `notice-storage.ts`, env `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`.
 */

import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url) {
        throw new Error("URL이 설정되지 않았습니다.");
    }
    if (!serviceRoleKey) {
        throw new Error("권한이 설정되지 않았습니다.");
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

/** 모듈 로드 시 1회. 키 없으면 서버 기동이 실패한다 — 업로드 시점에 부분 실패하지 않게. */
export const supabaseAdmin = getSupabaseAdmin();
