/**
 * Next 16 요청 가드 (옛 middleware). `src/proxy.ts`가 그 자리.
 *
 * URL prefix → 허용 역할. JWT `request.auth.user.role`만 본다.
 * BLOCKED/퇴원 재검사는 하지 않는다 → 페이지의 `requireRole` + `getUsableAccount`.
 *
 * `/staff`는 옛 직원 URL. 교사면 `/teacher`, 직원이면 `/employee`로 넘긴다.
 * `/api/chat`은 matcher에 없다. 챗봇은 핸들러가 auth·역할 컨텍스트를 직접 검사한다.
 * `/login` `/signup` `/` `/notices`도 matcher 밖 — 공개.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/types/roles";

/** 가장 긴 prefix 매칭이 아니라 find 순서. /staff는 리다이렉트 전용으로 먼저 처리한다. */
const routeRoles: Array<{
    prefix: string;
    roles: AppRole[];
}> = [
    { prefix: "/director", roles: ["DIRECTOR"] },
    { prefix: "/teacher", roles: ["TEACHER"] },
    { prefix: "/employee", roles: ["STAFF"] },
    { prefix: "/staff", roles: ["STAFF", "TEACHER"] },
    { prefix: "/parent", roles: ["PARENT"] },
    { prefix: "/student", roles: ["STUDENT"] },
    { prefix: "/guest", roles: ["GUEST"] },
];

export default auth((request) => {
    const pathname = request.nextUrl.pathname;

    if (pathname === "/staff" || pathname.startsWith("/staff/")) {
        const user = request.auth?.user;

        if (!user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set(
                "callbackUrl",
                pathname + request.nextUrl.search,
            );
            return NextResponse.redirect(loginUrl);
        }

        const suffix = pathname === "/staff" ? "/dashboard" : pathname.slice("/staff".length);
        if (user.role === "TEACHER") {
            return NextResponse.redirect(
                new URL(`/teacher${suffix}`, request.url),
            );
        }
        if (user.role === "STAFF") {
            return NextResponse.redirect(
                new URL(`/employee${suffix}`, request.url),
            );
        }

        return NextResponse.redirect(new URL("/post-login", request.url));
    }

    const route = routeRoles.find(
        ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

    if (!route) return NextResponse.next();

    const user = request.auth?.user;

    if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set(
            "callbackUrl",
            pathname + request.nextUrl.search,
        );
        return NextResponse.redirect(loginUrl);
    }

    if (!route.roles.includes(user.role)) {
        return NextResponse.redirect(new URL("/post-login", request.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/director/:path*",
        "/teacher/:path*",
        "/employee/:path*",
        "/staff/:path*",
        "/parent/:path*",
        "/student/:path*",
        "/guest/:path*",
    ],
};
