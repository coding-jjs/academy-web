"use server"; // 교사·직원 쓰기. 오늘 명단 읽기는 staff-data.

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

import { revalidatePath } from "next/cache"; // 오늘 출결 화면.
import { auth } from "@/lib/auth"; // JWT. 원장·학부모는 이 액션을 타지 않는다.
import { prisma } from "@/lib/db"; // AttendanceRecord upsert. AbsenceRequest는 안 건드린다.
import { userHasPermission } from "@/lib/permission-guard"; // own/other 키. JWT 역할만 보지 않는다.

const ALLOWED = [ // 학부모 AbsenceRequest 상태는 여기 없다. 교사가 직접 찍는다.
    "PRESENT", // 출석. checkInAt을 남긴다.
    "LATE", // 지각. checkInAt을 남긴다.
    "ABSENT", // 결석. 신청과 별개.
    "EXCUSED", // 공결. 신청이 자동 승격되지 않는다.
    "EARLY_LEAVE", // 조퇴. checkOutAt=now.
] as const; // 학부모 AbsenceRequest 상태는 여기 없다. 교사가 직접 찍는다.

type AttendanceStatus = (typeof ALLOWED)[number]; // payload 문자열을 이 집합으로만.

/**
 * 출결 저장 폼의 useActionState 상태.
 * idle은 초기값. 변경이 없으면 success+"변경된 출결이 없음"을 돌려 빈 upsert를 피한다.
 */
export type SaveAttendanceState = { // Screen 배너. redirect 없음.
    status: "idle" | "error" | "success"; // idle은 초기값만.
    message: string; // 저장 건수 또는 사유.
};

function isStatus(value: string): value is AttendanceStatus { // 명단 밖·잘못된 상태는 버린다.
    return (ALLOWED as readonly string[]).includes(value); // PRESENT 등만.
}

async function requireStaffOrTeacher() { // throw 대신 null. 호출 측이 error 상태.
    const session = await auth(); // JWT. TEACHER/STAFF만. 원장·학부모는 이 액션을 타지 않는다.
    if ( // DIRECTOR는 원장 화면. 학부모는 신청만.
        !session?.user?.id || // 세션 없으면 거절.
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF") // 원장·학부모 거절.
    ) { // layout 밖 직접 호출 방어.
        return null; // Screen이 "직원 로그인"을 그린다.
    }
    return session; // updatedBy.
}

async function assertCanEditSession( // own vs other 권한 키. 신청 승격이 아니다.
    userId: string, // 세션 User.id.
    sessionId: string, // ClassSession.id.
): Promise< // 명단 studentId 집합까지.
    | { // 통과.
          ok: true; // 저장 가능.
          teacherUserId: string | null; // 담당. 미지정 반은 other 키.
          allowedStudentIds: Set<string>; // 수강 명단. payload 밖 id는 버린다.
      }
    | { ok: false; message: string } // 권한·없는 회차.
> { // CANCELLED 여부는 저장 가드가 아니라 화면 where.
    const classSession = await prisma.classSession.findFirst({ // 회차·담당·명단.
        where: { id: sessionId }, // CANCELLED 여부는 저장 가드가 아니라 화면 where.
        select: { // enrollments는 활성만.
            id: true, // 존재 여부.
            class: { // 담당과 명단.
                select: { // own vs other.
                    teacherUserId: true, // own vs other 권한 키를 가르는 담당.
                    enrollments: { // 명단 밖 id는 아래에서 버린다.
                        where: { status: "ACTIVE", endedAt: null }, // 해제된 수강생은 저장 대상이 아니다.
                        select: { studentId: true }, // Set.
                    },
                },
            },
        },
    });

    if (!classSession) { // 없는 sessionId.
        return { ok: false, message: "수업을 찾을 수 없습니다." }; // upsert하지 않는다.
    }

    const isOwnClass = classSession.class.teacherUserId === userId; // 미지정이면 false → other 키.

    if (isOwnClass) { // 담당반.
        const allowed = await userHasPermission( // JWT 역할만 보지 않고 PermissionGrant를 다시 읽는다.
            userId, // 교사·직원.
            "ownClassAttendanceGrade", // JWT 역할만 보지 않고 PermissionGrant를 다시 읽는다.
        );
        if (!allowed) { // 프리셋이 꺼져 있으면 거절.
            return { // 저장하지 않는다.
                ok: false, // Screen 메시지.
                message: // 원장 권한 화면으로 유도.
                    "담당반 출결 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요.", // own 키.
            };
        }
    } else { // 타반·담당 미지정.
        const allowed = await userHasPermission( // other 키.
            userId, // 교사·직원.
            "otherTeacherAttendanceGrade", // 타 선생님 반.
        );
        if (!allowed) { // 교사 기본 프리셋은 보통 false.
            return { // 저장하지 않는다.
                ok: false, // Screen 메시지.
                message: // 원장 권한 화면.
                    "타 선생님반 출결 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요.", // other 키.
            };
        }
    }

    return { // 명단 Set.
        ok: true, // 저장 가능.
        teacherUserId: classSession.class.teacherUserId, // 호출 측은 안 쓰지만 판정 기록.
        allowedStudentIds: new Set( // payload 필터.
            classSession.class.enrollments.map((e) => e.studentId), // 명단 밖 id는 아래에서 버린다.
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
export async function saveSessionAttendance( // 학부모 신청을 출석 행으로 승격하지 않는다.
    _prev: SaveAttendanceState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // sessionId + payload JSON.
): Promise<SaveAttendanceState> { // 변경 없으면 빈 upsert를 피한다.
    const session = await requireStaffOrTeacher(); // 원장·학부모 거절.
    if (!session) { // layout 밖.
        return { status: "error", message: "직원 로그인이 필요합니다." }; // DIRECTOR는 이 액션이 아니다.
    }

    const sessionId = String(formData.get("sessionId") ?? "").trim(); // ClassSession.id.
    const payloadRaw = String(formData.get("payload") ?? "").trim(); // 학부모 결석 신청은 이 payload가 아니다.
    if (!sessionId || !payloadRaw) { // 빈 저장.
        return { status: "error", message: "저장할 출결 정보가 없습니다." }; // JSON을 파싱하지 않는다.
    }

    let rows: { studentId: string; status: string }[] = []; // 파싱 전 빈 배열.
    try { // JSON.parse. 형식이 아니면 거절.
        rows = JSON.parse(payloadRaw) as { // 화면이 만든 배열.
            studentId: string; // 명단 밖은 아래에서 버림.
            status: string; // ALLOWED만.
        }[]; // 캐스팅. Array.isArray로 한 번 더 본다.
    } catch { // 깨진 JSON.
        return { // upsert하지 않는다.
            status: "error", // Screen 배너.
            message: "출결 데이터 형식이 올바르지 않습니다.", // 파싱 실패.
        };
    }

    if (!Array.isArray(rows) || rows.length === 0) { // 객체 payload 거절.
        return { status: "error", message: "저장할 학생이 없습니다." }; // 빈 배열.
    }

    const access = await assertCanEditSession(session.user.id, sessionId); // own/other.
    if (!access.ok) { // 권한·없는 회차.
        return { status: "error", message: access.message }; // 원장에게 권한 요청 문구.
    }

    const validRows = Array.from( // 명단 안 + ALLOWED. 같은 학생은 마지막 값.
        new Map( // studentId 키로 중복 제거.
            rows // 화면 payload.
                .filter( // 수강 명단 밖·잘못된 상태는 버린다.
                    (row) => // 한 줄.
                        access.allowedStudentIds.has(row.studentId) && // 명단 밖 버림.
                        isStatus(row.status), // 수강 명단 밖·잘못된 상태는 버린다.
                )
                .map((row) => [row.studentId, row] as const), // 같은 학생은 마지막 값만.
        ).values(), // Map values.
    ) as { studentId: string; status: AttendanceStatus }[]; // isStatus가 좁힘.

    if (validRows.length === 0) { // 전부 명단 밖이거나 잘못된 상태.
        return { status: "error", message: "저장할 학생이 없습니다." }; // upsert하지 않는다.
    }

    const existingRecords = await prisma.attendanceRecord.findMany({ // 기존 시각을 유지해 재저장이 덮지 않게.
        where: { // 이 회차·이 학생들만.
            sessionId, // unique 키의 한쪽.
            studentId: { in: validRows.map((row) => row.studentId) }, // 유효 행만.
        },
        select: { // 상태 비교·checkInAt 유지.
            studentId: true, // 맵 키.
            status: true, // 같으면 upsert 안 함.
            checkInAt: true, // 기존 시각을 유지해 재저장이 덮지 않게.
        },
    });
    const existingByStudent = new Map( // studentId → 행.
        existingRecords.map((record) => [record.studentId, record]), // 조회용.
    );
    const changedRows = validRows.filter( // 상태가 같으면 upsert하지 않아 빈 행·시각 덮어쓰기를 막는다.
        (row) => existingByStudent.get(row.studentId)?.status !== row.status, // 상태가 같으면 upsert하지 않아 빈 행·시각 덮어쓰기를 막는다.
    );

    if (changedRows.length === 0) { // 화면이 다시 저장해도 빈 upsert를 피한다.
        return { status: "success", message: "변경된 출결이 없습니다." }; // 성공으로 돌려 에러 배너를 안 연다.
    }

    const now = new Date(); // 첫 출석·조퇴 시각.

    try { // 트랜잭션으로 한 회차만.
        await prisma.$transaction( // 변경 행마다 upsert.
            changedRows.map((row) => { // PRESENT/LATE만 checkInAt.
                const existing = existingByStudent.get(row.studentId); // 없으면 신규.
                const checkInAt = // 결석·공결·조퇴는 null.
                    row.status === "PRESENT" || row.status === "LATE" // 출석·지각만 시각.
                        ? (existing?.checkInAt ?? now) // 출석·지각만 시각. 기존 값이 있으면 유지.
                        : null; // ABSENT/EXCUSED/EARLY_LEAVE.

                return prisma.attendanceRecord.upsert({ // 신청 행이 아니다.
                    where: { // unique(studentId, sessionId).
                        studentId_sessionId: { // 복합 unique.
                            studentId: row.studentId, // 명단 안.
                            sessionId, // unique(studentId, sessionId).
                        },
                    },
                    create: { // 첫 저장.
                        studentId: row.studentId, // 명단 안.
                        sessionId, // 이 회차.
                        status: row.status, // ALLOWED.
                        checkInAt, // 출석·지각만.
                        updatedBy: session.user.id, // 교사·직원.
                    },
                    update: { // 상태 변경.
                        status: row.status, // 새 상태.
                        checkInAt, // 기존 시각 유지 또는 null.
                        checkOutAt: row.status === "EARLY_LEAVE" ? now : null, // 조퇴만 퇴실 시각.
                        updatedBy: session.user.id, // 교사·직원.
                    },
                });
            }),
        );

        revalidatePath("/teacher/attendance"); // 오늘 명단.
        return { // 건수 안내.
            status: "success", // Screen 배너.
            message: `${changedRows.length}명의 출결이 저장되었습니다.`, // 변경분만.
        };
    } catch { // 스키마 오류는 노출하지 않는다.
        return { status: "error", message: "출결 저장에 실패했습니다." }; // 범용.
    }
}
