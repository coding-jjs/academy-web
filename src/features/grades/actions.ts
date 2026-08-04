"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";

export type GradesActionResult =
    | { ok: true; message: string; id?: string }
    | { ok: false; message: string };

const WRONG_STATUSES = ["OPEN", "REVIEWED", "MASTERED"] as const;
type WrongStatus = (typeof WRONG_STATUSES)[number];

type Actor =
    | { kind: "director"; userId: string }
    | { kind: "staff"; userId: string };

async function requireGradesActor(): Promise<Actor | { error: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "로그인이 필요합니다." };
    }

    const role = session.user.role;
    const userId = session.user.id;

    if (role === "DIRECTOR") {
        return { kind: "director", userId };
    }

    if (role === "TEACHER" || role === "STAFF") {
        return { kind: "staff", userId };
    }

    return { error: "성적/오답 관리 권한이 없습니다." };
}

function parseDateOnly(value: string): Date | null {
    const trimmed = String(value ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const date = new Date(`${trimmed}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function revalidateGrades() {
    revalidatePath("/director/grades");
    revalidatePath("/staff/grades");
    revalidatePath("/parent/grades");
    revalidatePath("/student/grades");
}

/**
 * 스코프 + 출결/성적 권한(담당반 / 타반) 검사
 */
async function assertCanWriteStudent(
    actor: Actor,
    studentId: string,
): Promise<string | null> {
    if (actor.kind === "director") {
        const student = await prisma.student.findFirst({
            where: { id: studentId },
            select: { id: true },
        });
        return student ? null : "학생을 찾을 수 없습니다.";
    }

    const scope = await getStaffScope(actor.userId);
    const student = await prisma.student.findFirst({
        where: {
            id: studentId,
            ...studentScopeWhere(scope),
        },
        select: {
            id: true,
            enrollments: {
                where: { status: "ACTIVE", endedAt: null },
                take: 1,
                select: {
                    class: { select: { teacherUserId: true } },
                },
            },
        },
    });

    if (!student) {
        return scope.viewAllStudents
            ? "학생을 찾을 수 없습니다."
            : "담당 범위의 학생만 입력할 수 있습니다.";
    }

    const teacherUserId =
        student.enrollments[0]?.class.teacherUserId ?? null;
    const isOwnClass = teacherUserId === actor.userId;

    if (isOwnClass || !teacherUserId) {
        const allowed = await userHasPermission(
            actor.userId,
            "ownClassAttendanceGrade",
        );
        if (!allowed) {
            return "담당반 성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요.";
        }
    } else {
        const allowed = await userHasPermission(
            actor.userId,
            "otherTeacherAttendanceGrade",
        );
        if (!allowed) {
            return "타 교사반 성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요.";
        }
    }

    return null;
}

export async function createGradeRecord(input: {
    studentId: string;
    title: string;
    subject: string;
    score: number;
    maxScore: number;
    assessedAt: string;
    classId?: string | null;
}): Promise<GradesActionResult> {
    const actorOrError = await requireGradesActor();
    if ("error" in actorOrError) {
        return { ok: false, message: actorOrError.error };
    }
    const actor = actorOrError;

    const studentId = String(input.studentId ?? "").trim();
    const title = String(input.title ?? "").trim();
    const subject = String(input.subject ?? "").trim();
    const score = Number(input.score);
    const maxScore = Number(input.maxScore);
    const assessedAt = parseDateOnly(input.assessedAt);
    const classId = input.classId?.trim() || null;

    if (!studentId) return { ok: false, message: "학생을 선택해 주세요." };
    if (!title || title.length > 120) {
        return { ok: false, message: "제목을 1~120자로 입력해 주세요." };
    }
    if (!subject || subject.length > 60) {
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." };
    }
    if (!Number.isFinite(score) || score < 0) {
        return { ok: false, message: "점수가 올바르지 않습니다." };
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
        return { ok: false, message: "만점은 0보다 커야 합니다." };
    }
    if (score > maxScore) {
        return { ok: false, message: "점수는 만점을 넘을 수 없습니다." };
    }
    if (!assessedAt) {
        return { ok: false, message: "평가일이 올바르지 않습니다." };
    }

    const accessError = await assertCanWriteStudent(actor, studentId);
    if (accessError) return { ok: false, message: accessError };

    if (classId) {
        const cls = await prisma.class.findFirst({
            where: { id: classId },
            select: { id: true },
        });
        if (!cls) return { ok: false, message: "반 정보가 올바르지 않습니다." };
    }

    const row = await prisma.gradeRecord.create({
        data: {
            studentId,
            classId,
            createdBy: actor.userId,
            title,
            subject,
            score,
            maxScore,
            assessedAt,
        },
        select: { id: true },
    });

    revalidateGrades();
    return { ok: true, id: row.id, message: "성적을 저장했습니다." };
}

export async function updateGradeRecord(input: {
    gradeId: string;
    title: string;
    subject: string;
    score: number;
    maxScore: number;
    assessedAt: string;
}): Promise<GradesActionResult> {
    const actorOrError = await requireGradesActor();
    if ("error" in actorOrError) {
        return { ok: false, message: actorOrError.error };
    }
    const actor = actorOrError;

    const gradeId = String(input.gradeId ?? "").trim();
    const title = String(input.title ?? "").trim();
    const subject = String(input.subject ?? "").trim();
    const score = Number(input.score);
    const maxScore = Number(input.maxScore);
    const assessedAt = parseDateOnly(input.assessedAt);

    if (!gradeId) return { ok: false, message: "성적 ID가 없습니다." };
    if (!title || title.length > 120) {
        return { ok: false, message: "제목을 1~120자로 입력해 주세요." };
    }
    if (!subject || subject.length > 60) {
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." };
    }
    if (!Number.isFinite(score) || score < 0) {
        return { ok: false, message: "점수가 올바르지 않습니다." };
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
        return { ok: false, message: "만점은 0보다 커야 합니다." };
    }
    if (score > maxScore) {
        return { ok: false, message: "점수는 만점을 넘을 수 없습니다." };
    }
    if (!assessedAt) {
        return { ok: false, message: "평가일이 올바르지 않습니다." };
    }

    const existing = await prisma.gradeRecord.findUnique({
        where: { id: gradeId },
        select: { id: true, studentId: true },
    });
    if (!existing) return { ok: false, message: "성적을 찾을 수 없습니다." };

    const accessError = await assertCanWriteStudent(actor, existing.studentId);
    if (accessError) return { ok: false, message: accessError };

    await prisma.gradeRecord.update({
        where: { id: existing.id },
        data: { title, subject, score, maxScore, assessedAt },
    });

    revalidateGrades();
    return { ok: true, id: existing.id, message: "성적을 수정했습니다." };
}

export async function createWrongNote(input: {
    studentId: string;
    gradeRecordId?: string | null;
    classId?: string | null;
    questionNo?: string | null;
    questionText?: string | null;
    studentAnswer?: string | null;
    correctAnswer?: string | null;
    explanation?: string | null;
    status?: string;
}): Promise<GradesActionResult> {
    const actorOrError = await requireGradesActor();
    if ("error" in actorOrError) {
        return { ok: false, message: actorOrError.error };
    }
    const actor = actorOrError;

    const studentId = String(input.studentId ?? "").trim();
    const gradeRecordId = input.gradeRecordId?.trim() || null;
    const classId = input.classId?.trim() || null;
    const questionNo = String(input.questionNo ?? "").trim() || null;
    const questionText = String(input.questionText ?? "").trim() || null;
    const studentAnswer = String(input.studentAnswer ?? "").trim() || null;
    const correctAnswer = String(input.correctAnswer ?? "").trim() || null;
    const explanation = String(input.explanation ?? "").trim() || null;
    const statusRaw = String(input.status ?? "OPEN").trim();
    const status = (WRONG_STATUSES as readonly string[]).includes(statusRaw)
        ? (statusRaw as WrongStatus)
        : "OPEN";

    if (!studentId) return { ok: false, message: "학생을 선택해 주세요." };
    if (!questionText && !questionNo) {
        return {
            ok: false,
            message: "문항 번호 또는 문제 내용을 입력해 주세요.",
        };
    }

    const accessError = await assertCanWriteStudent(actor, studentId);
    if (accessError) return { ok: false, message: accessError };

    if (gradeRecordId) {
        const grade = await prisma.gradeRecord.findFirst({
            where: { id: gradeRecordId, studentId },
            select: { id: true },
        });
        if (!grade) {
            return { ok: false, message: "연결할 성적을 찾을 수 없습니다." };
        }
    }

    const row = await prisma.wrongNote.create({
        data: {
            studentId,
            gradeRecordId,
            classId,
            authorUserId: actor.userId,
            questionNo,
            questionText,
            studentAnswer,
            correctAnswer,
            explanation,
            status,
        },
        select: { id: true },
    });

    revalidateGrades();
    return { ok: true, id: row.id, message: "오답을 저장했습니다." };
}

export async function updateWrongNote(input: {
    wrongNoteId: string;
    questionNo?: string | null;
    questionText?: string | null;
    studentAnswer?: string | null;
    correctAnswer?: string | null;
    explanation?: string | null;
    status: string;
}): Promise<GradesActionResult> {
    const actorOrError = await requireGradesActor();
    if ("error" in actorOrError) {
        return { ok: false, message: actorOrError.error };
    }
    const actor = actorOrError;

    const wrongNoteId = String(input.wrongNoteId ?? "").trim();
    if (!wrongNoteId) return { ok: false, message: "오답 ID가 없습니다." };

    const statusRaw = String(input.status ?? "").trim();
    if (!(WRONG_STATUSES as readonly string[]).includes(statusRaw)) {
        return { ok: false, message: "오답 상태가 올바르지 않습니다." };
    }
    const status = statusRaw as WrongStatus;

    const existing = await prisma.wrongNote.findUnique({
        where: { id: wrongNoteId },
        select: { id: true, studentId: true },
    });
    if (!existing) return { ok: false, message: "오답을 찾을 수 없습니다." };

    const accessError = await assertCanWriteStudent(actor, existing.studentId);
    if (accessError) return { ok: false, message: accessError };

    await prisma.wrongNote.update({
        where: { id: existing.id },
        data: {
            questionNo: String(input.questionNo ?? "").trim() || null,
            questionText: String(input.questionText ?? "").trim() || null,
            studentAnswer: String(input.studentAnswer ?? "").trim() || null,
            correctAnswer: String(input.correctAnswer ?? "").trim() || null,
            explanation: String(input.explanation ?? "").trim() || null,
            status,
        },
    });

    revalidateGrades();
    return { ok: true, id: existing.id, message: "오답을 수정했습니다." };
}
