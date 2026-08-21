"use server";

/**
 * 교사·직원이 스코프 안 학생에게 학습 기록(수업/숙제/생활)을 남긴다.
 *
 * 호출: `(teacher)/teacher/students/components/LearningRecordForm.tsx`
 * (`useActionState(createLearningRecord)`).
 *
 * 학생·반은 `staff-scope`로 막으며, 반이 비어 있으면 반 없이 기록만 생성한다.
 * `viewAllStudents`가 없으면 담당반 수강생만 고를 수 있다.
 *
 * 의도적으로 하지 않는 일:
 * - 원장 경로를 쓰지 않는다. 원장 원생 화면은 상담 등 다른 액션.
 * - 기록을 수정·삭제하지 않는다. create만.
 *
 * 관련: `lib/staff-scope.ts`, `features/students/presentation.ts`의 타입 라벨.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
    classScopeWhere,
    getStaffScope,
    studentScopeWhere,
} from "@/lib/staff-scope";

const RECORD_TYPES = ["CLASS_NOTE", "HOMEWORK", "LIFE_RECORD"] as const;

/**
 * 학습기록 폼의 useActionState 상태.
 * idle은 초기값. 이 액션은 error/success만 반환한다.
 */
export type LearningRecordState = {
    status: "idle" | "error" | "success";
    message: string;
};

/**
 * LearningRecord 한 건을 생성한다.
 *
 * @param _prev useActionState 직전 상태. 서버는 폼만 본다.
 * @param formData studentId, type, title, content, 선택 classId·recordDate.
 * @returns 검증/권한 실패 또는 성공 메시지. redirect하지 않는다.
 * @auth TEACHER 또는 STAFF. 원장/학부모는 error.
 * @sideEffects learningRecord create, teacher/employee students 경로 revalidate.
 */
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
        revalidatePath("/teacher/students");
    revalidatePath("/employee/students");
        return { status: "success", message: "학습 기록이 등록되었습니다." };
    } catch {
        return { status: "error", message: "기록 등록에 실패했습니다." };
    }
}
