"use server";

/**
 * 원장·교사·직원이 성적·오답 노트를 만들고 고치는 Server Action.
 *
 * 호출: `GradeRecordsPanel` / `WrongNotesPanel`이 저장·수정 시 직접 호출한다.
 * 전제: 세션 역할이 DIRECTOR | TEACHER | STAFF. 학부모·학생은 거절한다.
 *
 * 저장 전 `assertCanWriteStudent`가 스코프와 담당반/타반 권한을 가른다.
 * 활성 수강 1건(take:1)의 담임으로 내반을 보고, 타반이면 otherTeacherAttendanceGrade가 필요하다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 쓰기 → `viewer-data.ts`는 읽기 전용.
 * - 성적·오답 삭제 → 수정만 제공한다.
 *
 * 관련: `data.ts`(입력 화면 조회), `viewer-data.ts`(학부모/학생 읽기).
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getKstDayRange } from "@/lib/date-kst";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope";

/** 성적·오답 저장 결과. 성공해도 redirect하지 않고 클라이언트가 메시지를 띄운다. */
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
    if (date.toISOString().slice(0, 10) !== trimmed) return null;
    return date;
}

/** 평가일 문자열(YYYY-MM-DD)을 KST 오늘과 비교. Date 객체로 비교하면 TZ가 어긋난다. */
function isFutureKstDate(value: string) {
    return value > getKstDayRange().day;
}

function revalidateGrades() {
    revalidatePath("/director/grades");
    revalidatePath("/teacher/grades");
    revalidatePath("/parent/grades");
    revalidatePath("/student/grades");
}

/**
 * 이 학생 성적·오답을 쓸 수 있는지 검사한다.
 *
 * 원장은 학생만 있으면 통과. 직원은 스코프 안이어야 하고,
 * 활성 수강 1건의 담임이 본인이면 ownClassAttendanceGrade,
 * 다른 선생님 반이면 otherTeacherAttendanceGrade가 필요하다.
 * 담임이 없는 반은 내반으로 본다.
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

    const teacherUserId = student.enrollments[0]?.class.teacherUserId ?? null;
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
            return "타 선생님반 성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요.";
        }
    }

    return null;
}

/**
 * 한 학생의 성적 행을 만든다.
 *
 * @param input.assessedAt YYYY-MM-DD. KST 오늘을 넘기면 거절한다.
 * @param input.classId 선택. 학생의 현재 반을 화면이 넘기며, 없으면 반 없이 저장한다.
 */
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
    const assessedAtValue = String(input.assessedAt ?? "").trim();
    const assessedAt = parseDateOnly(assessedAtValue);
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
    if (isFutureKstDate(assessedAtValue)) {
        return {
            ok: false,
            message: "평가일은 오늘 이후로 지정할 수 없습니다.",
        };
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

/**
 * 기존 성적 행을 고친다. studentId는 클라이언트가 넘기지 않고 기존 행에서 읽어 가로채기를 막는다.
 */
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
    const assessedAtValue = String(input.assessedAt ?? "").trim();
    const assessedAt = parseDateOnly(assessedAtValue);

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
    if (isFutureKstDate(assessedAtValue)) {
        return {
            ok: false,
            message: "평가일은 오늘 이후로 지정할 수 없습니다.",
        };
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

/**
 * 오답 노트를 만든다. 문항 번호 또는 문제 본문 중 하나는 필수.
 * status가 허용 값이 아니면 OPEN으로 떨어뜨려 잘못된 코드가 DB에 들어가지 않게 한다.
 */
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

/**
 * 기존 오답 노트를 고친다. 연결 성적(gradeRecordId)은 여기서 바꾸지 않는다 — 화면이 수정 중 select를 잠근다.
 */
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
