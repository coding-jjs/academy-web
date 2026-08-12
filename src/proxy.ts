import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/types/roles";

const routeRoles: Array<{
    prefix: string;
    roles: AppRole[];
}> = [
    { prefix: "/director", roles: ["DIRECTOR"] },
    { prefix: "/teacher", roles: ["TEACHER"] },
    { prefix: "/employee", roles: ["STAFF"] },
    { prefix: "/staff", roles: ["STAFF", "TEACHER"] }, // 호환 리다이렉트용
    { prefix: "/parent", roles: ["PARENT"] },
    { prefix: "/student", roles: ["STUDENT"] },
    { prefix: "/guest", roles: ["GUEST"] },
];

export default auth((request) => {
    const pathname = request.nextUrl.pathname;

    // 구 /staff → 역할별 신규 경로
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
