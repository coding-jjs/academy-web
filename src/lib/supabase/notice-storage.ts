import "server-only";

import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "notices";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

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

    // 버킷 안 경로. DB의 image_storage_key에 그대로 저장
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

export async function deleteNoticeImage(
    imageStorageKey: string | null | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!imageStorageKey) {
        return { ok: true }; // 이미지 없는 공지
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
