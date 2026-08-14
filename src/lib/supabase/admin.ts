import "server-only";

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

export const supabaseAdmin = getSupabaseAdmin();
