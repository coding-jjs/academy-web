"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    NOTICE_AUDIENCE_LABELS,
    formatNoticeListDate,
    type Notice,
} from "@/features/notices/types";

export type NoticeActionResult =
    | { ok: true; notice: Notice }
    | { ok: false; message: string };

export type DeleteNoticeResult =
    | { ok: true }
    | { ok: false; message: string };

type NoticeRow = {
    id: string;
    audience: string;
    title: string;
    content: string | null;
    createdAt: Date;
};

const noticeSelect = {
    id: true,
    audience: true,
    title: true,
    content: true,
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

export async function createNotice(input: {
    title: string;
    body: string;
}): Promise<NoticeActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장만 공지를 작성할 수 있습니다." };
    }

    const validated = validateNoticeContent(input.title, input.body);
    if (!validated.ok) {
        return validated;
    }

    const row = await prisma.newsItem.create({
        data: {
            kind: "NOTICE",
            category: "GENERAL",
            audience: "ALL",
            title: validated.title,
            content: validated.body,
            published: true,
            createdBy: session.user.id,
        },
        select: noticeSelect,
    });

    revalidateNoticePaths();
    return { ok: true, notice: mapNotice(row) };
}

export async function updateNotice(input: {
    id: string;
    title: string;
    body: string;
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
        select: { id: true },
    });

    if (!existing) {
        return { ok: false, message: "공지를 찾을 수 없습니다." };
    }

    const row = await prisma.newsItem.update({
        where: { id: input.id },
        data: {
            title: validated.title,
            content: validated.body,
            audience: "ALL",
            category: "GENERAL",
            published: true,
        },
        select: noticeSelect,
    });

    revalidateNoticePaths();
    return { ok: true, notice: mapNotice(row) };
}

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
        select: { id: true },
    });

    if (!existing) {
        return { ok: false, message: "공지를 찾을 수 없습니다." };
    }

    await prisma.newsItem.delete({
        where: { id: input.id },
    });

    revalidateNoticePaths();
    return { ok: true };
}
