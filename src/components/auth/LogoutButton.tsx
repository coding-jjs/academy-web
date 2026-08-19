"use client"; // useFormStatus. 셸은 서버, 버튼만 클라이언트.

/**
 * 로그아웃 폼 버튼.
 * 클라이언트에서 `signOut`을 직접 부르지 않고 Server Action으로 세션을 지운다.
 *
 * 호출: `AdminShell` / `MemberShell` 헤더. 클래스만 셸 CSS에서 받는다.
 * 클라이언트 전용 — `useFormStatus`로 pending 문구를 보여 주기 위함.
 *
 * 쓰기는 `logoutAction` (서버). 이 파일은 폼만 감싼다.
 * 클라이언트 signOut을 안 쓰는 이유: Auth.js 쿠키 삭제가 서버 액션 경로와
 * 맞춰져 있고, JS 실패 시에도 form POST로 로그아웃이 남는다.
 *
 * 의도적으로 하지 않는 일:
 * - callbackUrl을 여기서 고정하지 않는다 → logout action이 `/login`으로 보낸다.
 * - 확인 모달을 띄우지 않는다. 학원 PC 공유를 빨리 끊는 쪽이 우선.
 *
 * 관련: `app/(auth)/logout/action.ts`.
 */

import { useFormStatus } from "react-dom"; // pending. 이중 제출을 막는다.
import { logoutAction } from "@/app/(auth)/logout/action"; // Server Action. 클라이언트 signOut이 아님.

export default function LogoutButton({ className }: { className?: string }) { // 셸 CSS만 받는다. callbackUrl은 여기 없음.
    return ( // 클라이언트 signOut이 아니라 form POST. JS 실패 시에도 끊긴다.
        <form action={logoutAction}> {/* 클라이언트 signOut이 아니라 Server Action. JS 실패 시에도 POST로 끊긴다. */}
            <SubmitButton className={className} /> {/* pending 문구. 확인 모달은 없다. */}
        </form> {/* Server Action 로그아웃. 확인 모달 없음. */}
    );
}

function SubmitButton({ className }: { className?: string }) { // useFormStatus는 form 자식에서만.
    const { pending } = useFormStatus(); // 이중 제출을 막고 학원 PC에서 끊기는 중임을 보여 준다.

    return ( // 확인 모달 없음. 학원 PC 공유를 빨리 끊는 쪽이 우선.
        <button type="submit" className={className} disabled={pending}> {/* pending이면 잠근다. 확인 모달은 없다. */}
            {pending ? "로그아웃 중…" : "로그아웃"} {/* action이 /login으로 보낸다. callbackUrl은 여기 없음. */}
        </button> {/* Server Action 로그아웃. 확인 모달 없음. */}
    );
}
