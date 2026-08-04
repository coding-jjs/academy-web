import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/types/roles";

const routeRoles: Array<{
    prefix: string;
    roles: AppRole[];
}> = [
    { prefix: "/director", roles: ["DIRECTOR"] },
    { prefix: "/staff", roles: ["STAFF", "TEACHER"] },
    { prefix: "/parent", roles: ["PARENT"] },
    { prefix: "/student", roles: ["STUDENT"] },
    { prefix: "/guest", roles: ["GUEST"] },
];

export default auth((request) => {
    const pathname = request.nextUrl.pathname;

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
        "/staff/:path*",
        "/parent/:path*",
        "/student/:path*",
        "/guest/:path*",
    ],
};
