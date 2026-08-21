"use server";

/**
 * Google 가입 직후 GUEST 온보딩 폼의 Server Action.
 *
 * 호출: `(auth)/signup/SignupForm.tsx`가 `useActionState(completeSignup)`로 제출한다.
 * 전제: 이미 Google OAuth `signIn` 콜백이 User 행을 만든 상태다
 *       (role=GUEST, status=ACTIVE, onboardingCompleteAt=null).
 *
 * 성공 시 `onboardingCompleteAt`을 찍어
 * "가입은 끝났고, 원장이 역할을 부여할 때까지 대기" 상태로 만든다.
 * `/post-login`은 온보딩이 끝난 GUEST를 계속 `/signup`으로 보내지 않는다.
 *
 * 의도적으로 하지 않는 일:
 * - STUDENT/PARENT 등 업무 역할로 올리지 않는다 → `assignUserRole` (원장).
 * - 비밀번호를 받지 않는다 → Google 전제.
 * - JWT를 직접 갱신하지 않는다 → 다음 요청의 `jwt` 콜백이 DB를 다시 읽는다.
 * - 이미 온보딩이 끝난 계정을 덮어쓰지 않는다 → updateMany where에 `onboardingCompleteAt: null`.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 폼 필드 키. 에러 맵과 FormData 키가 같은 이름을 쓰게 묶는다. */
export type SignupField = "name" | "address" | "school" | "grade" | "phone";

/**
 * `useActionState`가 매 제출마다 주고받는 UI 상태.
 * - idle: 아직 제출 전 (초기값, 이 파일에서는 직접 반환하지 않음)
 * - error: 검증 실패 또는 DB/세션 실패. `errors`로 필드별 메시지를 붙인다.
 * - success: 온보딩 저장 완료. SignupFlow가 다음 단계로 넘어갈 때 `userName`을 쓴다.
 */
export type SignupState = {
    status: "idle" | "error" | "success";
    message: string;
    errors: Partial<Record<SignupField, string>>;
    userName?: string;
};

/**
 * GUEST 프로필을 검증·저장하고 온보딩을 완료 처리한다.
 *
 * @param _previousState useActionState가 넘기는 직전 상태. 재시도 시에도 서버는 폼만 본다.
 * @param formData SignupForm의 name/address/school/grade/phone.
 * @returns 필드 에러 또는 성공. 성공해도 redirect하지 않고 클라이언트가 다음 UI를 연다.
 */
export async function completeSignup(
    _previousState: SignupState,
    formData: FormData,
): Promise<SignupState> {
    const name = readText(formData, "name");
    const address = readText(formData, "address");
    const school = readText(formData, "school");
    const grade = readText(formData, "grade");
    const phone = readText(formData, "phone");
    const errors: SignupState["errors"] = {};

    if (name.length < 2 || name.length > 30) {
        errors.name = "이름은 2~30자로 입력해 주세요.";
    }

    if (address.length < 5 || address.length > 120) {
        errors.address = "주소를 5~120자로 입력해 주세요.";
    }

    if ((school && school.length < 2) || school.length > 50) {
        errors.school = "학교 이름을 2~50자로 입력해 주세요.";
    }

    if (grade) {
        if (!/^\d{1,2}$/.test(grade)) {
            errors.grade = "학년은 숫자만 입력해 주세요.";
        } else {
            const numericGrade = Number(grade);
            if (numericGrade < 1 || numericGrade > 12) {
                errors.grade = "학년은 1~12 사이로 입력해 주세요.";
            }
        }
    }

    if (phone && !/^[0-9+\-()\s]{7,20}$/.test(phone)) {
        errors.phone = "번호 형식을 확인해 주세요.";
    }

    if (Object.keys(errors).length > 0) {
        return {
            status: "error",
            message: "입력한 내용을 다시 확인해 주세요.",
            errors,
        };
    }

    const session = await auth();
    const email = session?.user?.email?.trim().toLowerCase();

    if (!email) {
        return {
            status: "error",
            message: "Google 인증 정보가 없습니다. 다시 로그인해 주세요",
            errors: {},
        };
    }

    try {
        const result = await prisma.user.updateMany({
            where: { email, status: "ACTIVE", onboardingCompleteAt: null },
            data: {
                name,
                address,
                schoolName: school || null,
                grade: grade || null,
                phone: phone || null,
                onboardingCompleteAt: new Date(),
            },
        });

        if (result.count === 0) {
            return {
                status: "error",
                message: "이미 가입됐거나 가입할 수 없는 계정입니다.",
                errors: {},
            };
        }
    } catch (error) {
        console.error("회원가입 실패", error);

        return {
            status: "error",
            message:
                "가입 정보 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            errors: {},
        };
    }

    return {
        status: "success",
        message: "가입 정보 입력이 완료되었습니다.",
        errors: {},
        userName: name,
    };
}

/** FormData에서 문자열만 꺼내고 trim. 파일이거나 없으면 빈 문자열. */
function readText(formData: FormData, key: SignupField) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}
