"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type ClassesActionResult =
    | { ok: true; message: string; id?: string }
    | { ok: false; message: string };

async function requireDirector() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

function revalidateClasses() {
    revalidatePath("/director/classes");
    revalidatePath("/director/students");
    revalidatePath("/staff/attendance");
    revalidatePath("/staff/dashboard");
    revalidatePath("/parent/timetable");
    revalidatePath("/student/timetable");
}

/** datetime-local 값(YYYY-MM-DDTHH:mm)을 KST로 해석 */
function parseKstDateTime(value: string): Date | null {
    const trimmed = String(value ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return null;
    const date = new Date(`${trimmed}:00+09:00`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

export async function createClass(input: {
    name: string;
    subject: string;
    teacherUserId?: string | null;
}): Promise<ClassesActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const name = String(input.name ?? "").trim();
    const subject = String(input.subject ?? "").trim();
    const teacherUserId = input.teacherUserId?.trim() || null;

    if (!name || name.length > 80) {
        return { ok: false, message: "반 이름을 1~80자로 입력해 주세요." };
    }
    if (!subject || subject.length > 60) {
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." };
    }

    if (teacherUserId) {
        const teacher = await prisma.user.findFirst({
            where: {
                id: teacherUserId,
                role: { in: ["TEACHER", "STAFF"] },
                status: "ACTIVE",
            },
            select: { id: true },
        });
        if (!teacher) {
            return { ok: false, message: "담당 선생님를 찾을 수 없습니다." };
        }
    }

    const row = await prisma.class.create({
        data: {
            name,
            subject,
            teacherUserId,
            active: true,
            schedule: {},
        },
        select: { id: true },
    });

    revalidateClasses();
    return { ok: true, id: row.id, message: "반을 만들었습니다." };
}

export async function updateClass(input: {
    classId: string;
    name: string;
    subject: string;
    teacherUserId?: string | null;
    active: boolean;
}): Promise<ClassesActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const classId = String(input.classId ?? "").trim();
    const name = String(input.name ?? "").trim();
    const subject = String(input.subject ?? "").trim();
    const teacherUserId = input.teacherUserId?.trim() || null;

    if (!classId) return { ok: false, message: "반 ID가 없습니다." };
    if (!name || name.length > 80) {
        return { ok: false, message: "반 이름을 1~80자로 입력해 주세요." };
    }
    if (!subject || subject.length > 60) {
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." };
    }

    const existing = await prisma.class.findUnique({
        where: { id: classId },
        select: { id: true },
    });
    if (!existing) return { ok: false, message: "반을 찾을 수 없습니다." };

    if (teacherUserId) {
        const teacher = await prisma.user.findFirst({
            where: {
                id: teacherUserId,
                role: { in: ["TEACHER", "STAFF"] },
                status: "ACTIVE",
            },
            select: { id: true },
        });
        if (!teacher) {
            return { ok: false, message: "담당 선생님를 찾을 수 없습니다." };
        }
    }

    await prisma.class.update({
        where: { id: classId },
        data: {
            name,
            subject,
            teacherUserId,
            active: Boolean(input.active),
        },
    });

    revalidateClasses();
    return { ok: true, id: classId, message: "반 정보를 저장했습니다." };
}

export async function createClassSession(input: {
    classId: string;
    startsAt: string;
    endsAt: string;
    classroom?: string | null;
}): Promise<ClassesActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const classId = String(input.classId ?? "").trim();
    const classroom = String(input.classroom ?? "").trim() || null;
    const startsAt = parseKstDateTime(input.startsAt);
    const endsAt = parseKstDateTime(input.endsAt);

    if (!classId) return { ok: false, message: "반을 선택해 주세요." };
    if (!startsAt || !endsAt) {
        return {
            ok: false,
            message: "시작·종료 시각 형식이 올바르지 않습니다.",
        };
    }
    if (endsAt <= startsAt) {
        return { ok: false, message: "종료 시각은 시작보다 늦어야 합니다." };
    }

    const classRow = await prisma.class.findFirst({
        where: { id: classId, active: true },
        select: { id: true },
    });
    if (!classRow) {
        return { ok: false, message: "활성 반만 수업을 추가할 수 있습니다." };
    }

    try {
        const row = await prisma.classSession.create({
            data: {
                classId,
                startsAt,
                endsAt,
                classroom,
                status: "SCHEDULED",
            },
            select: { id: true },
        });

        revalidateClasses();
        return { ok: true, id: row.id, message: "수업을 등록했습니다." };
    } catch {
        return {
            ok: false,
            message:
                "수업 등록에 실패했습니다. 같은 시작 시각의 수업이 이미 있을 수 있습니다.",
        };
    }
}

export async function cancelClassSession(input: {
    sessionId: string;
}): Promise<ClassesActionResult> {
    const session = await requireDirector();
    if (!session) {
        return { ok: false, message: "원장 권한이 필요합니다." };
    }

    const sessionId = String(input.sessionId ?? "").trim();
    if (!sessionId) return { ok: false, message: "수업 ID가 없습니다." };

    const row = await prisma.classSession.findUnique({
        where: { id: sessionId },
        select: { id: true, status: true },
    });
    if (!row) return { ok: false, message: "수업을 찾을 수 없습니다." };
    if (row.status === "CANCELLED") {
        return { ok: false, message: "이미 취소된 수업입니다." };
    }

    await prisma.classSession.update({
        where: { id: row.id },
        data: { status: "CANCELLED" },
    });

    revalidateClasses();
    return { ok: true, message: "수업을 취소했습니다." };
}
