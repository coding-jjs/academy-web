"use server"; // Server Action. 브라우저가 직접 Prisma를 치지 않는다.

/**
 * 원장 전용 공개 공지 CRUD. NewsItem(kind=NOTICE)로 저장한다.
 *
 * 호출: `NoticesScreen`이 작성·수정·삭제 시 직접 호출한다.
 * 이미지는 `@/lib/supabase/notice-storage`에 올린다 — jpeg/png/webp, 5MB, 버킷 `notices`.
 * 교체·삭제 시 이전 스토리지 키를 지워 고아 파일을 남기지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 피드 뉴스 → `news/data.ts` (kind·audience·기간 필터).
 * - 직원이 공지를 쓰게 하지 않음. DIRECTOR만.
 *
 * 관련: `data.ts`, `NoticesScreen.tsx`, `@/lib/supabase/notice-storage`.
 */

import { revalidatePath } from "next/cache"; // 화면 캐시. 역할 경로만.
import { auth } from "@/lib/auth"; // JWT 세션. 폼에서 userId를 받지 않는다.
import { prisma } from "@/lib/db"; // server-only Prisma. 브라우저가 직접 치지 않는다.
import { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    NOTICE_AUDIENCE_LABELS, // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    formatNoticeListDate, // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    type Notice, // Notice 타입. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
} from "@/features/notices/types"; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
import { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    deleteNoticeImage, // 버킷 notices 파일. 실패해도 DB 삭제는 유지.
    uploadNoticeImage, // jpeg/png/webp 5MB, 버킷 notices.
} from "@/lib/supabase/notice-storage"; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.

/** 작성·수정 결과. 성공 시 화면이 목록에 바로 꽂을 Notice DTO를 받는다. */
export type NoticeActionResult = // NoticeActionResult 타입. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    | { ok: true; notice: Notice } // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    | { ok: false; message: string }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.

/** 삭제 결과. 스토리지 실패여도 ok:true일 수 있다 — DB 행은 이미 없다. */
export type DeleteNoticeResult = { ok: true } | { ok: false; message: string }; // DeleteNoticeResult 타입. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.

type NoticeRow = { // NoticeRow 타입. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    id: string; // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    audience: string; // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    title: string; // 제목. 서버가 길이를 다시 본다.
    content: string | null; // 쪽지 본문. PENDING은 인박스에 안 나간다.
    imageUrl: string | null; // 버킷 notices 공개 URL.
    createdAt: Date; // createdAt. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
};

const noticeSelect = { // noticeSelect. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    id: true, // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    audience: true, // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
    title: true, // 제목. 서버가 길이를 다시 본다.
    content: true, // 쪽지 본문. PENDING은 인박스에 안 나간다.
    imageUrl: true, // 버킷 notices 공개 URL.
    createdAt: true, // createdAt. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
} as const; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.

function revalidateNoticePaths() { // revalidateNoticePaths. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    revalidatePath("/notices"); // 로그인 없이 공개 목록.
    revalidatePath("/"); // 홈 미리보기 바. 같은 kind=NOTICE 목록.
}

function mapNotice(row: NoticeRow): Notice { // mapNotice. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    return { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        id: row.id, // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        audience: NOTICE_AUDIENCE_LABELS[row.audience] ?? "전체", // 직원은 PARENT/STUDENT만. ALL/STAFF는 원장.
        title: row.title, // 제목. 서버가 길이를 다시 본다.
        date: formatNoticeListDate(row.createdAt), // date. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        body: row.content?.trim() || "", // 작성 직후 DTO. 공개 목록 map은 공백이면 "내용이 없습니다."
        imageUrl: row.imageUrl, // 버킷 notices 공개 URL.
    };
}

async function requireDirector() { // requireDirector. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    const session = await auth(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session?.user?.id || session.user.role !== "DIRECTOR") { // 원장 가드. 직원 권한 키를 보지 않는다.
        return null; // 직원이 공지를 쓰게 하지 않는다.
    }
    return session; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
}

function validateNoticeContent(titleRaw: string, bodyRaw: string) { // validateNoticeContent. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    const title = titleRaw.trim(); // 제목. 서버가 길이를 다시 본다.
    const body = bodyRaw.trim(); // 앞뒤 공백만인 제목/본문을 거절한다.

    if (!title) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false as const, message: "제목을 입력해 주세요." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }
    if (title.length > 80) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            ok: false as const, // ok. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            message: "제목은 80자 이내로 입력해 주세요.", // 카드 한 줄에 맞게.
        };
    }
    if (!body) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false as const, message: "본문을 입력해 주세요." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }
    if (body.length > 5000) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            ok: false as const, // ok. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            message: "본문은 5000자 이내로 입력해 주세요.", // message. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        };
    }

    return { ok: true as const, title, body }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
}

/**
 * 공개 공지를 만든다. kind=NOTICE, audience=ALL, published=true로 고정한다.
 * 이미지 MIME/용량 검사는 uploadNoticeImage(jpeg/png/webp, 5MB, 버킷 notices)가 한다.
 */
export async function createNotice(input: { // createNotice. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    title: string; // 제목. 서버가 길이를 다시 본다.
    body: string; // 본문. 공개 목록 공백 문구와 작성 DTO를 나눈다.
    image?: File | null; // jpeg/png/webp. 5MB는 서버 버킷 notices.
}): Promise<NoticeActionResult> { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    const session = await requireDirector(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false, message: "원장만 공지를 작성할 수 있습니다." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    const validated = validateNoticeContent(input.title, input.body); // 제목·본문. MIME는 업로드 쪽.
    if (!validated.ok) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return validated; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    let imageUrl: string | null = null; // 버킷 notices 공개 URL.
    let imageStorageKey: string | null = null; // 스토리지 키. 교체 시 이전 파일을 지운다.

    if (input.image) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        const uploaded = await uploadNoticeImage(input.image); // jpeg/png/webp 5MB, 버킷 notices. 실패하면 NewsItem을 만들지 않는다.
        if (!uploaded.ok) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            return uploaded; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        }
        imageUrl = uploaded.imageUrl; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        imageStorageKey = uploaded.imageStorageKey; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    const row = await prisma.newsItem.create({ // 저장 행. 삭제는 없다.
        data: { // data. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            kind: "NOTICE", // 피드 BANNER와 구분. 공개 /notices where와 맞춘다.
            category: "GENERAL", // 학생은 STUDENT_YOUTH·GENERAL만.
            audience: "ALL", // 로그인 없이 공개. 역할 피드 audience와 다르다.
            title: validated.title, // 제목. 서버가 길이를 다시 본다.
            content: validated.body, // 쪽지 본문. PENDING은 인박스에 안 나간다.
            imageUrl, // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            imageStorageKey, // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            published: true, // published. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            createdBy: session.user.id, // createdBy. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        },
        select: noticeSelect, // select. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    });

    revalidateNoticePaths(); // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    return { ok: true, notice: mapNotice(row) }; // 화면이 목록에 바로 꽂을 Notice DTO.
}

/**
 * 기존 공지 본문·이미지를 고친다. kind=NOTICE 행만 찾아 피드 뉴스를 덮지 않는다.
 * 새 파일 또는 removeImage면 이전 스토리지 키를 DB 갱신 뒤에 지운다.
 */
export async function updateNotice(input: { // updateNotice. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    id: string; // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    title: string; // 제목. 서버가 길이를 다시 본다.
    body: string; // 본문. 공개 목록 공백 문구와 작성 DTO를 나눈다.
    image?: File | null; // jpeg/png/webp. 5MB는 서버 버킷 notices.
    removeImage?: boolean; // removeImage. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
}): Promise<NoticeActionResult> { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    const session = await requireDirector(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false, message: "원장만 공지를 수정할 수 있습니다." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    if (!input.id) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false, message: "공지 ID가 없습니다." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    const validated = validateNoticeContent(input.title, input.body); // 제목·본문. MIME는 업로드 쪽.
    if (!validated.ok) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return validated; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    const existing = await prisma.newsItem.findFirst({ // 기존 행. 클라이언트가 studentId를 바꿔 가로채지 못하게.
        where: { // where. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            id: input.id, // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            kind: "NOTICE", // 피드 BANNER를 덮지 않는다.
        },
        select: { // select. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            id: true, // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            imageUrl: true, // 버킷 notices 공개 URL.
            imageStorageKey: true, // 스토리지 키. 교체 시 이전 파일을 지운다.
        },
    });

    if (!existing) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false, message: "공지를 찾을 수 없습니다." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    let nextImageUrl: string | null = existing.imageUrl; // nextImageUrl. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    let nextImageStorageKey: string | null = existing.imageStorageKey; // nextImageStorageKey. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    let previousKeyToDelete: string | null = null; // DB를 먼저 바꾼 뒤 이전 파일을 지운다.

    if (input.image) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        const uploaded = await uploadNoticeImage(input.image); // jpeg/png/webp 5MB, 버킷 notices.
        if (!uploaded.ok) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            return uploaded; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        }

        previousKeyToDelete = existing.imageStorageKey; // DB를 먼저 새 키로 바꾼 뒤 이전 파일을 지운다.
        nextImageUrl = uploaded.imageUrl; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        nextImageStorageKey = uploaded.imageStorageKey; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    } else if (input.removeImage) { // 다른 분기. 로직은 그대로.
        previousKeyToDelete = existing.imageStorageKey; // 새 파일 없이 기존 이미지만 제거.
        nextImageUrl = null; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        nextImageStorageKey = null; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    const row = await prisma.newsItem.update({ // 저장 행. 삭제는 없다.
        where: { id: input.id }, // where. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        data: { // data. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            title: validated.title, // 제목. 서버가 길이를 다시 본다.
            content: validated.body, // 쪽지 본문. PENDING은 인박스에 안 나간다.
            imageUrl: nextImageUrl, // 버킷 notices 공개 URL.
            imageStorageKey: nextImageStorageKey, // 스토리지 키. 교체 시 이전 파일을 지운다.
            audience: "ALL", // 로그인 없이 공개. 역할 피드 audience와 다르다.
            category: "GENERAL", // 학생은 STUDENT_YOUTH·GENERAL만.
            published: true, // kind는 그대로 NOTICE.
        },
        select: noticeSelect, // select. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    });

    if ( // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        previousKeyToDelete && // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        previousKeyToDelete !== nextImageStorageKey // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    ) { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        const removed = await deleteNoticeImage(previousKeyToDelete); // 실패해도 공지 수정은 유지.
        if (!removed.ok) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            console.error(removed.message); // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        }
    }

    revalidateNoticePaths(); // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    return { ok: true, notice: mapNotice(row) }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
}

/**
 * 공개 공지를 지운다. DB 행을 먼저 지운 뒤 notices 버킷 파일을 정리한다.
 * 스토리지 실패는 로그만 남기고 삭제는 성공으로 본다 — 목록에서 이미 빠진다.
 */
export async function deleteNotice(input: { // deleteNotice. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    id: string; // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
}): Promise<DeleteNoticeResult> { // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    const session = await requireDirector(); // 세션 JWT. 폼에서 userId를 받지 않는다.
    if (!session) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false, message: "원장만 공지를 삭제할 수 있습니다." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    if (!input.id) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false, message: "공지 ID가 없습니다." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    const existing = await prisma.newsItem.findFirst({ // 기존 행. 클라이언트가 studentId를 바꿔 가로채지 못하게.
        where: { // where. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            id: input.id, // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            kind: "NOTICE", // 공개 공지. 피드 BANNER를 덮지 않는다.
        },
        select: { // select. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            id: true, // id. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
            imageStorageKey: true, // 스토리지 키. 교체 시 이전 파일을 지운다.
        },
    });

    if (!existing) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        return { ok: false, message: "공지를 찾을 수 없습니다." }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    }

    await prisma.newsItem.delete({ // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        where: { id: input.id }, // DB 행을 먼저 지운 뒤 버킷 파일을 정리한다.
    });

    const removed = await deleteNoticeImage(existing.imageStorageKey); // 버킷 notices 파일. 실패해도 DB 삭제는 유지.
    if (!removed.ok) { // 가드. 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
        console.error(removed.message); // 실패는 로그만. 목록에서 이미 빠지므로 삭제는 성공으로 본다.
    }

    revalidateNoticePaths(); // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
    return { ok: true }; // 원장 공개 공지 CRUD. 버킷 notices 5MB jpeg/png/webp.
}
