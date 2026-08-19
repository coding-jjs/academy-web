"use server"; // 교사·직원 쓰기. 목록 읽기는 staff-data.

/**
 * 교사·직원이 스코프 안 학생에게 학습 기록(수업/숙제/생활)을 남긴다.
 *
 * 호출: `(teacher)/teacher/students/components/LearningRecordForm.tsx`
 * (`useActionState(createLearningRecord)`).
 *
 * 학생·반은 `staff-scope`로 막으며, 반이 비어 있으면 반 없이 기록만 생성한다.
 * `viewAllStudents`가 없으면 담당반 수강생만 고를 수 있다.
 *
 * 의도적으로 하지 않는 일:
 * - 원장 경로를 쓰지 않는다. 원장 원생 화면은 상담 등 다른 액션.
 * - 기록을 수정·삭제하지 않는다. create만.
 *
 * 관련: `lib/staff-scope.ts`, `features/students/presentation.ts`의 타입 라벨.
 */

import { revalidatePath } from "next/cache"; // teacher/employee students 워크스페이스.
import { auth } from "@/lib/auth"; // JWT. 원장/학부모는 error.
import { prisma } from "@/lib/db"; // learningRecord create만. update/delete 액션은 없다.
import { // viewAllStudents가 없으면 담당반만.
    classScopeWhere, // 반 id가 스코프 밖이면 거절.
    getStaffScope, // PermissionGrant + 담당반.
    studentScopeWhere, // 원생 id가 스코프 밖이면 거절.
} from "@/lib/staff-scope"; // 페이지 where와 같은 스코프.

const RECORD_TYPES = ["CLASS_NOTE", "HOMEWORK", "LIFE_RECORD"] as const; // 상담 메모와 다른 테이블. create만.

/**
 * 학습기록 폼의 useActionState 상태.
 * idle은 초기값. 이 액션은 error/success만 반환한다.
 */
export type LearningRecordState = { // Screen이 배너로 그린다. redirect 없음.
    status: "idle" | "error" | "success"; // idle은 초기값만.
    message: string; // 필드 맵이 아니라 한 문장.
};

/**
 * LearningRecord 한 건을 생성한다.
 *
 * @param _prev useActionState 직전 상태. 서버는 폼만 본다.
 * @param formData studentId, type, title, content, 선택 classId·recordDate.
 * @returns 검증/권한 실패 또는 성공 메시지. redirect하지 않는다.
 * @auth TEACHER 또는 STAFF. 원장/학부모는 error.
 * @sideEffects learningRecord create, teacher/employee students 경로 revalidate.
 */
export async function createLearningRecord( // 수정·삭제가 아니다. 스코프 밖 원생 id는 거절.
    _prev: LearningRecordState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // studentId/type/title/content. classId·recordDate는 선택.
): Promise<LearningRecordState> { // redirect 없음. Screen이 message를 그린다.
    const session = await auth(); // JWT. layout이 TEACHER/STAFF를 걸렀어도 쓰기는 여기서 다시 본다.
    if ( // 원장·학부모는 이 액션을 타지 않는다.
        !session?.user?.id || // 세션 없으면 거절.
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF") // DIRECTOR는 상담 등 다른 액션.
    ) { // 원장 원생 화면은 이 create를 쓰지 않는다.
        return { status: "error", message: "직원 로그인이 필요합니다." }; // 원장·학부모는 이 액션을 타지 않는다.
    }

    const studentId = String(formData.get("studentId") ?? "").trim(); // 스코프 밖 id는 아래에서 거절.
    const classId = String(formData.get("classId") ?? "").trim() || null; // 비우면 반 없이 기록만.
    const type = String(formData.get("type") ?? "").trim(); // CLASS_NOTE/HOMEWORK/LIFE_RECORD만.
    const title = String(formData.get("title") ?? "").trim(); // 2~80자.
    const content = String(formData.get("content") ?? "").trim(); // 2~2000자.
    const recordDateRaw = String(formData.get("recordDate") ?? "").trim(); // 브라우저 date input. 서버 KST Instant가 아님.

    if (!studentId) { // 폼이 원생을 안 고름.
        return { status: "error", message: "학생을 선택해 주세요." }; // Prisma를 치지 않는다.
    }
    if (!(RECORD_TYPES as readonly string[]).includes(type)) { // 상담 메모 타입을 여기 넣지 않는다.
        return { status: "error", message: "기록 유형이 올바르지 않습니다." }; // 허용 enum 밖.
    }
    if (title.length < 2 || title.length > 80) { // 화면 maxlength와 맞춘다.
        return { status: "error", message: "제목은 2~80자로 입력해 주세요." }; // 부분 저장 없음.
    }
    if (content.length < 2 || content.length > 2000) { // 본문.
        return { status: "error", message: "내용은 2~2000자로 입력해 주세요." }; // 부분 저장 없음.
    }

    const recordDate = recordDateRaw ? new Date(recordDateRaw) : new Date(); // 비우면 지금. 회차 Instant와 혼동하지 않는다.
    if (Number.isNaN(recordDate.getTime())) { // date input 파싱 실패.
        return { status: "error", message: "기록 날짜가 올바르지 않습니다." }; // Invalid Date 거절.
    }

    const scope = await getStaffScope(session.user.id); // viewAllStudents가 없으면 담당반만.

    const student = await prisma.student.findFirst({ // 휴원/퇴원·스코프 밖은 거절.
        where: { // 폼에 숨긴 id를 넣어도 staff-scope가 막는다.
            id: studentId, // 폼 studentId.
            status: "ENROLLED", // 휴원/퇴원에는 학습기록을 남기지 않는다.
            ...studentScopeWhere(scope), // 스코프 밖 원생 id를 폼에 넣어도 거절.
        },
        select: { id: true }, // 존재 여부만.
    });

    if (!student) { // 휴원·타반 수강생.
        return { status: "error", message: "기록 가능한 학생이 아닙니다." }; // create하지 않는다.
    }

    if (classId) { // 비우면 반 없이 기록만. 타반 id는 거절.
        const ownedOrAllowed = await prisma.class.findFirst({ // 비활성 반도 거절.
            where: { // classScopeWhere가 viewAll vs 담당반.
                id: classId, // 폼 classId.
                active: true, // 비활성 반에는 기록을 묶지 않는다.
                ...classScopeWhere(scope), // 타반 id를 숨겨 넣어도 거절.
            },
            select: { id: true }, // 존재 여부만.
        });

        if (!ownedOrAllowed) { // 타반·비활성.
            return { status: "error", message: "선택할 수 없는 반입니다." }; // 타반 id를 숨겨 넣어도 거절.
        }
    }

    try { // unique/연결 오류는 범용 메시지.
        await prisma.learningRecord.create({ // create만. 수정·삭제 액션은 없다.
            data: { // 상담 테이블이 아니다.
                studentId, // 스코프 안 재원.
                classId, // null이면 반 없이 기록만.
                authorUserId: session.user.id, // 교사·직원.
                type: type as (typeof RECORD_TYPES)[number], // 위에서 includes로 좁힘.
                title, // 2~80자.
                content, // 2~2000자.
                recordDate, // 브라우저 date 또는 now.
            },
        });
        revalidatePath("/teacher/students"); // 교사 워크스페이스 최근 기록.
    revalidatePath("/employee/students"); // 직원 워크스페이스. 들여쓰기는 기존과 같다.
        return { status: "success", message: "학습 기록이 등록되었습니다." }; // redirect 없음.
    } catch { // 스키마 오류는 노출하지 않는다.
        return { status: "error", message: "기록 등록에 실패했습니다." }; // 범용.
    }
}
