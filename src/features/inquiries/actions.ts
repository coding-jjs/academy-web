"use server";

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

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 폼 필드 키. 에러 맵과 FormData 키가 같은 이름을 쓰게 묶는다. */
export type InquiryField =
    | "guardianName"
    | "phone"
    | "studentGrade"
    | "interestedSubject"
    | "preferredTime"
    | "message";

/**
 * `useActionState`가 매 제출마다 주고받는 UI 상태.
 * - idle: 아직 제출 전 (초기값, 이 파일에서는 직접 반환하지 않음)
 * - error: 검증 실패 또는 DB 실패. `errors`로 필드별 메시지를 붙인다.
 * - success: 접수 완료. 폼이 다음 UI로 넘어갈 때 쓴다.
 */
export type InquiryState = {
    status: "idle" | "error" | "success";
    message: string;
    errors: Partial<Record<InquiryField, string>>;
};

/**
 * GUEST가 입학 문의를 남긴다. 보호자 이름·연락처만 필수.
 *
 * @param _previousState useActionState가 넘기는 직전 상태. 서버는 폼만 본다.
 * @returns 필드 에러 또는 성공. 성공해도 redirect하지 않는다.
 */
export async function createInquiry(
    _previousState: InquiryState,
    formData: FormData,
): Promise<InquiryState> {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "GUEST") {
        return {
            status: "error",
            message: "게스트 로그인이 필요합니다.",
            errors: {},
        };
    }

    const guardianName = readText(formData, "guardianName");
    const phone = readText(formData, "phone");
    const studentGrade = readText(formData, "studentGrade");
    const interestedSubject = readText(formData, "interestedSubject");
    const preferredTime = readText(formData, "preferredTime");
    const message = readText(formData, "message");
    const errors: InquiryState["errors"] = {};

    if (guardianName.length < 2 || guardianName.length > 30) {
        errors.guardianName = "보호자 이름은 2~30자로 입력해 주세요.";
    }

    if (!/^[0-9+\-()\s]{7,20}$/.test(phone)) {
        errors.phone = "연락처 형식을 확인해 주세요.";
    }

    if (studentGrade && studentGrade.length > 20) {
        errors.studentGrade = "학년은 20자 이내로 입력해 주세요.";
    }

    if (interestedSubject && interestedSubject.length > 50) {
        errors.interestedSubject = "희망 과목은 50자 이내로 입력해 주세요.";
    }

    if (preferredTime && preferredTime.length > 50) {
        errors.preferredTime = "희망 시간은 50자 이내로 입력해 주세요.";
    }

    if (message && message.length > 1000) {
        errors.message = "문의 내용은 1000자 이내로 입력해 주세요.";
    }

    if (Object.keys(errors).length > 0) {
        return {
            status: "error",
            message: "입력한 내용을 다시 확인해 주세요.",
            errors,
        };
    }

    try {
        await prisma.inquiry.create({
            data: {
                guardianName,
                phone,
                studentGrade: studentGrade || null,
                interestedSubject: interestedSubject || null,
                preferredTime: preferredTime || null,
                message: message || null,
                status: "NEW",
            },
        });

        return {
            status: "success",
            message: "문의가 접수되었습니다. 학원에서 곧 연락드리겠습니다.",
            errors: {},
        };
    } catch {
        return {
            status: "error",
            message: "문의 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.",
            errors: {},
        };
    }
}

/** FormData에서 문자열만 꺼내고 trim. 파일이거나 없으면 빈 문자열. */
function readText(formData: FormData, key: string) {
    return String(formData.get(key) ?? "").trim();
}
