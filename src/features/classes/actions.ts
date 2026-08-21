"use server"; // 원장 쓰기. 목록 읽기는 classes/data.

/**
 * 원장 반 CRUD와 수업 회차 생성·취소를 처리한다.
 *
 * 호출: `features/classes/components/ClassEditor.tsx`가 create/update/session 액션을 부른다.
 * 회차 시각은 datetime-local을 `+09:00`(KST)로 해석하고,
 * 취소는 행 삭제가 아니라 CANCELLED다 (출석·시간표 이력 보존).
 * 담당 교사는 TEACHER/STAFF ACTIVE만 지정할 수 있다.
 *
 * 의도적으로 하지 않는 일:
 * - Class.schedule Json 반복 슬롯을 편집하지 않는다. 화면 그리드는 ClassSession.
 * - 교사 본인이 반을 만들게 하지 않는다 → DIRECTOR만.
 *
 * 관련: `features/classes/date-time.ts`, `features/classes/data.ts`.
 */

import { revalidatePath } from "next/cache"; // 반·출석·시간표. 그리드는 ClassSession.
import { auth } from "@/lib/auth"; // JWT. 교사는 이 액션을 타지 않는다.
import { prisma } from "@/lib/db"; // Class·ClassSession. schedule Json은 빈 객체.

/**
 * 반/회차 액션 결과. 성공 시 생성 id를 넘기면 화면이 그 반을 선택한다.
 */
export type ClassesActionResult = // Screen 피드백. redirect 없음.
    | { ok: true; message: string; id?: string } // 생성 직후 그 반을 열어 회차를 넣게 id를 준다.
    | { ok: false; message: string }; // 권한·검증 실패.

async function requireDirector() { // throw 대신 null. 호출 측이 { ok: false }.
    const session = await auth(); // JWT. 원장만 반·회차를 쓴다. 교사는 이 액션을 타지 않는다.
    if (!session?.user?.id || session.user.role !== "DIRECTOR") { // 교사 본인이 반을 만들지 못하게.
        return null; // Screen이 "원장 권한이 필요합니다"를 그린다.
    }
    return session; // 이후 가드에 쓸 세션.
}

function revalidateClasses() { // 시간표는 ClassSession. schedule Json이 아니다.
    revalidatePath("/director/classes"); // 반 관리 Screen.
    revalidatePath("/director/students"); // 수강 인원·반 이름.
    revalidatePath("/teacher/attendance"); // 오늘 회차 명단.
    revalidatePath("/teacher/dashboard"); // 오늘 수업.
    revalidatePath("/employee/dashboard"); // 직원 홈.
    revalidatePath("/parent/timetable"); // 그리드는 ClassSession.
    revalidatePath("/student/timetable"); // 그리드는 ClassSession.
}

/** datetime-local 값(YYYY-MM-DDTHH:mm)을 KST로 해석 */
function parseKstDateTime(value: string): Date | null { // 브라우저 local이 아니라 +09:00 Instant.
    const trimmed = String(value ?? "").trim(); // 빈 값이면 아래에서 형식 불일치.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return null; // 초·타임존이 붙은 값은 거절.
    const date = new Date(`${trimmed}:00+09:00`); // 브라우저 local이 아니라 학원 표준시 Instant.
    if (Number.isNaN(date.getTime())) return null; // 달력상 없는 날짜.
    return date; // ClassSession.startsAt/endsAt.
}

/**
 * 활성 반을 하나 만든다. schedule Json은 빈 객체(반복 슬롯 미사용).
 *
 * @param input.name 1~80자, input.subject 1~60자, input.teacherUserId 선택.
 * @auth DIRECTOR.
 * @sideEffects Class create, 시간표·출석 경로 revalidate.
 */
export async function createClass(input: { // 교사 본인이 반을 만들지 않는다.
    name: string; // 1~80자.
    subject: string; // 1~60자.
    teacherUserId?: string | null; // 미지정 허용. DIRECTOR는 담당 후보가 아니다.
}): Promise<ClassesActionResult> { // 화면 그리드는 ClassSession. schedule은 빈 객체.
    const session = await requireDirector(); // 교사는 거절.
    if (!session) { // layout 밖.
        return { ok: false, message: "원장 권한이 필요합니다." }; // DIRECTOR만.
    }

    const name = String(input.name ?? "").trim(); // 반 이름.
    const subject = String(input.subject ?? "").trim(); // 과목.
    const teacherUserId = input.teacherUserId?.trim() || null; // 미지정 허용. 출결 own/other는 나중에 담당으로 판정.

    if (!name || name.length > 80) { // 빈 이름 거절.
        return { ok: false, message: "반 이름을 1~80자로 입력해 주세요." }; // 부분 저장 없음.
    }
    if (!subject || subject.length > 60) { // 빈 과목 거절.
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." }; // 부분 저장 없음.
    }

    if (teacherUserId) { // 비우면 담당 미지정. DIRECTOR id는 거절.
        const teacher = await prisma.user.findFirst({ // ACTIVE TEACHER/STAFF만.
            where: { // DIRECTOR는 담당 후보가 아니다.
                id: teacherUserId, // 폼 select.
                role: { in: ["TEACHER", "STAFF"] }, // DIRECTOR는 담당 후보가 아니다.
                status: "ACTIVE", // BLOCKED는 담당으로 안 둔다.
            },
            select: { id: true }, // 존재 여부만.
        });
        if (!teacher) { // 없거나 원장/학부모.
            return { ok: false, message: "담당 선생님를 찾을 수 없습니다." }; // create하지 않는다.
        }
    }

    const row = await prisma.class.create({ // schedule Json은 빈 객체. 그리드는 ClassSession.
        data: { // 반복 슬롯을 여기서 편집하지 않는다.
            name, // 1~80자.
            subject, // 1~60자.
            teacherUserId, // null이면 담당 미지정.
            active: true, // 비활성은 updateClass.
            schedule: {}, // 빈 객체. 화면 그리드는 ClassSession이지 반복 슬롯이 아니다.
        },
        select: { id: true }, // Screen이 그 반을 선택하게.
    });

    revalidateClasses(); // 시간표는 아직 회차가 없어 빈 그리드.
    return { ok: true, id: row.id, message: "반을 만들었습니다." }; // 생성 직후 회차 폼을 연다.
}

/**
 * 반 이름·과목·담당·활성 여부를 저장한다. 회차는 건드리지 않는다.
 *
 * 비활성 반에는 이후 `createClassSession`이 거절한다.
 * @auth DIRECTOR.
 */
export async function updateClass(input: { // 회차 CANCELLED는 cancelClassSession.
    classId: string; // 기존 반.
    name: string; // 1~80자.
    subject: string; // 1~60자.
    teacherUserId?: string | null; // 미지정 허용.
    active: boolean; // false면 이후 회차 생성이 거절. 기존 회차는 남긴다.
}): Promise<ClassesActionResult> { // schedule Json은 건드리지 않는다.
    const session = await requireDirector(); // 교사 수정 금지.
    if (!session) { // layout 밖.
        return { ok: false, message: "원장 권한이 필요합니다." }; // DIRECTOR만.
    }

    const classId = String(input.classId ?? "").trim(); // 빈 id면 Prisma를 치지 않는다.
    const name = String(input.name ?? "").trim(); // 반 이름.
    const subject = String(input.subject ?? "").trim(); // 과목.
    const teacherUserId = input.teacherUserId?.trim() || null; // 빈 문자열은 미지정.

    if (!classId) return { ok: false, message: "반 ID가 없습니다." }; // 생성 모드 id가 아님.
    if (!name || name.length > 80) { // 빈 이름.
        return { ok: false, message: "반 이름을 1~80자로 입력해 주세요." }; // 부분 저장 없음.
    }
    if (!subject || subject.length > 60) { // 빈 과목.
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." }; // 부분 저장 없음.
    }

    const existing = await prisma.class.findUnique({ // 없는 반을 갱신하지 않는다.
        where: { id: classId }, // 편집기 key.
        select: { id: true }, // 존재 여부만.
    });
    if (!existing) return { ok: false, message: "반을 찾을 수 없습니다." }; // 삭제된 id.

    if (teacherUserId) { // 미지정이면 이 가드를 건너뛴다.
        const teacher = await prisma.user.findFirst({ // ACTIVE TEACHER/STAFF만.
            where: { // DIRECTOR id 거절.
                id: teacherUserId, // 폼 select.
                role: { in: ["TEACHER", "STAFF"] }, // 원장은 담당 후보가 아니다.
                status: "ACTIVE", // BLOCKED 거절.
            },
            select: { id: true }, // 존재 여부만.
        });
        if (!teacher) { // 잘못된 담당.
            return { ok: false, message: "담당 선생님를 찾을 수 없습니다." }; // update하지 않는다.
        }
    }

    await prisma.class.update({ // 회차는 건드리지 않는다.
        where: { id: classId }, // 기존 반.
        data: { // schedule Json은 그대로.
            name, // 1~80자.
            subject, // 1~60자.
            teacherUserId, // 출결 own/other 판정.
            active: Boolean(input.active), // false면 이후 회차 생성이 거절된다. 기존 회차는 남긴다.
        },
    });

    revalidateClasses(); // 출석 담당 이름·시간표 라벨.
    return { ok: true, id: classId, message: "반 정보를 저장했습니다." }; // 같은 반을 선택된 채로.
}

/**
 * SCHEDULED 회차를 하나 만든다. 시작·종료는 KST datetime-local 문자열.
 *
 * 같은 반+시작 시각 unique 충돌은 사용자에게 "이미 있을 수 있음"으로 돌려준다.
 * @auth DIRECTOR. 활성 반만.
 */
export async function createClassSession(input: { // 시간표 그리드 본체. schedule Json이 아니다.
    classId: string; // 활성 반만.
    startsAt: string; // datetime-local. 서버가 +09:00을 붙인다.
    endsAt: string; // datetime-local.
    classroom?: string | null; // 선택.
}): Promise<ClassesActionResult> { // CANCELLED가 아니라 SCHEDULED.
    const session = await requireDirector(); // 교사가 회차를 만들지 못하게.
    if (!session) { // layout 밖.
        return { ok: false, message: "원장 권한이 필요합니다." }; // DIRECTOR만.
    }

    const classId = String(input.classId ?? "").trim(); // 생성 직후 반 id.
    const classroom = String(input.classroom ?? "").trim() || null; // 빈 문자열은 null.
    const startsAt = parseKstDateTime(input.startsAt); // datetime-local → +09:00 Instant. 브라우저 타임존과 무관.
    const endsAt = parseKstDateTime(input.endsAt); // 같은 KST 해석.

    if (!classId) return { ok: false, message: "반을 선택해 주세요." }; // 생성 모드에서 회차를 넣지 않는다.
    if (!startsAt || !endsAt) { // 형식 불일치.
        return { // Prisma를 치지 않는다.
            ok: false, // Screen 에러.
            message: "시작·종료 시각 형식이 올바르지 않습니다.", // YYYY-MM-DDTHH:mm만.
        };
    }
    if (endsAt <= startsAt) { // 같은 시각·역순 거절.
        return { ok: false, message: "종료 시각은 시작보다 늦어야 합니다." }; // 0분 수업 금지.
    }

    const classRow = await prisma.class.findFirst({ // 비활성 반은 거절. 기존 회차는 남긴다.
        where: { id: classId, active: true }, // 비활성 반에는 새 수업을 안 붙인다.
        select: { id: true }, // 존재 여부만.
    });
    if (!classRow) { // 없거나 비활성.
        return { ok: false, message: "활성 반만 수업을 추가할 수 있습니다." }; // create하지 않는다.
    }

    try { // unique(반+시작) 충돌은 catch.
        const row = await prisma.classSession.create({ // 시간표·출석이 이 행을 읽는다.
            data: { // 반복 슬롯이 아니다.
                classId, // 활성 반.
                startsAt, // +09:00 Instant.
                endsAt, // +09:00 Instant.
                classroom, // 선택.
                status: "SCHEDULED", // unique(반+시작) 충돌은 catch에서 안내.
            },
            select: { id: true }, // 화면이 새 회차를 목록에 넣게.
        });

        revalidateClasses(); // parent/student timetable 그리드.
        return { ok: true, id: row.id, message: "수업을 등록했습니다." }; // 출석 명단은 그날 이후.
    } catch { // unique 충돌을 스키마 오류로 노출하지 않는다.
        return { // 같은 시작 시각.
            ok: false, // Screen 에러.
            message: // unique(반+시작).
                "수업 등록에 실패했습니다. 같은 시작 시각의 수업이 이미 있을 수 있습니다.", // unique 안내.
        };
    }
}

/**
 * 회차를 CANCELLED로 남긴다. delete하지 않아 출석 행·학부모 시간표 이력이 깨지지 않는다.
 *
 * 이미 CANCELLED면 실패. COMPLETED도 취소 가능(상태만 덮음).
 * @auth DIRECTOR.
 */
export async function cancelClassSession(input: { // 행 삭제가 아니다. 시간표 data는 CANCELLED를 안 가져온다.
    sessionId: string; // ClassSession.id.
}): Promise<ClassesActionResult> { // 출석 행은 학생에 남는다.
    const session = await requireDirector(); // 교사가 회차를 지우지 못하게.
    if (!session) { // layout 밖.
        return { ok: false, message: "원장 권한이 필요합니다." }; // DIRECTOR만.
    }

    const sessionId = String(input.sessionId ?? "").trim(); // 빈 값이면 Prisma를 치지 않는다.
    if (!sessionId) return { ok: false, message: "수업 ID가 없습니다." }; // 편집기 버튼 id.

    const row = await prisma.classSession.findUnique({ // 없는 회차·이미 취소.
        where: { id: sessionId }, // 취소 버튼 sessionId.
        select: { id: true, status: true }, // CANCELLED면 거절.
    });
    if (!row) return { ok: false, message: "수업을 찾을 수 없습니다." }; // 없는 id.
    if (row.status === "CANCELLED") { // 이미 취소. 이력 덮어쓰기 아님.
        return { ok: false, message: "이미 취소된 수업입니다." }; // delete가 아니라 상태만.
    }

    await prisma.classSession.update({ // 삭제 금지. 출석 행·학부모 시간표 이력을 보존한다.
        where: { id: row.id }, // 방금 찾은 행.
        data: { status: "CANCELLED" }, // 삭제 금지. 출석 행·학부모 시간표 이력을 보존한다.
    });

    revalidateClasses(); // 오늘 출석 명단에서 빠짐.
    return { ok: true, message: "수업을 취소했습니다." }; // 편집기는 취소 이력을 남긴다.
}
