"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    revalidatePath("/staff/students");
    revalidatePath("/staff/billing");
    revalidatePath("/staff/grades");
    revalidatePath("/staff/attendance");
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

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { id: true, status: true, name: true },
        });
        if (!student) {
            return { ok: false, message: "학생을 찾을 수 없습니다." };
        }
        if (student.status === status) {
            return { ok: true, message: "이미 같은 상태입니다." };
        }

        const now = new Date();

        await prisma.$transaction(async (tx) => {
            await tx.student.update({
                where: { id: studentId },
                data: {
                    status,
                    withdrawnAt: status === "WITHDRAWN" ? now : null,
                },
            });

            // 퇴원 시 활성 수강 전부 해제
            if (status === "WITHDRAWN") {
                await tx.classEnrollment.updateMany({
                    where: {
                        studentId,
                        status: "ACTIVE",
                        endedAt: null,
                    },
                    data: {
                        status: "CANCELLED",
                        endedAt: now,
                    },
                });

                // 진행 중 이탈 케이스가 있으면 퇴원으로 맞춤
                await tx.churnCase.updateMany({
                    where: {
                        studentId,
                        status: { in: ["DETECTED", "COUNSELING"] },
                    },
                    data: {
                        status: "WITHDRAWN",
                        resolvedAt: now,
                    },
                });
            }
        });

        revalidateStudentPaths();

        const label =
            status === "ENROLLED"
                ? "재원"
                : status === "PAUSED"
                  ? "휴원"
                  : "퇴원";

        return {
            ok: true,
            message:
                status === "WITHDRAWN"
                    ? `${student.name} 학생을 퇴원 처리했습니다. 활성 수강이 해제되었습니다.`
                    : `${student.name} 학생 상태를 ${label}(으)로 변경했습니다.`,
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