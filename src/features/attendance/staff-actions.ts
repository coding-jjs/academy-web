"use server";

/**
 * 교사·직원이 한 회차의 출결을 upsert로 저장한다.
 *
 * 호출: `(teacher)/teacher/attendance/components/AttendanceSessionEditor.tsx`
 * (`useActionState(saveSessionAttendance)`).
 *
 * 담당반(`ownClassAttendanceGrade`)과 타반(`otherTeacherAttendanceGrade`) 권한을 나눠 검사한다.
 * 출석/지각만 checkInAt을 남기고, 상태 미변경 행은 쓰지 않아 빈 출석 행을 만들지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 결석 신청을 AttendanceRecord로 승격하지 않는다. 신청은 힌트일 뿐.
 * - 수강 명단 밖 학생 id는 payload에 있어도 버린다.
 *
 * 관련: `lib/permission-guard.ts`, `features/attendance/staff-data.ts`.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userHasPermission } from "@/lib/permission-guard";

const ALLOWED = [
    "PRESENT",
    "LATE",
    "ABSENT",
    "EXCUSED",
    "EARLY_LEAVE",
] as const;

type AttendanceStatus = (typeof ALLOWED)[number];

/**
 * 출결 저장 폼의 useActionState 상태.
 * idle은 초기값. 변경이 없으면 success+"변경된 출결이 없음"을 돌려 빈 upsert를 피한다.
 */
export type SaveAttendanceState = {
    status: "idle" | "error" | "success";
    message: string;
};

function isStatus(value: string): value is AttendanceStatus {
    return (ALLOWED as readonly string[]).includes(value);
}

async function requireStaffOrTeacher() {
    const session = await auth();
    if (
        !session?.user?.id ||
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF")
    ) {
        return null;
    }
    return session;
}

async function assertCanEditSession(
    userId: string,
    sessionId: string,
): Promise<
    | {
          ok: true;
          teacherUserId: string | null;
          allowedStudentIds: Set<string>;
      }
    | { ok: false; message: string }
> {
    const classSession = await prisma.classSession.findFirst({
        where: { id: sessionId },
        select: {
            id: true,
            class: {
                select: {
                    teacherUserId: true,
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        select: { studentId: true },
                    },
                },
            },
        },
    });

    if (!classSession) {
        return { ok: false, message: "수업을 찾을 수 없습니다." };
    }

    const isOwnClass = classSession.class.teacherUserId === userId;

    if (isOwnClass) {
        const allowed = await userHasPermission(
            userId,
            "ownClassAttendanceGrade",
        );
        if (!allowed) {
            return {
                ok: false,
                message:
                    "담당반 출결 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요.",
            };
        }
    } else {
        const allowed = await userHasPermission(
            userId,
            "otherTeacherAttendanceGrade",
        );
        if (!allowed) {
            return {
                ok: false,
                message:
                    "타 선생님반 출결 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요.",
            };
        }
    }

    return {
        ok: true,
        teacherUserId: classSession.class.teacherUserId,
        allowedStudentIds: new Set(
            classSession.class.enrollments.map((e) => e.studentId),
        ),
    };
}

/**
 * 한 회차의 변경된 출결만 upsert한다.
 *
 * @param _prev useActionState 직전 상태.
 * @param formData `sessionId`, `payload`(JSON `{ studentId, status }[]`).
 * @returns 저장 건수 메시지 또는 검증/권한 에러.
 * @auth TEACHER/STAFF + 해당 회차 권한 키.
 * @sideEffects AttendanceRecord upsert, `/teacher/attendance` revalidate.
 */
export async function saveSessionAttendance(
    _prev: SaveAttendanceState,
    formData: FormData,
): Promise<SaveAttendanceState> {
    const session = await requireStaffOrTeacher();
    if (!session) {
        return { status: "error", message: "직원 로그인이 필요합니다." };
    }

    const sessionId = String(formData.get("sessionId") ?? "").trim();
    const payloadRaw = String(formData.get("payload") ?? "").trim();
    if (!sessionId || !payloadRaw) {
        return { status: "error", message: "저장할 출결 정보가 없습니다." };
    }

    let rows: { studentId: string; status: string }[] = [];
    try {
        rows = JSON.parse(payloadRaw) as {
            studentId: string;
            status: string;
        }[];
    } catch {
        return {
            status: "error",
            message: "출결 데이터 형식이 올바르지 않습니다.",
        };
    }

    if (!Array.isArray(rows) || rows.length === 0) {
        return { status: "error", message: "저장할 학생이 없습니다." };
    }

    const access = await assertCanEditSession(session.user.id, sessionId);
    if (!access.ok) {
        return { status: "error", message: access.message };
    }

    const validRows = Array.from(
        new Map(
            rows
                .filter(
                    (row) =>
                        access.allowedStudentIds.has(row.studentId) &&
                        isStatus(row.status),
                )
                .map((row) => [row.studentId, row] as const),
        ).values(),
    ) as { studentId: string; status: AttendanceStatus }[];

    if (validRows.length === 0) {
        return { status: "error", message: "저장할 학생이 없습니다." };
    }

    const existingRecords = await prisma.attendanceRecord.findMany({
        where: {
            sessionId,
            studentId: { in: validRows.map((row) => row.studentId) },
        },
        select: {
            studentId: true,
            status: true,
            checkInAt: true,
        },
    });
    const existingByStudent = new Map(
        existingRecords.map((record) => [record.studentId, record]),
    );
    const changedRows = validRows.filter(
        (row) => existingByStudent.get(row.studentId)?.status !== row.status,
    );

    if (changedRows.length === 0) {
        return { status: "success", message: "변경된 출결이 없습니다." };
    }

    const now = new Date();

    try {
        await prisma.$transaction(
            changedRows.map((row) => {
                const existing = existingByStudent.get(row.studentId);
                const checkInAt =
                    row.status === "PRESENT" || row.status === "LATE"
                        ? (existing?.checkInAt ?? now)
                        : null;

                return prisma.attendanceRecord.upsert({
                    where: {
                        studentId_sessionId: {
                            studentId: row.studentId,
                            sessionId,
                        },
                    },
                    create: {
                        studentId: row.studentId,
                        sessionId,
                        status: row.status,
                        checkInAt,
                        updatedBy: session.user.id,
                    },
                    update: {
                        status: row.status,
                        checkInAt,
                        checkOutAt: row.status === "EARLY_LEAVE" ? now : null,
                        updatedBy: session.user.id,
                    },
                });
            }),
        );

        revalidatePath("/teacher/attendance");
        return {
            status: "success",
            message: `${changedRows.length}명의 출결이 저장되었습니다.`,
        };
    } catch {
        return { status: "error", message: "출결 저장에 실패했습니다." };
    }
}
