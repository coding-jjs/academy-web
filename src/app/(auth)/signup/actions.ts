"use server"; // Server Action. 브라우저가 직접 Prisma를 치지 않는다.

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

import { auth } from "@/lib/auth"; // JWT 세션. 이메일은 폼이 아니라 여기서만 꺼낸다.
import { prisma } from "@/lib/db"; // server-only Prisma. 온보딩 행만 갱신한다.

/** 폼 필드 키. 에러 맵과 FormData 키가 같은 이름을 쓰게 묶는다. */
export type SignupField = "name" | "address" | "school" | "grade" | "phone"; // 이메일·역할은 키가 아니다.

/**
 * `useActionState`가 매 제출마다 주고받는 UI 상태.
 * - idle: 아직 제출 전 (초기값, 이 파일에서는 직접 반환하지 않음)
 * - error: 검증 실패 또는 DB/세션 실패. `errors`로 필드별 메시지를 붙인다.
 * - success: 온보딩 저장 완료. SignupFlow가 다음 단계로 넘어갈 때 `userName`을 쓴다.
 */
export type SignupState = { // SignupForm이 그리는 상태. redirect 페이로드가 아니다.
    status: "idle" | "error" | "success"; // idle은 초기값만. 이 Action은 error/success를 반환한다.
    message: string; // 카드 상단 문장. 필드 에러와 별개.
    errors: Partial<Record<SignupField, string>>; // 필드별 메시지. 부분 저장 없음.
    userName?: string; // 성공 시 환영 카피용. 실패 때는 없다.
}; // 블록 끝.

/**
 * GUEST 프로필을 검증·저장하고 온보딩을 완료 처리한다.
 *
 * @param _previousState useActionState가 넘기는 직전 상태. 재시도 시에도 서버는 폼만 본다.
 * @param formData SignupForm의 name/address/school/grade/phone.
 * @returns 필드 에러 또는 성공. 성공해도 redirect하지 않고 클라이언트가 다음 UI를 연다.
 */
export async function completeSignup( // 원장 assignUserRole이 아니다. GUEST 프로필만.
    _previousState: SignupState, // 직전 UI 상태. 서버는 재사용하지 않고 formData만 본다.
    formData: FormData, // name/address/school/grade/phone. email은 없다.
): Promise<SignupState> { // 성공해도 redirect하지 않는다. SignupFlow가 환영 UI를 연다.
    const name = readText(formData, "name"); // 원장 역할 부여·출석 명단에 그대로 쓰이므로 trim 문자열.
    const address = readText(formData, "address"); // 학원 연락·등원 안내용. 역할은 올리지 않는다.
    const school = readText(formData, "school"); // 선택. 비우면 통과.
    const grade = readText(formData, "grade"); // 선택. 초1~고3(1~12). 유치원/재수는 비워 둔다.
    const phone = readText(formData, "phone"); // 선택. 이메일·역할은 폼에 없다.
    const errors: SignupState["errors"] = {}; // 필드 에러를 한꺼번에 모은다. 부분 저장 없음.

    if (name.length < 2 || name.length > 30) { // 이름은 최소 2자. 출석 명단에 그대로 쓰인다.
        errors.name = "이름은 2~30자로 입력해 주세요."; // 필드만 표시. DB는 아직 안 친다.
    } // 블록 끝.

    if (address.length < 5 || address.length > 120) { // 주소 필수. 학원 연락·등원 안내에 쓴다.
        errors.address = "주소를 5~120자로 입력해 주세요."; // 선택 입력이 아니다.
    } // 블록 끝.

    if ((school && school.length < 2) || school.length > 50) { // 학교 선택. 한 글자만 있으면 거절.
        errors.school = "학교 이름을 2~50자로 입력해 주세요."; // 비우면 이 분기에 안 들어온다(빈 문자열은 length 0).
    } // 블록 끝.

    if (grade) { // 학년 선택. 숫자만, 1~12.
        if (!/^\d{1,2}$/.test(grade)) { // 숫자가 아니면 거절. 역할을 STUDENT로 올리지는 않는다.
            errors.grade = "학년은 숫자만 입력해 주세요."; // 한글 학년 표기는 받지 않는다.
        } else { // 숫자 문자열이면 범위만 본다.
            const numericGrade = Number(grade); // 초1~고3. 유치원/재수는 비워 두면 된다.
            if (numericGrade < 1 || numericGrade > 12) { // 1~12 밖이면 거절.
                errors.grade = "학년은 1~12 사이로 입력해 주세요."; // 0·13 이상은 학원 학년으로 안 쓴다.
            } // 블록 끝.
        } // 블록 끝.
    } // 블록 끝.

    if (phone && !/^[0-9+\-()\s]{7,20}$/.test(phone)) { // 전화 선택. 숫자·+()-공백만.
        errors.phone = "번호 형식을 확인해 주세요."; // 국제번호 + 를 허용한다. 이메일은 받지 않는다.
    } // 블록 끝.

    if (Object.keys(errors).length > 0) { // 필드 에러를 한꺼번에 보여 주고, 부분 저장을 막는다.
        return { // 클라이언트가 필드 메시지를 그린다. redirect 없음.
            status: "error", // SignupForm이 에러 배너를 연다.
            message: "입력한 내용을 다시 확인해 주세요.", // 카드 상단. 필드 메시지와 함께 본다.
            errors, // 통과한 필드는 키가 없다.
        }; // 블록 끝.
    } // 블록 끝.

    const session = await auth(); // 이메일은 세션 JWT만. 폼에 email을 두면 다른 사람 온보딩 행을 덮을 수 있다.
    const email = session?.user?.email?.trim().toLowerCase(); // Google 세션 이메일. 폼 값이 아니다.

    if (!email) { // 세션 없으면 온보딩을 쓰지 않는다. 다시 로그인.
        return { // GUEST 행을 만들지 않는다. Google intent=signup이 만든다.
            status: "error", // 필드 에러가 아니라 세션 부재.
            message: "Google 인증 정보가 없습니다. 다시 로그인해 주세요", // /login으로 유도하는 카피.
            errors: {}, // 필드 하이라이트 없음.
        }; // 블록 끝.
    } // 블록 끝.

    try { // ACTIVE + 온보딩 미완료만 갱신. 이미 가입·차단이면 count=0.
        const result = await prisma.user.updateMany({ // 역할을 올리지 않는다. onboardingCompleteAt만 찍는다.
            where: { email, status: "ACTIVE", onboardingCompleteAt: null }, // BLOCKED/이미 온보딩은 0건.
            data: { // 프로필만. JWT는 다음 요청의 jwt 콜백이 DB를 다시 읽는다.
                name, // 출석 명단·역할 부여 UI에 그대로 나온다.
                address, // 학원 연락용.
                schoolName: school || null, // 빈 문자열은 null. 선택 필드.
                grade: grade || null, // 빈 문자열은 null. STUDENT 역할로 바꾸지 않는다.
                phone: phone || null, // 빈 문자열은 null.
                onboardingCompleteAt: new Date(), // 이 시각 이후 GUEST는 역할 부여 대기.
            }, // 객체/호출 끝.
        }); // 객체/호출 끝.

        if (result.count === 0) { // 이미 온보딩됐거나 BLOCKED. 덮어쓰지 않는다.
            return { // 원장 assignUserRole과 별개. 이 Action은 GUEST만.
                status: "error", // 필드 에러가 아니라 계정 상태 에러.
                message: "이미 가입됐거나 가입할 수 없는 계정입니다.", // 재제출해도 덮지 않는다는 뜻.
                errors: {}, // 필드 하이라이트 없음.
            }; // 블록 끝.
        } // 블록 끝.
    } catch (error) { // unique/연결 오류는 필드 에러가 아니라 범용 메시지로. 내부만 로그.
        console.error("회원가입 실패", error); // 시크릿·다른 원생 PII는 로그에 넣지 않는다.

        return { // redirect 없음. SignupForm이 메시지를 보여 준다.
            status: "error", // DB 예외. 검증 실패와 같은 status로 UI를 단순화한다.
            message: // 사용자에게는 재시도만. 스키마 오류를 노출하지 않는다.
                "가입 정보 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", // 범용 문장.
            errors: {}, // 필드 하이라이트 없음.
        }; // 블록 끝.
    } // 블록 끝.

    return { // redirect 없음. SignupFlow가 userName으로 환영 UI를 연다.
        status: "success", // 온보딩 완료. 역할은 아직 GUEST.
        message: "가입 정보 입력이 완료되었습니다.", // 환영 카드 카피.
        errors: {}, // 성공이면 필드 에러 없음.
        userName: name, // 환영 인사에 쓸 이름.
    }; // 블록 끝.
} // 블록 끝.

/** FormData에서 문자열만 꺼내고 trim. 파일이거나 없으면 빈 문자열. */
function readText(formData: FormData, key: SignupField) { // email 키는 없다. 세션에서만 읽는다.
    const value = formData.get(key); // 문자만 trim. 파일이거나 키가 없으면 빈 문자열.
    return typeof value === "string" ? value.trim() : ""; // 파일 업로드를 받지 않는다. Google 전제.
} // 블록 끝.
