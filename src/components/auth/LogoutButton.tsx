"use client";

import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/(auth)/logout/action";

export default function LogoutButton({ className }: { className?: string }) {
    return (
        <form action={logoutAction}>
            <SubmitButton className={className} />
        </form>
    );
}

function SubmitButton({ className }: { className?: string }) {
    const { pending } = useFormStatus();

    return (
        <button type="submit" className={className} disabled={pending}>
            {pending ? "로그아웃 중…" : "로그아웃"}
        </button>
    );
}
