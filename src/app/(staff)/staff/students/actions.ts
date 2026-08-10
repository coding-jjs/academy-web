"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";

const RECORD_TYPES = ["CLASS_NOTE", "HOMEWORK", "LIFE_RECORD"] as const;

export type LearningRecordState = {
    status: "idle" | "error" | "success";
    message: string;
};

export async function createLearningRecord(
    _prev: LearningRecordState,
    formData: FormData,
): Promise<LearningRecordState> {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF")
    ) {
        return { status: "error", message: "직원 로그인이 필요합니다." };
    }

    const studentId = String(formData.get("studentId") ?? "").trim();
    const classId = String(formData.get("classId") ?? "").trim() || null;
    const type = String(formData.get("type") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const recordDateRaw = String(formData.get("recordDate") ?? "").trim();

    if (!studentId) {
        return { status: "error", message: "학생을 선택해 주세요." };
    }
    if (!(RECORD_TYPES as readonly string[]).includes(type)) {
        return { status: "error", message: "기록 유형이 올바르지 않습니다." };
    }
    if (title.length < 2 || title.length > 80) {
        return { status: "error", message: "제목은 2~80자로 입력해 주세요." };
    }
    if (content.length < 2 || content.length > 2000) {
        return { status: "error", message: "내용은 2~2000자로 입력해 주세요." };
    }

    const recordDate = recordDateRaw ? new Date(recordDateRaw) : new Date();
    if (Number.isNaN(recordDate.getTime())) {
        return { status: "error", message: "기록 날짜가 올바르지 않습니다." };
    }

    const scope = await getStaffScope(session.user.id);

    const student = await prisma.student.findFirst({
        where: {
            id: studentId,
            status: "ENROLLED",
            ...studentScopeWhere(scope),
        },
        select: { id: true },
    });

    if (!student) {
        return { status: "error", message: "기록 가능한 학생이 아닙니다." };
    }

    if (classId) {
        const ownedOrAllowed = await prisma.class.findFirst({
            where: {
                id: classId,
                active: true,
                ...classScopeWhere(scope),
            },
            select: { id: true },
        });

        if (!ownedOrAllowed) {
            return { status: "error", message: "선택할 수 없는 반입니다." };
        }
    }

    try {
        await prisma.learningRecord.create({
            data: {
                studentId,
                classId,
                authorUserId: session.user.id,
                type: type as (typeof RECORD_TYPES)[number],
                title,
                content,
                recordDate,
            },
        });
        revalidatePath("/staff/students");
        return { status: "success", message: "학습 기록이 등록되었습니다." };
    } catch {
        return { status: "error", message: "기록 등록에 실패했습니다." };
    }
}
