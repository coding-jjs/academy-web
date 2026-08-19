"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type SignupField = "name" | "address" | "school" | "grade" | "phone";

export type SignupState = {
    status: "idle" | "error" | "success";
    message: string;
    errors: Partial<Record<SignupField, string>>;
    userName?: string;
};

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

function readText(formData: FormData, key: SignupField) {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}
