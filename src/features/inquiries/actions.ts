"use server"; // Server Action. 브라우저가 직접 Prisma를 치지 않는다.

/**
 * 게스트 입학 문의 제출. GUEST 세션만 createInquiry를 호출할 수 있다.
 *
 * 호출: `(guest)/guest/inquiry/GuestInquiryForm.tsx`가 `useActionState(createInquiry)`로 제출한다.
 * 전제: Google 가입 후 역할이 아직 GUEST인 계정. 원장이 역할을 주기 전이다.
 *
 * Inquiry 행에 제출자 userId를 넣지 않는다. 가입 전 문의와 게스트 계정을 분리하고,
 * 이후 STUDENT/PARENT로 바뀌어도 문의가 그 사용자에 묶이지 않게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 문의 상태 변경 → `counseling/actions.ts`의 updateInquiryStatus (STAFF).
 * - 로그인 없이 익명 제출. 세션이 있어야 스팸을 줄인다.
 *
 * 관련: `counseling/staff-data.ts`가 NEW/IN_PROGRESS 큐를 읽는다.
 */

import { auth } from "@/lib/auth"; // JWT 세션. GUEST만. 폼에 userId를 두지 않는다.
import { prisma } from "@/lib/db"; // server-only Prisma. 문의 행만 만든다.

/** 폼 필드 키. 에러 맵과 FormData 키가 같은 이름을 쓰게 묶는다. */
export type InquiryField = // userId·이메일은 키가 아니다. 세션 GUEST만 검사.
    | "guardianName" // 필수 보호자 이름. 원생 카드를 여기서 만들지 않는다.
    | "phone" // 필수 연락처.
    | "studentGrade" // 선택 학년.
    | "interestedSubject" // 선택 과목.
    | "preferredTime" // 선택 희망 시간.
    | "message"; // 선택 본문.

/**
 * `useActionState`가 매 제출마다 주고받는 UI 상태.
 * - idle: 아직 제출 전 (초기값, 이 파일에서는 직접 반환하지 않음)
 * - error: 검증 실패 또는 DB 실패. `errors`로 필드별 메시지를 붙인다.
 * - success: 접수 완료. 폼이 다음 UI로 넘어갈 때 쓴다.
 */
export type InquiryState = { // GuestInquiryForm이 그리는 상태. redirect 페이로드가 아니다.
    status: "idle" | "error" | "success"; // idle은 초기값만. 이 Action은 error/success를 반환한다.
    message: string; // 카드 상단 문장. 필드 에러와 별개.
    errors: Partial<Record<InquiryField, string>>; // 필드별 메시지. 부분 저장 없음.
};

/**
 * GUEST가 입학 문의를 남긴다. 보호자 이름·연락처만 필수.
 *
 * @param _previousState useActionState가 넘기는 직전 상태. 서버는 폼만 본다.
 * @returns 필드 에러 또는 성공. 성공해도 redirect하지 않는다.
 */
export async function createInquiry( // STAFF updateInquiryStatus가 아니다. GUEST 제출만.
    _previousState: InquiryState, // 직전 UI 상태. 서버는 재사용하지 않고 formData만 본다.
    formData: FormData, // 보호자·연락처. userId는 폼에 없다.
): Promise<InquiryState> { // 성공해도 redirect하지 않는다. 원생 카드도 안 만든다.
    const session = await auth(); // GUEST만. 역할이 부여된 계정은 이 폼을 타지 않는다.
    if (!session?.user?.id || session.user.role !== "GUEST") { // PARENT/STUDENT/STAFF는 거절. 익명도 거절.
        return { // 문의 행을 만들지 않는다.
            status: "error", // 필드 에러가 아니라 세션/역할 에러.
            message: "게스트 로그인이 필요합니다.", // 역할이 부여된 계정은 이 폼을 타지 않는다.
            errors: {}, // 필드 하이라이트 없음.
        };
    }

    const guardianName = readText(formData, "guardianName"); // 필수. 원생 카드를 여기서 만들지 않는다.
    const phone = readText(formData, "phone"); // 필수 연락처. 이메일 키가 아니다.
    const studentGrade = readText(formData, "studentGrade"); // 선택. 빈 값 허용.
    const interestedSubject = readText(formData, "interestedSubject"); // 선택 과목.
    const preferredTime = readText(formData, "preferredTime"); // 선택 희망 시간.
    const message = readText(formData, "message"); // 선택 본문.
    const errors: InquiryState["errors"] = {}; // 필드 에러를 한꺼번에 모은다. 부분 저장 없음.

    if (guardianName.length < 2 || guardianName.length > 30) { // 이름은 최소 2자. 원생 카드가 아니다.
        errors.guardianName = "보호자 이름은 2~30자로 입력해 주세요."; // 필수. 원생 카드를 여기서 만들지 않는다.
    }

    if (!/^[0-9+\-()\s]{7,20}$/.test(phone)) { // 필수. 숫자·+()-공백.
        errors.phone = "연락처 형식을 확인해 주세요."; // 필수. 숫자·+()-공백.
    }

    if (studentGrade && studentGrade.length > 20) { // 선택. 빈 값 허용.
        errors.studentGrade = "학년은 20자 이내로 입력해 주세요."; // 선택. 빈 값 허용.
    }

    if (interestedSubject && interestedSubject.length > 50) { // 선택 과목.
        errors.interestedSubject = "희망 과목은 50자 이내로 입력해 주세요."; // 선택.
    }

    if (preferredTime && preferredTime.length > 50) { // 선택 희망 시간.
        errors.preferredTime = "희망 시간은 50자 이내로 입력해 주세요."; // 선택.
    }

    if (message && message.length > 1000) { // 선택 본문.
        errors.message = "문의 내용은 1000자 이내로 입력해 주세요."; // 선택.
    }

    if (Object.keys(errors).length > 0) { // 필드 에러를 한꺼번에. 부분 저장을 막는다.
        return { // 클라이언트가 필드 메시지를 그린다. redirect 없음.
            status: "error", // GuestInquiryForm이 에러 배너를 연다.
            message: "입력한 내용을 다시 확인해 주세요.", // 카드 상단. 필드 메시지와 함께 본다.
            errors, // 필드 에러를 한꺼번에. 부분 저장을 막는다.
        };
    }

    try { // 문의 행만. userId를 붙이지 않는다.
        await prisma.inquiry.create({ // 원생 카드를 만들지 않는다. 상태 변경은 STAFF.
            data: { // 제출자 userId 없음. 이후 STUDENT/PARENT가 돼도 이 문의가 그 계정에 묶이지 않는다.
                guardianName, // 제출자 userId를 두지 않는다. 이후 STUDENT/PARENT가 돼도 이 문의가 그 계정에 묶이지 않는다.
                phone, // 연락처.
                studentGrade: studentGrade || null, // 빈 문자열은 null. 선택 필드.
                interestedSubject: interestedSubject || null, // 빈 문자열은 null.
                preferredTime: preferredTime || null, // 빈 문자열은 null.
                message: message || null, // 빈 문자열은 null.
                status: "NEW", // 직원 상담 큐(includeInquiries:true)가 NEW/IN_PROGRESS만 읽는다.
            },
        });

        return { // redirect 없음. 폼이 다음 UI로 넘어간다.
            status: "success", // 접수 완료. 원생 카드는 안 만든다.
            message: "문의가 접수되었습니다. 학원에서 곧 연락드리겠습니다.", // redirect 없음. 폼이 다음 UI로 넘어간다.
            errors: {}, // 성공이면 필드 에러 없음.
        };
    } catch { // unique/연결 오류는 필드 에러가 아니라 범용.
        return { // 문의 행이 안 만들어진 상태. 내부 스키마를 노출하지 않는다.
            status: "error", // DB 예외. 검증 실패와 같은 status로 UI를 단순화한다.
            message: "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.", // unique/연결 오류는 필드 에러가 아니라 범용.
            errors: {}, // 필드 하이라이트 없음.
        };
    }
}

/** FormData에서 문자열만 꺼내고 trim. 파일이거나 없으면 빈 문자열. */
function readText(formData: FormData, key: string) { // userId 키는 없다. 세션 GUEST만 본다.
    return String(formData.get(key) ?? "").trim(); // 파일이거나 없으면 빈 문자열. userId를 폼에서 받지 않는다.
}
