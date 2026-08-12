"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getAuditRequestMetadata } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { transitionStudentStatus } from "@/lib/student-lifecycle";
import { STUDENT_STATUS_METADATA } from "@/features/students/presentation";

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
                    ? `${result.student.name} 학생을 퇴원 처리했습니다. 계정과 활성 수강 및 가족 연결이 정리되었습니다.`
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
