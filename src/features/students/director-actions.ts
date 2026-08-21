"use server"; // 원장 쓰기. 목록 읽기는 director-data.

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

import { revalidatePath } from "next/cache"; // 원생·이탈·청구·출석·학부모 홈까지.
import { auth } from "@/lib/auth"; // JWT. 교사·직원은 { ok: false }.
import { getAuditRequestMetadata } from "@/lib/audit"; // lifecycle이 감사 로그를 남긴다.
import { prisma } from "@/lib/db"; // 수강 create·CANCELLED. 상태 전이는 lifecycle.
import { transitionStudentStatus } from "@/lib/student-lifecycle"; // ENROLLED↔PAUSED↔WITHDRAWN. User BLOCK은 유예.
import { STUDENT_STATUS_METADATA } from "@/features/students/presentation"; // 성공 메시지 한글 라벨.

/**
 * 수강/상태 액션 공통 결과. throw 대신 메시지. `ok`여도 "이미 같은 상태"일 수 있다.
 */
export type EnrollmentActionResult = { // Screen이 피드백으로 그린다. redirect 없음.
    ok: boolean; // true여도 상태 미변경일 수 있다.
    message: string; // 사유 문장.
};

const STUDENT_STATUSES = ["ENROLLED", "PAUSED", "WITHDRAWN"] as const; // 전이는 lifecycle. 임의 문자열 거절.
type StudentStatus = (typeof STUDENT_STATUSES)[number]; // 폼 문자열을 이 집합으로만.

async function requireDirector() { // throw 대신 null. 호출 측이 { ok: false }.
    const session = await auth(); // JWT. 원장이 아니면 null — throw 대신 { ok: false }.
    if (!session?.user || session.user.role !== "DIRECTOR") { // 교사가 수강을 바꾸지 못하게.
        return null; // Screen이 "권한이 없습니다"를 그린다.
    }
    return session; // lifecycle actorUserId.
}

function revalidateStudentPaths() { // 수강 인원·출석 명단·청구가 같이 바뀐다.
    revalidatePath("/director/students"); // 원장 원생 테이블.
    revalidatePath("/director/churn"); // 퇴원·휴원이 이탈 케이스에 영향.
    revalidatePath("/director/billing"); // 수강·상태가 청구에 영향.
    revalidatePath("/director/grades"); // 원생 목록.
    revalidatePath("/director/classes"); // 수강 인원.
    revalidatePath("/teacher/students"); // 직원 워크스페이스.
    revalidatePath("/employee/students"); // 직원 워크스페이스.
    revalidatePath("/employee/billing"); // 직원 수납.
    revalidatePath("/teacher/grades"); // 성적 대상.
    revalidatePath("/teacher/attendance"); // 활성 수강 명단.
}

/**
 * 재원/휴원 학생에게 활성 수강을 하나 추가한다. 같은 반 중복 ACTIVE는 거절.
 *
 * @param input.studentId / input.classId
 * @returns 성공 또는 사유 메시지. WITHDRAWN이면 실패.
 * @auth DIRECTOR.
 * @sideEffects ClassEnrollment create(status=ACTIVE), 관련 경로 revalidate.
 */
export async function addStudentEnrollment(input: { // 퇴원 카드에는 반을 붙이지 않는다.
    studentId: string; // 재원/휴원. WITHDRAWN은 거절.
    classId: string; // active 반만.
}): Promise<EnrollmentActionResult> { // throw 대신 메시지.
    try { // 가드 throw를 message로.
        const session = await requireDirector(); // 교사가 수강을 바꾸지 못하게.
        if (!session) { // layout 밖 직접 호출.
            return { ok: false, message: "권한이 없습니다." }; // DIRECTOR만.
        }

        const { studentId, classId } = input; // 둘 다 있어야 Prisma를 친다.
        if (!studentId || !classId) { // 화면이 선택을 안 함.
            return { ok: false, message: "학생과 반을 확인해주세요." }; // 빈 id.
        }

        await prisma.$transaction(async (tx) => { // 학생·반·중복 수강을 한 트랜잭션.
            const student = await tx.student.findFirst({ // 없으면 거절.
                where: { id: studentId }, // 원생 카드.
                select: { id: true, status: true }, // WITHDRAWN이면 신규 수강 금지.
            });
            if (!student) { // 없는 id.
                throw new Error("학생을 찾을 수 없습니다."); // create하지 않는다.
            }
            if (student.status === "WITHDRAWN") { // 이력만 남기고 신규 수강은 막는다.
                throw new Error("퇴원 학생에는 반을 추가할 수 없습니다."); // 이력만 남기고 신규 수강은 막는다.
            }

            const classRow = await tx.class.findFirst({ // 비활성 반에는 수강을 붙이지 않는다.
                where: { id: classId, active: true }, // 비활성 반에는 수강을 붙이지 않는다.
                select: { id: true }, // 존재 여부만.
            });
            if (!classRow) { // 없거나 비활성.
                throw new Error("추가할 수 없는 반입니다."); // create하지 않는다.
            }

            const active = await tx.classEnrollment.findFirst({ // 같은 반 중복 ACTIVE 거절.
                where: { // 예전에 CANCELLED된 같은 반은 다시 넣을 수 있다.
                    studentId, // 이 원생.
                    classId, // 이 반.
                    status: "ACTIVE", // CANCELLED는 중복이 아니다.
                    endedAt: null, // 예전에 CANCELLED된 같은 반은 다시 넣을 수 있다.
                },
                select: { id: true }, // 존재 여부만.
            });
            if (active) { // 이미 수강 중.
                throw new Error("이미 수강 중인 반입니다."); // 두 번째 ACTIVE를 만들지 않는다.
            }

            await tx.classEnrollment.create({ // Student 행·상태는 건드리지 않는다.
                data: { // 해제는 삭제가 아니라 CANCELLED+endedAt.
                    studentId, // 재원/휴원.
                    classId, // 활성 반.
                    status: "ACTIVE", // Student 행·상태는 건드리지 않는다.
                },
            });
        });

        revalidateStudentPaths(); // 출석 명단·수강 인원.
        return { ok: true, message: "반이 추가되었습니다." }; // Screen 피드백.
    } catch (error) { // 가드 throw.
        console.error(error); // 내부만.
        return { // 부분 저장 없음.
            ok: false, // Screen 에러.
            message: // throw Error면 그 문장.
                error instanceof Error // 가드 throw.
                    ? error.message // "퇴원 학생에는…"
                    : "반 추가에 실패했습니다.", // 범용.
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
export async function endStudentEnrollment(input: { // 행 삭제가 아니다. CANCELLED+endedAt.
    enrollmentId: string; // ACTIVE+endedAt null만. 이미 끝난 이력은 거절.
}): Promise<EnrollmentActionResult> { // 출석·청구 행은 학생에 남는다.
    try { // 가드 throw를 message로.
        const session = await requireDirector(); // 교사 해제 금지.
        if (!session) { // layout 밖.
            return { ok: false, message: "권한이 없습니다." }; // DIRECTOR만.
        }

        const { enrollmentId } = input; // 해제 버튼이 넘긴 id.
        if (!enrollmentId) { // 빈 값.
            return { ok: false, message: "수강 정보가 올바르지 않습니다." }; // Prisma를 치지 않는다.
        }

        const enrollment = await prisma.classEnrollment.findFirst({ // 이미 끝난 이력을 다시 덮지 않는다.
            where: { // CANCELLED 행은 버튼이 안 나온다.
                id: enrollmentId, // 해제 버튼 enrollmentId.
                status: "ACTIVE", // 이미 CANCELLED면 거절.
                endedAt: null, // 이미 끝난 이력을 다시 덮지 않는다.
            },
            select: { id: true }, // update where.
        });

        if (!enrollment) { // 이미 해제됐거나 없는 id.
            return { // 행을 지우지 않았는데 없는 것처럼 보일 수 있다.
                ok: false, // Screen 에러.
                message: "이미 해제됐거나 없는 수강입니다.", // 이력 덮어쓰기 방지.
            };
        }

        await prisma.classEnrollment.update({ // 삭제 금지. 출석·청구가 학생에 남는다.
            where: { id: enrollment.id }, // 방금 찾은 활성 행.
            data: { // 상태+종료 시각. 행은 남긴다.
                status: "CANCELLED", // 삭제 금지. 출석·청구가 학생에 남는다.
                endedAt: new Date(), // 시간표·출석 명단 where가 이 시각으로 뺀다.
            },
        });

        revalidateStudentPaths(); // 출석 명단에서 빠짐.
        return { ok: true, message: "수강이 해제되었습니다." }; // 이력은 recentChanges에 남는다.
    } catch (error) { // 예외.
        console.error(error); // 내부만.
        return { // 부분 저장 없음.
            ok: false, // Screen 에러.
            message: // throw Error면 그 문장.
                error instanceof Error // 예외.
                    ? error.message // 메시지.
                    : "수강 해제에 실패했습니다.", // 범용.
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
export async function updateStudentStatus(input: { // User를 여기서 바로 BLOCK하지 않는다. 유예는 lifecycle.
    studentId: string; // 원생 카드. User.id가 아니다.
    status: StudentStatus; // ENROLLED/PAUSED/WITHDRAWN. 전이는 lifecycle.
}): Promise<EnrollmentActionResult> { // 같은 상태면 경로를 다시 읽지 않는다.
    try { // lifecycle throw를 message로.
        const session = await requireDirector(); // 교사 상태 변경 금지.
        if (!session) { // layout 밖.
            return { ok: false, message: "권한이 없습니다." }; // DIRECTOR만.
        }

        const studentId = String(input.studentId ?? "").trim(); // 빈 값이면 Prisma를 치지 않는다.
        const status = input.status; // ENROLLED/PAUSED/WITHDRAWN만. 전이는 lifecycle.

        if (!studentId) { // 화면이 대상을 안 고름.
            return { ok: false, message: "학생 정보가 없습니다." }; // 빈 id.
        }
        if (!(STUDENT_STATUSES as readonly string[]).includes(status)) { // 임의 문자열 거절.
            return { ok: false, message: "학생 상태가 올바르지 않습니다." }; // 전이 테이블 밖.
        }

        const now = new Date(); // 퇴원 당일 유예 컷오프 계산에 쓴다.
        const metadata = await getAuditRequestMetadata(); // lifecycle 감사.

        const result = await prisma.$transaction(async (tx) => { // 전이·이탈 케이스·감사를 한 트랜잭션.
            return transitionStudentStatus(tx, { // 이 파일이 Student.status를 직접 update하지 않는다.
                studentId, // 원생 카드.
                status, // 목표 상태.
                actorUserId: session.user.id, // 원장.
                metadata, // IP·UA.
                now, // 퇴원 당일 유예 컷오프 계산에 쓴다.
            });
        });

        if (!result.changed) { // 같은 상태로의 요청. 경로를 다시 읽지 않는다.
            return { ok: true, message: "이미 같은 상태입니다." }; // 경로를 다시 읽지 않는다.
        }

        revalidateStudentPaths(); // 원생·출석·청구.
        revalidatePath("/director/parents"); // 퇴원 시 연결 후보에서 빠질 수 있다.
        revalidatePath("/director/users"); // 역할 부여 후보.
        revalidatePath("/parent/dashboard"); // 학부모 홈.
        revalidatePath("/parent/attendance"); // 자녀 출결.
        revalidatePath("/parent/grades"); // 자녀 성적.
        revalidatePath("/parent/reports"); // 자녀 리포트.
        revalidatePath("/parent/timetable"); // 자녀 시간표.
        revalidatePath("/student/dashboard"); // 퇴원 유예 동안 학생 홈이 달라질 수 있다.

        const label = STUDENT_STATUS_METADATA[status].label; // 재원/휴원/퇴원.

        return { // 퇴원만 유예 안내 문장.
            ok: true, // 전이는 이미 커밋됨.
            message: // WITHDRAWN이면 당일 24시 로그인 유예.
                status === "WITHDRAWN" // User BLOCK은 크론/lifecycle. 여기서 바로 막지 않는다.
                    ? `${result.student.name} 학생을 퇴원 처리했습니다. 당일 24시까지 로그인과 조회가 가능하며, 이후 계정이 탈퇴 처리됩니다.` // 유예 안내.
                    : `${result.student.name} 학생 상태를 ${label}(으)로 변경했습니다.`, // 재원/휴원.
        };
    } catch (error) { // lifecycle throw 메시지를 UI로.
        console.error(error); // lifecycle throw 메시지를 UI로.
        return { // 부분 저장 없음.
            ok: false, // Screen 에러.
            message: // throw Error면 그 문장.
                error instanceof Error // lifecycle 가드.
                    ? error.message // 전이 거부 사유.
                    : "상태 변경에 실패했습니다.", // 범용.
        };
    }
}
