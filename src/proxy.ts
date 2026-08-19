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

import { NextResponse } from "next/server"; // redirect / next. 역할 홈은 /post-login.
import { auth } from "@/lib/auth"; // JWT wrapper. BLOCKED/퇴원은 여기서 안 본다.
import type { AppRole } from "@/types/roles"; // prefix → 허용 역할. STAFF는 /employee.

/** 가장 긴 prefix 매칭이 아니라 find 순서. /staff는 리다이렉트 전용으로 먼저 처리한다. */
const routeRoles: Array<{ // URL prefix→JWT role. BLOCKED는 requireRole.
    prefix: string; // URL prefix. /staff는 아래에서 먼저 보낸다.
    roles: AppRole[]; // JWT role. getUsableAccount는 페이지에서.
}> = [ // find 순서. 가장 긴 prefix가 아니다.
    { prefix: "/director", roles: ["DIRECTOR"] }, // 원장만. 교사·직원이 원장 화면을 열지 못하게.
    { prefix: "/teacher", roles: ["TEACHER"] }, // 교사. 직원은 /employee. 일부 Screen만 재사용.
    { prefix: "/employee", roles: ["STAFF"] }, // DB enum은 STAFF. /staff가 아니다.
    { prefix: "/staff", roles: ["STAFF", "TEACHER"] }, // 호환 리다이렉트용. 여기 남으면 안 되고 위에서 보낸다.
    { prefix: "/parent", roles: ["PARENT"] }, // 학부모. 자녀 링크 범위는 page·data.ts.
    { prefix: "/student", roles: ["STUDENT"] }, // 학생. 본인 Student.userId만.
    { prefix: "/guest", roles: ["GUEST"] }, // 온보딩 전·역할 대기. 소개 `/`는 matcher 밖.
]; // routeRoles 끝.

export default auth((request) => { // matcher에 들어온 요청만. /api/chat·/login은 여기 없다.
    const pathname = request.nextUrl.pathname; // URL prefix만 본다. BLOCKED/퇴원은 requireRole.

    if (pathname === "/staff" || pathname.startsWith("/staff/")) { // 북마크·옛 메일 링크를 /teacher 또는 /employee로.
        const user = request.auth?.user; // JWT 역할만. getUsableAccount는 페이지에서.

        if (!user) { // 세션 없으면 로그인. 업무 URL을 보여 주지 않는다.
            const loginUrl = new URL("/login", request.url); // callback으로 원래 경로를 남긴다.
            loginUrl.searchParams.set( // /staff/students?x=1 도 유지.
                "callbackUrl", // 로그인 후 같은 화면. 역할 홈이 아님.
                pathname + request.nextUrl.search, // /staff/students?x=1 도 유지.
            );
            return NextResponse.redirect(loginUrl); // 업무 URL을 보여 주지 않는다.
        }

        const suffix = pathname === "/staff" ? "/dashboard" : pathname.slice("/staff".length); // /staff → /teacher/dashboard, /staff/students → /teacher/students
        if (user.role === "TEACHER") { // 교사는 /teacher. 직원 Screen 재사용은 employee 레이아웃.
            return NextResponse.redirect( // 옛 URL을 남기지 않는다.
                new URL(`/teacher${suffix}`, request.url), // /teacher/dashboard 등.
            );
        }
        if (user.role === "STAFF") { // 직원은 /employee. DB enum STAFF와 URL을 맞춘다.
            return NextResponse.redirect( // /staff를 업무 URL로 쓰지 않는다.
                new URL(`/employee${suffix}`, request.url), // /employee/dashboard 등.
            );
        }

        return NextResponse.redirect(new URL("/post-login", request.url)); // 학부모 등이 옛 URL을 친 경우 본인 홈으로.
    }

    const route = routeRoles.find( // 가장 긴 prefix가 아니라 배열 순서. /staff는 위에서 처리됨.
        ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`), // 가장 긴 prefix가 아니라 배열 순서. /staff는 위에서 처리됨.
    );

    if (!route) return NextResponse.next(); // matcher에 들어왔지만 표에 없는 경로. 실제로는 prefix가 다 있다.

    const user = request.auth?.user; // JWT. 방금 BLOCKED된 계정은 여기서 안 걸러진다.

    if (!user) { // JWT 없으면 업무 URL을 보여주지 않는다.
        const loginUrl = new URL("/login", request.url); // callback으로 원래 업무 경로를 남긴다.
        loginUrl.searchParams.set( // 로그인 후 같은 업무 화면으로.
            "callbackUrl", // 역할 홈이 아니라 원래 URL.
            pathname + request.nextUrl.search, // 로그인 후 같은 업무 화면으로.
        );
        return NextResponse.redirect(loginUrl); // 업무 URL을 보여 주지 않는다.
    }

    if (!route.roles.includes(user.role)) { // JWT 역할이 URL과 다르면 본인 홈. 원장이 /parent 를 쳐도 여기로 온다.
        return NextResponse.redirect(new URL("/post-login", request.url)); // 거절 페이지만 보여 주지 않는다.
    }

    return NextResponse.next(); // URL 역할만 통과. 페이지 requireRole이 DB를 다시 본다.
});

export const config = { // matcher. /api/chat·/login·/signup·/·/notices는 공개.
    matcher: [ // /api/chat는 여기 없다. 챗봇은 핸들러에서 auth + 역할 컨텍스트를 직접 검사한다.
        "/director/:path*", // 원장. requireRole이 DB를 다시 본다.
        "/teacher/:path*", // 교사. billing 메뉴는 navigation에 없음.
        "/employee/:path*", // 직원. DB enum은 STAFF.
        "/staff/:path*", // 옛 URL. 위에서 /teacher 또는 /employee로 보낸다.
        "/parent/:path*", // 학부모. 자녀 링크는 page·data.ts.
        "/student/:path*", // 학생. 본인 Student.userId만.
        "/guest/:path*", // 온보딩 전. `/` 소개는 matcher 밖.
    ], // matcher 목록 끝.
};
