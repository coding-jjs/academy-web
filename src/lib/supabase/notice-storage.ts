import "server-only"; // 클라이언트에 service role이 들어가면 버킷이 열린다.

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

import { randomUUID } from "crypto"; // 키는 UUID. 원본 파일명을 버킷에 남기지 않는다.
import { supabaseAdmin } from "@/lib/supabase/admin"; // service role. 페이지가 직접 import하지 않는다.

const BUCKET = "notices"; // 공지 배너. 본문은 Prisma newsItem.

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]); // 확장자만 바꿔 통과시키는 것을 막는다.

/** 5MB. 공지 배너용. 더 큰 원본은 거절해 버킷·트래픽을 막는다. */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 0바이트·초과는 거절. 버킷·트래픽을 막는다.

/** 성공이면 공개 URL+스토리지 키(DB `image_storage_key`). 실패는 throw 없이 메시지. */
export type NoticeImageUploadResult = // 공지 이미지. 본문은 Prisma.
    | { ok: true; imageUrl: string; imageStorageKey: string } // 공개 URL만 클라이언트. 키는 이후 삭제용.
    | { ok: false; message: string }; // throw 없이. 호출부가 본문 저장을 건너뛸 수 있게.

function extensionForMime(mimeType: string) { // MIME → 확장자. 허용 목록에 없어도 여기서 null이면 거절.
    switch (mimeType) { // MIME → 확장자. 허용 목록에 없어도 여기서 null이면 업로드를 거절한다.
        case "image/jpeg": // jpeg. 확장자만 바꾼 파일은 위에서 MIME으로 이미 거절.
            return "jpg"; // UUID.jpg. 원본 파일명을 남기지 않는다.
        case "image/png": // png.
            return "png"; // UUID.png.
        case "image/webp": // webp.
            return "webp"; // UUID.webp.
        default: // 허용 목록과 스위치가 어긋나면 업로드를 막는다.
            return null; // 허용 목록과 스위치가 어긋나면 업로드를 막는다.
    }
}

/**
 * 공지 이미지를 올리고 공개 URL을 돌려준다.
 * MIME을 확장자보다 먼저 본다 — 확장자만 바꾸면 통과시키는 것을 막기 위함.
 * 키는 UUID라 원본 파일명을 버킷에 남기지 않는다.
 */
export async function uploadNoticeImage( // 공지 이미지. 본문은 Prisma.
    file: File, // 원장 공지 작성·수정. 본문은 Prisma.
): Promise<NoticeImageUploadResult> { // throw 없이 메시지. 호출부가 본문 저장을 건너뛸 수 있게.
    if (!ALLOWED_MIME_TYPES.has(file.type)) { // 확장자가 아니라 MIME. 확장자만 바꿔 통과시키는 것을 막는다.
        return { // 업로드하지 않는다. 본문 저장은 호출부가 건너뛴다.
            ok: false, // 필드 에러가 아니라 업로드 거절.
            message: "jpg, png, webp 이미지만 업로드할 수 있습니다.", // 확장자만 바꾼 파일도 MIME에서 걸린다.
        };
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) { // 0바이트·5MB 초과는 버킷·트래픽을 막기 위해 거절.
        return { // 업로드하지 않는다.
            ok: false, // 크기 거절.
            message: "이미지 크기는 5MB 이하로 올려 주세요.", // 더 큰 원본은 거절.
        };
    }

    const ext = extensionForMime(file.type); // MIME → 확장자. 허용 목록과 스위치가 어긋나면 여기서 막는다.
    if (!ext) { // 허용 목록과 스위치가 어긋남.
        return { ok: false, message: "지원하지 않는 이미지 형식입니다." }; // 업로드 거절.
    }

    const imageStorageKey = `${randomUUID()}.${ext}`; // UUID라 원본 파일명을 버킷에 남기지 않는다. DB image_storage_key에 그대로 저장.
    const bytes = new Uint8Array(await file.arrayBuffer()); // 서버에서 올린다. 브라우저 RLS를 우회.

    const { error } = await supabaseAdmin.storage // service role. anon으로 올리지 않는다.
        .from(BUCKET) // notices. 본문은 Prisma.
        .upload(imageStorageKey, bytes, { // 같은 UUID를 덮어쓰지 않는다.
            contentType: file.type, // MIME 그대로. 확장자만 맞추지 않는다.
            upsert: false, // 같은 UUID 키를 덮어쓰지 않는다. 수정은 새 키 후 옛 키 삭제.
        });

    if (error) { // throw 없이 메시지. 호출부가 공지 본문 저장을 건너뛸 수 있게.
        return { // 본문을 부분 저장하지 않게 호출부가 고른다.
            ok: false, // 스토리지 실패.
            message: `이미지 업로드에 실패했습니다. (${error.message})`, // 시크릿은 넣지 않는다.
        };
    }

    const { data } = supabaseAdmin.storage // 공개 URL만 클라이언트에.
        .from(BUCKET) // notices.
        .getPublicUrl(imageStorageKey); // 공개 URL만 클라이언트에. 키는 이후 삭제용.

    return { // 성공. DB image_storage_key에 키를 저장.
        ok: true, // 공개 URL+키.
        imageUrl: data.publicUrl, // 클라이언트에 내릴 URL.
        imageStorageKey, // 수정 시 옛 키 삭제용.
    };
}

/**
 * 스토리지 객체만 지운다. DB 행은 호출부가 지운다.
 * 키가 없으면 ok — 이미지 없는 공지 삭제와 같은 코드 경로를 쓰기 위함.
 */
export async function deleteNoticeImage( // 공지 이미지. 본문은 Prisma.
    imageStorageKey: string | null | undefined, // 없으면 성공. 이미지 없는 공지도 같은 삭제 경로.
): Promise<{ ok: true } | { ok: false; message: string }> { // 스토리지만. DB 행은 호출부.
    if (!imageStorageKey) { // 이미지 없는 공지도 같은 삭제 경로를 쓰게 성공으로 본다.
        return { ok: true }; // miss를 에러로 안 띄움.
    }

    const { error } = await supabaseAdmin.storage // service role.
        .from(BUCKET) // notices.
        .remove([imageStorageKey]); // 스토리지 객체만 지운다. DB 행은 호출부가 지운다.

    if (error) { // miss를 화면 에러로 띄우지 않고 메시지만. 호출부가 공지 삭제를 멈출지 고른다.
        return { // 본문 삭제를 호출부가 고른다.
            ok: false, // 스토리지 삭제 실패.
            message: `이미지 삭제에 실패했습니다. (${error.message})`, // 시크릿은 넣지 않는다.
        };
    }

    return { ok: true }; // 스토리지 삭제 성공. DB는 호출부.
}
