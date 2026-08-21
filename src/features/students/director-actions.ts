"use server";

/**
 * 원장 원생 관리의 쓰기 액션이다. 수강 추가/해제와 재원·휴원·퇴원 상태 변경을 처리한다.
 *
 * 호출: `(director)/director/students/components/DirectorStudentDetail.tsx`.
 * 상태 변경은 직접 update하지 않고 `transitionStudentStatus`(lifecycle)에 위임한다.
 * 퇴원 학생에는 반을 추가하지 않으며, 수강 해제는 행 삭제 대신 CANCELLED+endedAt이다.
 *
 * 의도적으로 하지 않는 일:
 * - Student 행 자체를 삭제하지 않는다.
 * - Google User를 여기서 바로 BLOCK하지 않는다 → 퇴원 유예는 lifecycle/크론.
 * - 교사·직원이 수강을 바꾸지 못하게 한다 → DIRECTOR만.
 *
 * 관련: `lib/student-lifecycle.ts`, `features/students/presentation.ts`.
 */

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getAuditRequestMetadata } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { transitionStudentStatus } from "@/lib/student-lifecycle";
import { STUDENT_STATUS_METADATA } from "@/features/students/presentation";

/**
 * 수강/상태 액션 공통 결과. throw 대신 메시지. `ok`여도 "이미 같은 상태"일 수 있다.
 */
export type EnrollmentActionResult = {
    ok: boolean;
    message: string;
};

const STUDENT_STATUSES = ["ENROLLED", "PAUSED", "WITHDRAWN"] as const;
type StudentStatus = (typeof STUDENT_STATUSES)[number];

async function requireDirector() {
    const session = await auth();
    if (!session?.user || session.user.role !== "DIRECTOR") {
        return null;
    }
    return session;
}

function revalidateStudentPaths() {
    revalidatePath("/director/students");
    revalidatePath("/director/churn");
    revalidatePath("/director/billing");
    revalidatePath("/director/grades");
    revalidatePath("/director/classes");
    revalidatePath("/teacher/students");
    revalidatePath("/employee/students");
    revalidatePath("/employee/billing");
    revalidatePath("/teacher/grades");
    revalidatePath("/teacher/attendance");
}

/**
 * 재원/휴원 학생에게 활성 수강을 하나 추가한다. 같은 반 중복 ACTIVE는 거절.
 *
 * @param input.studentId / input.classId
 * @returns 성공 또는 사유 메시지. WITHDRAWN이면 실패.
 * @auth DIRECTOR.
 * @sideEffects ClassEnrollment create(status=ACTIVE), 관련 경로 revalidate.
 */
export async function addStudentEnrollment(input: {
    studentId: string;
    classId: string;
}): Promise<EnrollmentActionResult> {
    try {
        const session = await requireDirector();
        if (!session) {
            return { ok: false, message: "권한이 없습니다." };
        }

        const { studentId, classId } = input;
        if (!studentId || !classId) {
            return { ok: false, message: "학생과 반을 확인해주세요." };
        }

        await prisma.$transaction(async (tx) => {
            const student = await tx.student.findFirst({
                where: { id: studentId },
                select: { id: true, status: true },
            });
            if (!student) {
                throw new Error("학생을 찾을 수 없습니다.");
            }
            if (student.status === "WITHDRAWN") {
                throw new Error("퇴원 학생에는 반을 추가할 수 없습니다.");
            }

            const classRow = await tx.class.findFirst({
                where: { id: classId, active: true },
                select: { id: true },
            });
            if (!classRow) {
                throw new Error("추가할 수 없는 반입니다.");
            }

            const active = await tx.classEnrollment.findFirst({
                where: {
                    studentId,
                    classId,
                    status: "ACTIVE",
                    endedAt: null,
                },
                select: { id: true },
            });
            if (active) {
                throw new Error("이미 수강 중인 반입니다.");
            }

            await tx.classEnrollment.create({
                data: {
                    studentId,
                    classId,
                    status: "ACTIVE",
                },
            });
        });

        revalidateStudentPaths();
        return { ok: true, message: "반이 추가되었습니다." };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "반 추가에 실패했습니다.",
        };
    }
}

/**
 * 활성 수강을 CANCELLED로 끝낸다. 행을 지우지 않아 출석·청구 이력이 학생에 남는다.
 *
 * @param input.enrollmentId ACTIVE + endedAt null인 수강만.
 * @auth DIRECTOR.
 * @sideEffects status=CANCELLED, endedAt=now.
 */
export async function endStudentEnrollment(input: {
    enrollmentId: string;
}): Promise<EnrollmentActionResult> {
    try {
        const session = await requireDirector();
        if (!session) {
            return { ok: false, message: "권한이 없습니다." };
        }

        const { enrollmentId } = input;
        if (!enrollmentId) {
            return { ok: false, message: "수강 정보가 올바르지 않습니다." };
        }

        const enrollment = await prisma.classEnrollment.findFirst({
            where: {
                id: enrollmentId,
                status: "ACTIVE",
                endedAt: null,
            },
            select: { id: true },
        });

        if (!enrollment) {
            return {
                ok: false,
                message: "이미 해제됐거나 없는 수강입니다.",
            };
        }

        await prisma.classEnrollment.update({
            where: { id: enrollment.id },
            data: {
                status: "CANCELLED",
                endedAt: new Date(),
            },
        });

        revalidateStudentPaths();
        return { ok: true, message: "수강이 해제되었습니다." };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "수강 해제에 실패했습니다.",
        };
    }
}

/**
 * ENROLLED ↔ PAUSED ↔ WITHDRAWN. 실제 전이·이탈 케이스·감사 로그는 lifecycle.
 *
 * 퇴원 메시지는 당일 24시까지 로그인이 가능하다는 유예를 안내한다.
 * 같은 상태로의 요청은 changed=false라 경로를 재검증하지 않는다.
 *
 * @param input.studentId / input.status
 * @auth DIRECTOR.
 * @sideEffects `transitionStudentStatus` 트랜잭션, 학부모·학생 홈까지 revalidate.
 */
export async function updateStudentStatus(input: {
    studentId: string;
    status: StudentStatus;
}): Promise<EnrollmentActionResult> {
    try {
        const session = await requireDirector();
        if (!session) {
            return { ok: false, message: "권한이 없습니다." };
        }

        const studentId = String(input.studentId ?? "").trim();
        const status = input.status;

        if (!studentId) {
            return { ok: false, message: "학생 정보가 없습니다." };
        }
        if (!(STUDENT_STATUSES as readonly string[]).includes(status)) {
            return { ok: false, message: "학생 상태가 올바르지 않습니다." };
        }

        const now = new Date();
        const metadata = await getAuditRequestMetadata();

        const result = await prisma.$transaction(async (tx) => {
            return transitionStudentStatus(tx, {
                studentId,
                status,
                actorUserId: session.user.id,
                metadata,
                now,
            });
        });

        if (!result.changed) {
            return { ok: true, message: "이미 같은 상태입니다." };
        }

        revalidateStudentPaths();
        revalidatePath("/director/parents");
        revalidatePath("/director/users");
        revalidatePath("/parent/dashboard");
        revalidatePath("/parent/attendance");
        revalidatePath("/parent/grades");
        revalidatePath("/parent/reports");
        revalidatePath("/parent/timetable");
        revalidatePath("/student/dashboard");

        const label = STUDENT_STATUS_METADATA[status].label;

        return {
            ok: true,
            message:
                status === "WITHDRAWN"
                    ? `${result.student.name} 학생을 퇴원 처리했습니다. 당일 24시까지 로그인과 조회가 가능하며, 이후 계정이 탈퇴 처리됩니다.`
                    : `${result.student.name} 학생 상태를 ${label}(으)로 변경했습니다.`,
        };
    } catch (error) {
        console.error(error);
        return {
            ok: false,
            message:
                error instanceof Error
                    ? error.message
                    : "상태 변경에 실패했습니다.",
        };
    }
}
