"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type InquiryField =
    | "guardianName"
    | "phone"
    | "studentGrade"
    | "interestedSubject"
    | "preferredTime"
    | "message";

export type InquiryState = {
    status: "idle" | "error" | "success";
    message: string;
    errors: Partial<Record<InquiryField, string>>;
};

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

function readText(formData: FormData, key: string) {
    return String(formData.get(key) ?? "").trim();
}
