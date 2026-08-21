"use server";

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

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    NOTICE_AUDIENCE_LABELS,
    formatNoticeListDate,
    type Notice,
} from "@/features/notices/types";
import {
    deleteNoticeImage,
    uploadNoticeImage,
} from "@/lib/supabase/notice-storage";

/** 작성·수정 결과. 성공 시 화면이 목록에 바로 꽂을 Notice DTO를 받는다. */
export type NoticeActionResult =
    | { ok: true; notice: Notice }
    | { ok: false; message: string };

/** 삭제 결과. 스토리지 실패여도 ok:true일 수 있다 — DB 행은 이미 없다. */
export type DeleteNoticeResult = { ok: true } | { ok: false; message: string };

type NoticeRow = {
    id: string;
    audience: string;
    title: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: Date;
};

const noticeSelect = {
    id: true,
    audience: true,
    title: true,
    content: true,
    imageUrl: true,
    createdAt: true,
} as const;

function revalidateNoticePaths() {
    revalidatePath("/notices");
    revalidatePath("/");
}

function mapNotice(row: NoticeRow): Notice {
    return {
        id: row.id,
        audience: NOTICE_AUDIENCE_LABELS[row.audience] ?? "전체",
        title: row.title,
        date: formatNoticeListDate(row.createdAt),
        body: row.content?.trim() || "",
        imageUrl: row.imageUrl,
    };
}

async function requireDirector() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

function validateNoticeContent(titleRaw: string, bodyRaw: string) {
    const title = titleRaw.trim();
    const body = bodyRaw.trim();

    if (!title) {
        return { ok: false as const, message: "제목을 입력해 주세요." };
    }
    if (title.length > 80) {
        return {
            ok: false as const,
            message: "제목은 80자 이내로 입력해 주세요.",
        };
    }
    if (!body) {
        return { ok: false as const, message: "본문을 입력해 주세요." };
    }
    if (body.length > 5000) {
        return {
            ok: false as const,
            message: "본문은 5000자 이내로 입력해 주세요.",
        };
    }

    return { ok: true as const, title, body };
}

/**
 * 공개 공지를 만든다. kind=NOTICE, audience=ALL, published=true로 고정한다.
 * 이미지 MIME/용량 검사는 uploadNoticeImage(jpeg/png/webp, 5MB, 버킷 notices)가 한다.
 */
export async function createNotice(input: {
    title: string;
    body: string;
    image?: File | null;
}): Promise<NoticeActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장만 공지를 작성할 수 있습니다." };
    }

    const validated = validateNoticeContent(input.title, input.body);
    if (!validated.ok) {
        return validated;
    }

    let imageUrl: string | null = null;
    let imageStorageKey: string | null = null;

    if (input.image) {
        const uploaded = await uploadNoticeImage(input.image);
        if (!uploaded.ok) {
            return uploaded;
        }
        imageUrl = uploaded.imageUrl;
        imageStorageKey = uploaded.imageStorageKey;
    }

    const row = await prisma.newsItem.create({
        data: {
            kind: "NOTICE",
            category: "GENERAL",
            audience: "ALL",
            title: validated.title,
            content: validated.body,
            imageUrl,
            imageStorageKey,
            published: true,
            createdBy: session.user.id,
        },
        select: noticeSelect,
    });

    revalidateNoticePaths();
    return { ok: true, notice: mapNotice(row) };
}

/**
 * 기존 공지 본문·이미지를 고친다. kind=NOTICE 행만 찾아 피드 뉴스를 덮지 않는다.
 * 새 파일 또는 removeImage면 이전 스토리지 키를 DB 갱신 뒤에 지운다.
 */
export async function updateNotice(input: {
    id: string;
    title: string;
    body: string;
    image?: File | null;
    removeImage?: boolean;
}): Promise<NoticeActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장만 공지를 수정할 수 있습니다." };
    }

    if (!input.id) {
        return { ok: false, message: "공지 ID가 없습니다." };
    }

    const validated = validateNoticeContent(input.title, input.body);
    if (!validated.ok) {
        return validated;
    }

    const existing = await prisma.newsItem.findFirst({
        where: {
            id: input.id,
            kind: "NOTICE",
        },
        select: {
            id: true,
            imageUrl: true,
            imageStorageKey: true,
        },
    });

    if (!existing) {
        return { ok: false, message: "공지를 찾을 수 없습니다." };
    }

    let nextImageUrl: string | null = existing.imageUrl;
    let nextImageStorageKey: string | null = existing.imageStorageKey;
    let previousKeyToDelete: string | null = null;

    if (input.image) {
        const uploaded = await uploadNoticeImage(input.image);
        if (!uploaded.ok) {
            return uploaded;
        }

        previousKeyToDelete = existing.imageStorageKey;
        nextImageUrl = uploaded.imageUrl;
        nextImageStorageKey = uploaded.imageStorageKey;
    } else if (input.removeImage) {
        previousKeyToDelete = existing.imageStorageKey;
        nextImageUrl = null;
        nextImageStorageKey = null;
    }

    const row = await prisma.newsItem.update({
        where: { id: input.id },
        data: {
            title: validated.title,
            content: validated.body,
            imageUrl: nextImageUrl,
            imageStorageKey: nextImageStorageKey,
            audience: "ALL",
            category: "GENERAL",
            published: true,
        },
        select: noticeSelect,
    });

    if (
        previousKeyToDelete &&
        previousKeyToDelete !== nextImageStorageKey
    ) {
        const removed = await deleteNoticeImage(previousKeyToDelete);
        if (!removed.ok) {
            console.error(removed.message);
        }
    }

    revalidateNoticePaths();
    return { ok: true, notice: mapNotice(row) };
}

/**
 * 공개 공지를 지운다. DB 행을 먼저 지운 뒤 notices 버킷 파일을 정리한다.
 * 스토리지 실패는 로그만 남기고 삭제는 성공으로 본다 — 목록에서 이미 빠진다.
 */
export async function deleteNotice(input: {
    id: string;
}): Promise<DeleteNoticeResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장만 공지를 삭제할 수 있습니다." };
    }

    if (!input.id) {
        return { ok: false, message: "공지 ID가 없습니다." };
    }

    const existing = await prisma.newsItem.findFirst({
        where: {
            id: input.id,
            kind: "NOTICE",
        },
        select: {
            id: true,
            imageStorageKey: true,
        },
    });

    if (!existing) {
        return { ok: false, message: "공지를 찾을 수 없습니다." };
    }

    await prisma.newsItem.delete({
        where: { id: input.id },
    });

    const removed = await deleteNoticeImage(existing.imageStorageKey);
    if (!removed.ok) {
        console.error(removed.message);
    }

    revalidateNoticePaths();
    return { ok: true };
}
