import "server-only";

/**
 * 공지 이미지 업로드/삭제.
 * jpeg/png/webp 5MB, `notices` 버킷 — 본문은 DB, 파일은 스토리지에 둔다.
 *
 * 호출: `features/notices/actions.ts` (원장 공지 작성·수정·삭제).
 * 서버 전용 쓰기. service role로 RLS를 우회한다. 공개 URL만 클라이언트에 내려 준다.
 *
 * 의도적으로 하지 않는 일:
 * - 본문 HTML/마크다운을 여기 두지 않는다 → Prisma.
 * - upsert:false — 같은 UUID 키를 덮어쓰지 않는다. 수정은 새 키 업로드 후 옛 키 삭제.
 * - 이미지가 없는 공지 삭제는 성공으로 본다 (스토리지 miss를 에러로 안 띄움).
 *
 * 관련: `supabase/admin.ts`, `features/notices/actions.ts`.
 */

import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "notices";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** 5MB. 공지 배너용. 더 큰 원본은 거절해 버킷·트래픽을 막는다. */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** 성공이면 공개 URL+스토리지 키(DB `image_storage_key`). 실패는 throw 없이 메시지. */
export type NoticeImageUploadResult =
    | { ok: true; imageUrl: string; imageStorageKey: string }
    | { ok: false; message: string };

function extensionForMime(mimeType: string) {
    switch (mimeType) {
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        default:
            return null;
    }
}

/**
 * 공지 이미지를 올리고 공개 URL을 돌려준다.
 * MIME을 확장자보다 먼저 본다 — 확장자만 바꾸면 통과시키는 것을 막기 위함.
 * 키는 UUID라 원본 파일명을 버킷에 남기지 않는다.
 */
export async function uploadNoticeImage(
    file: File,
): Promise<NoticeImageUploadResult> {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return {
            ok: false,
            message: "jpg, png, webp 이미지만 업로드할 수 있습니다.",
        };
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        return {
            ok: false,
            message: "이미지 크기는 5MB 이하로 올려 주세요.",
        };
    }

    const ext = extensionForMime(file.type);
    if (!ext) {
        return { ok: false, message: "지원하지 않는 이미지 형식입니다." };
    }

    const imageStorageKey = `${randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(imageStorageKey, bytes, {
            contentType: file.type,
            upsert: false,
        });

    if (error) {
        return {
            ok: false,
            message: `이미지 업로드에 실패했습니다. (${error.message})`,
        };
    }

    const { data } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(imageStorageKey);

    return {
        ok: true,
        imageUrl: data.publicUrl,
        imageStorageKey,
    };
}

/**
 * 스토리지 객체만 지운다. DB 행은 호출부가 지운다.
 * 키가 없으면 ok — 이미지 없는 공지 삭제와 같은 코드 경로를 쓰기 위함.
 */
export async function deleteNoticeImage(
    imageStorageKey: string | null | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!imageStorageKey) {
        return { ok: true };
    }

    const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([imageStorageKey]);

    if (error) {
        return {
            ok: false,
            message: `이미지 삭제에 실패했습니다. (${error.message})`,
        };
    }

    return { ok: true };
}
