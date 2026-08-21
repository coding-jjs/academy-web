"use server"; // Server Action. 브라우저가 직접 Prisma를 치지 않는다.

/**
 * 직원·원장 상담 메모 작성과 문의 상태 변경.
 *
 * 호출: `CounselingMemoPanel`이 createCounselingMemo,
 * `DirectorStudentCounseling`이 createDirectorCounselingMemo,
 * `InquiryManagementPanel`이 updateInquiryStatus를 제출한다.
 *
 * 직원은 editLifeCounseling과 스코프 안 재원생만, 원장은 전 학생에 메모를 남긴다.
 * 문의 상태 변경은 STAFF만 — 교사는 상담 메모만 작성한다.
 *
 * 의도적으로 하지 않는 일:
 * - 게스트 문의 생성 → `inquiries/actions.ts`.
 * - 메모 수정·삭제. 추가만 한다.
 *
 * 관련: `staff-data.ts`, `director-data.ts`.
 */

import { revalidatePath } from "next/cache"; // 상담 화면 캐시. 게스트 문의 폼은 안 건드린다.
import { auth } from "@/lib/auth"; // JWT 세션. 직원 vs 원장 액션을 나눈다.
import { prisma } from "@/lib/db"; // server-only Prisma. 메모 추가·문의 상태만.
import { userHasPermission } from "@/lib/permission-guard"; // editLifeCounseling. 역할만으로는 부족.
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope"; // 직원 재원생. 원장은 스코프를 안 본다.

/** `useActionState`가 매 제출마다 주고받는 UI 상태. idle은 초기값이며 이 파일은 직접 반환하지 않는다. */
export type CounselingActionState = { // 메모·문의 UI. 게스트 InquiryState 필드 맵이 아니다.
    status: "idle" | "error" | "success"; // idle은 초기값. 이 Action은 error/success를 반환한다.
    message: string; // 화면 문장. 필드 에러 맵이 아니다.
};

async function requireStaff() { // TEACHER | STAFF만. 원장은 createDirectorCounselingMemo.
    const session = await auth(); // JWT. TEACHER | STAFF만 직원 액션을 탄다.
    if ( // 원장·학부모는 직원 상담 액션을 타지 않는다.
        !session?.user?.id || // 세션 없으면 쓰지 않는다.
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF") // 원장은 별도 액션.
    ) { // 역할 가드 본문.
        return null; // 원장·학부모는 직원 상담 액션을 타지 않는다.
    }
    return session; // 교사·사무. GUEST createInquiry와 나눈다.
}

function parseCounselingMemoInput(formData: FormData): { // 직원·원장 공통 파싱. 게스트 문의 필드가 아니다.
    studentId: string; // 원생 카드. 스코프 검사는 액션에서 한다.
    content: string; // 2~2000자.
    counseledAt: Date; // datetime-local. 미래 +60초 거절.
} | { error: string } { // 필드 맵이 아니라 한 문장.
    const studentId = String(formData.get("studentId") ?? "").trim(); // 원생 카드. userId가 아니다.
    const content = String(formData.get("content") ?? "").trim(); // 상담 본문.
    const counseledAtRaw = String(formData.get("counseledAt") ?? "").trim(); // datetime-local. 비면 지금.

    if (!studentId) { // 스코프 검사는 액션에서 한다.
        return { error: "학생을 선택해 주세요." }; // 스코프 검사는 액션에서 한다.
    }
    if (content.length < 2 || content.length > 2000) { // 한 글자 메모를 막는다.
        return { error: "상담 내용은 2~2000자로 입력해 주세요." }; // 한 글자 메모를 막는다.
    }

    const counseledAt = counseledAtRaw ? new Date(counseledAtRaw) : new Date(); // 일시가 비면 지금.
    if (Number.isNaN(counseledAt.getTime())) { // 파싱 실패.
        return { error: "상담 일시가 올바르지 않습니다." }; // datetime-local 형식.
    }
    if (counseledAt.getTime() > Date.now() + 60_000) { // 시계 오차 1분 허용.
        return { error: "미래 일시로는 등록할 수 없습니다." }; // 시계 오차 1분 허용. datetime-local 기본값이 서버보다 조금 미래일 수 있다.
    }

    return { studentId, content, counseledAt }; // 액션이 스코프·권한을 이어서 본다.
}

/**
 * 교사·직원이 스코프 안 재원생에게 상담 메모를 남긴다.
 * editLifeCounseling이 없으면 거절한다. 원장 전용 액션과 경로를 나눈다.
 */
export async function createCounselingMemo( // 원장 createDirectorCounselingMemo와 나눈다.
    _prev: CounselingActionState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // studentId/content/counseledAt. 문의 상태가 아니다.
): Promise<CounselingActionState> { // 수정·삭제는 없다. 추가만.
    const session = await requireStaff(); // 교사·직원만. 원장은 createDirectorCounselingMemo를 탄다.
    if (!session) { // 원장·학부모·GUEST 거절.
        return { status: "error", message: "직원 로그인이 필요합니다." }; // 원장 액션과 경로를 나눈다.
    }

    const canEdit = await userHasPermission( // 역할만으로는 부족.
        session.user.id, // 권한 행. 꺼진 직원은 메모를 남기지 못한다.
        "editLifeCounseling", // 역할만으로는 부족. 꺼진 직원은 메모를 남기지 못한다.
    );
    if (!canEdit) { // 꺼진 직원. 원장 부여를 요청.
        return { // 메모 행을 만들지 않는다.
            status: "error", // 필드 에러가 아니라 권한 에러.
            message: // 원장 권한 화면으로 유도.
                "생활 상담 기록 권한이 없습니다. 원장에게 권한 부여를 요청하세요.", // 스코프 안이어도 권한이 꺼지면 거절.
        };
    }

    const parsed = parseCounselingMemoInput(formData); // 공통 파싱. 스코프는 아래에서.
    if ("error" in parsed) { // 검증 실패. DB를 안 친다.
        return { status: "error", message: parsed.error }; // 한 문장. 필드 맵이 아니다.
    }

    const { studentId, content, counseledAt } = parsed; // 스코프 검사 전 값.
    const scope = await getStaffScope(session.user.id); // 직원 범위. 원장은 이 함수를 안 탄다.

    const student = await prisma.student.findFirst({ // 재원생만. 퇴원생 메모는 원장 액션.
        where: { // 스코프 밖이면 못 찾는다.
            id: studentId, // 원생 카드.
            status: "ENROLLED", // 직원은 재원생만. 퇴원생 메모는 원장 액션으로 보낸다.
            ...studentScopeWhere(scope), // 스코프 안. 원장은 이 where가 없다.
        },
        select: { id: true }, // 존재만. 문의 행이 아니다.
    });

    if (!student) { // 스코프 밖·퇴원·없는 id.
        return { // 메모 행을 만들지 않는다.
            status: "error", // 스코프 밖을 권한 문구와 구분.
            message: "상담 가능한 학생을 찾을 수 없습니다.", // 퇴원생은 원장 액션.
        };
    }

    try { // 추가만. 수정·삭제는 없다.
        await prisma.counselingMemo.create({ // 게스트 문의 create가 아니다.
            data: { // 작성자 세션. 문의 assignedUserId와 다르다.
                studentId, // 재원생 카드.
                authorUserId: session.user.id, // 교사 onlyOwnMemos가 이 키로 본인분만 본다.
                content, // 2~2000자.
                counseledAt, // 미래 +60초는 위에서 거절.
            },
        });
        revalidatePath("/teacher/counseling"); // 교사 화면. includeInquiries:false.
        revalidatePath("/employee/counseling"); // 직원 화면. includeInquiries:true.
        return { status: "success", message: "상담 기록이 등록되었습니다." }; // 수정 액션이 아니다.
    } catch { // unique/연결 오류는 범용 메시지.
        return { status: "error", message: "상담 등록에 실패했습니다." }; // unique/연결 오류는 범용 메시지.
    }
}

/**
 * 원장이 학생 관리 화면에서 상담 메모를 남긴다.
 * 스코프·editLifeCounseling을 보지 않고, 재원 여부와 관계없이 학생 id만 확인한다.
 */
export async function createDirectorCounselingMemo( // 직원 createCounselingMemo와 나눈다.
    _prev: CounselingActionState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // 같은 파싱. 스코프는 안 본다.
): Promise<CounselingActionState> { // 퇴원생도 허용. 문의 상태 변경이 아니다.
    const session = await auth(); // DIRECTOR만. 직원 권한 키를 보지 않는다.
    if (!session?.user?.id || session.user.role !== "DIRECTOR") { // 스코프·editLifeCounseling을 보지 않는다.
        return { status: "error", message: "원장 권한이 필요합니다." }; // 스코프·editLifeCounseling을 보지 않는다.
    }

    const parsed = parseCounselingMemoInput(formData); // 직원과 같은 파싱.
    if ("error" in parsed) { // 검증 실패.
        return { status: "error", message: parsed.error }; // 한 문장.
    }

    const { studentId, content, counseledAt } = parsed; // 재원 여부는 아래에서 안 본다.

    const student = await prisma.student.findFirst({ // 퇴원생도 허용.
        where: { id: studentId }, // 퇴원생도 허용. ENROLLED 필터는 직원 액션에만 있다.
        select: { id: true }, // 존재만.
    });

    if (!student) { // 없는 id.
        return { // 메모 행을 만들지 않는다.
            status: "error", // 직원 스코프 문구와 같은 카피.
            message: "상담 가능한 학생을 찾을 수 없습니다.", // 없는 카드.
        };
    }

    try { // 추가만.
        await prisma.counselingMemo.create({ // 직원 create와 같은 행. 경로만 다르다.
            data: { // 원장 authorUserId.
                studentId, // 퇴원생도 허용.
                authorUserId: session.user.id, // 원장 User.
                content, // 2~2000자.
                counseledAt, // 미래 +60초는 파싱에서 거절.
            },
        });
        revalidatePath("/director/students"); // 원장 학생 관리에 붙는 상담 목록.
        revalidatePath("/teacher/counseling"); // 교사 목록도 맞춘다.
        revalidatePath("/employee/counseling"); // 직원 목록도 맞춘다.
        return { status: "success", message: "상담 기록이 등록되었습니다." }; // 문의 상태 변경이 아니다.
    } catch { // 범용 메시지.
        return { status: "error", message: "상담 등록에 실패했습니다." }; // unique/연결 오류는 범용.
    }
}

/**
 * 사무(STAFF)가 게스트 입학 문의 상태를 바꾼다.
 * 교사(TEACHER)는 거절한다 — 문의 큐는 직원 상담 화면에만 연다.
 * 상태를 바꾼 사람을 assignedUserId에 남겨 담당자를 추적한다.
 */
export async function updateInquiryStatus( // 게스트 createInquiry가 아니다. STAFF만.
    _prev: CounselingActionState, // 직전 UI. 서버는 formData만 본다.
    formData: FormData, // inquiryId/status. 원생 카드를 만들지 않는다.
): Promise<CounselingActionState> { // 교사 거절. 제출자 userId는 원래 없다.
    const session = await requireStaff(); // TEACHER|STAFF. 아래에서 STAFF만 통과.
    if (!session || session.user.role !== "STAFF") { // 교사는 상담 메모만. 문의 큐는 직원 화면.
        return { // 문의 행을 안 바꾼다.
            status: "error", // 권한 에러. 필드 맵이 아니다.
            message: "사무 권한이 필요합니다.", // 교사는 상담 메모만. 문의 큐는 직원 화면.
        };
    }

    const inquiryId = String(formData.get("inquiryId") ?? "").trim(); // 게스트 문의 id. 원생 카드가 아니다.
    const status = String(formData.get("status") ?? "").trim(); // NEW/IN_PROGRESS/DONE/SPAM.
    const allowed = ["NEW", "IN_PROGRESS", "DONE", "SPAM"] as const; // 직원 큐는 NEW/IN_PROGRESS만 읽는다.

    if (!inquiryId || !(allowed as readonly string[]).includes(status)) { // 허용 값만. 원생 카드를 만들지 않는다.
        return { // 문의 행을 안 바꾼다.
            status: "error", // 값 오류.
            message: "문의 상태 값이 올바르지 않습니다.", // 허용 목록 밖.
        };
    }

    try { // 상태만. 제출자 userId는 원래 없다.
        await prisma.inquiry.update({ // 게스트 문의. 원생 카드를 만들지 않는다.
            where: { id: inquiryId }, // 문의 행.
            data: { // 상태를 바꾼 사무. 별도 배정 UI는 없다.
                status: status as (typeof allowed)[number], // NEW/IN_PROGRESS/DONE/SPAM.
                assignedUserId: session.user.id, // 상태를 바꾼 사무. 별도 배정 UI는 없다. 제출자 userId는 원래 없다.
            },
        });
        revalidatePath("/teacher/counseling"); // 교사 page는 includeInquiries:false라 목록이 비어 있어도 캐시를 맞춘다.
        revalidatePath("/employee/counseling"); // 직원 큐. DONE/SPAM은 목록에서 빠진다.
        return { status: "success", message: "문의 상태가 변경되었습니다." }; // 원생 카드는 안 만든다.
    } catch { // 없는 id 등.
        return { status: "error", message: "문의 상태 변경에 실패했습니다." }; // 범용 메시지.
    }
}
