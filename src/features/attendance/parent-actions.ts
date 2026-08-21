"use server"; // 학부모 쓰기. 목록 읽기는 parent-data. 출석 행은 만들지 않는다.

/**
 * 학부모가 연결된 자녀의 예정 수업에 사유 결석을 신청한다.
 *
 * 호출: `(parent)/parent/attendance/ParentAttendanceScreen.tsx`
 * (`useActionState(requestAbsence)`).
 *
 * AbsenceRequest만 upsert하며 AttendanceRecord는 만들지 않는다.
 * 실제 출결은 담당 교사가 `saveSessionAttendance`로 기록한다.
 *
 * 의도적으로 하지 않는 일:
 * - 지난 수업·CANCELLED 회차에는 신청하지 않는다.
 * - 링크되지 않은 원생 id를 폼에 넣어도 거절한다.
 *
 * 관련: `features/attendance/parent-data.ts`, `features/families/actions.ts`.
 */

import { revalidatePath } from "next/cache"; // 학부모 출결 카드.
import { auth } from "@/lib/auth"; // JWT. GUEST로 떨어진 계정은 PARENT가 아니라 거절.
import { prisma } from "@/lib/db"; // absenceRequest upsert. AttendanceRecord는 안 친다.

/**
 * 결석 신청 폼의 useActionState 상태.
 */
export type AbsenceState = { // Screen 배너. redirect 없음.
    status: "idle" | "error" | "success"; // idle은 초기값만.
    message: string; // 한 문장. 필드 맵 없음.
};

/**
 * 미래 SCHEDULED 회차에 대해 AbsenceRequest를 upsert한다.
 *
 * 재신청 시 `cancelledAt`을 null로 되돌려 취소된 신청을 다시 연다.
 * 출석 행은 건드리지 않는다 — 교사가 공결/결석을 직접 찍는다.
 *
 * @param _prev useActionState 직전 상태.
 * @param formData `studentId`, `sessionId`, `reason`(2~300자).
 * @auth PARENT. 활성 ParentStudentLink 필수.
 * @sideEffects absenceRequest upsert, `/parent/attendance` revalidate.
 */
export async function requestAbsence( // AttendanceRecord를 만들지 않는다. 교사가 출결을 찍는다.
    _prev: AbsenceState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // studentId/sessionId/reason.
): Promise<AbsenceState> { // redirect 없음. Screen이 message를 그린다.
    const session = await auth(); // JWT. layout이 PARENT를 걸렀어도 쓰기는 여기서 다시 본다.
    if (!session?.user?.id || session.user.role !== "PARENT") { // GUEST로 떨어진 계정은 PARENT가 아니라 거절.
        return { status: "error", message: "학부모 로그인이 필요합니다." }; // GUEST로 떨어진 계정은 PARENT가 아니라 거절.
    }

    const studentId = String(formData.get("studentId") ?? "").trim(); // 링크 밖 id는 아래에서 거절.
    const sessionId = String(formData.get("sessionId") ?? "").trim(); // CANCELLED·지난 회차는 거절.
    const reason = String(formData.get("reason") ?? "").trim(); // 출석 상태는 여기서 찍지 않는다.

    if (!studentId || !sessionId) { // 폼이 회차를 안 고름.
        return { status: "error", message: "수업 일정을 선택해 주세요." }; // Prisma를 치지 않는다.
    }
    if (reason.length < 2 || reason.length > 300) { // 빈 사유 거절.
        return { status: "error", message: "사유는 2~300자로 입력해 주세요." }; // 출석 행을 만들지 않는다.
    }

    const link = await prisma.parentStudentLink.findFirst({ // 폼에 타인 원생 id를 넣어도 거절.
        where: { // 해제된 링크도 거절.
            parentUserId: session.user.id, // 세션 학부모.
            studentId, // 폼 자녀.
            endedAt: null, // 폼에 타인 원생 id를 넣어도 거절. 해제된 링크도 거절.
        },
        select: { id: true }, // 존재 여부만.
    });
    if (!link) { // 타인·해제된 자녀.
        return { status: "error", message: "연결된 자녀가 아닙니다." }; // 신청을 만들지 않는다.
    }

    const classSession = await prisma.classSession.findFirst({ // 지난 수업·CANCELLED는 신청 불가.
        where: { // COMPLETED도 거절. SCHEDULED만.
            id: sessionId, // 폼 회차.
            startsAt: { gte: new Date() }, // 지난 수업 거절.
            status: "SCHEDULED", // CANCELLED·COMPLETED는 신청 불가.
            class: { // 이 자녀의 활성 수강만.
                enrollments: { // CANCELLED 수강이면 신청 불가.
                    some: { // 이 자녀.
                        studentId, // 링크된 원생.
                        status: "ACTIVE", // 해제된 수강 거절.
                        endedAt: null, // endedAt이 있으면 명단 밖.
                    },
                },
            },
        },
        select: { id: true }, // 존재 여부만.
    });
    if (!classSession) { // 지난 수업·취소·미수강.
        return { // 출석 행을 만들지 않는다.
            status: "error", // Screen 배너.
            message: "신청 가능한 예정 수업을 찾을 수 없습니다.", // CANCELLED·지난 회차.
        };
    }

    try { // unique(studentId, sessionId) upsert.
        await prisma.absenceRequest.upsert({ // AttendanceRecord가 아니다. 교사가 출결을 찍는다.
            where: { // 재신청은 같은 키.
                studentId_sessionId: { studentId, sessionId }, // unique.
            },
            create: { // 첫 신청.
                studentId, // 링크된 자녀.
                sessionId, // 미래 SCHEDULED.
                requestedBy: session.user.id, // 학부모 User.
                reason, // 2~300자.
            },
            update: { // 재신청. 출석 행은 건드리지 않는다.
                reason, // 사유 갱신.
                requestedBy: session.user.id, // 학부모.
                cancelledAt: null, // 취소했던 신청을 다시 연다. AttendanceRecord는 만들지 않는다.
            },
        });

        revalidatePath("/parent/attendance"); // 신청 힌트 필드.
        return { // 교사가 아직 안 찍음.
            status: "success", // Screen 배너.
            message: // 자동 공결이 아님을 안내.
                "사유 결석이 접수되었습니다. 담당 선생님가 출결 기록 시 확인합니다.", // 신청 ≠ 출석 행.
        };
    } catch { // 스키마 오류는 노출하지 않는다.
        return { status: "error", message: "신청에 실패했습니다." }; // 범용.
    }
}
