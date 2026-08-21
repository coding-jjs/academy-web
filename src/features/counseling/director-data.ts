import "server-only"; // 조회만. 쓰기는 counseling/actions.ts. 브라우저가 Prisma를 치지 않는다.

/**
 * 원장 학생 관리에 붙는 상담 메모 목록.
 *
 * 호출: `/director/students`가 `DirectorStudentsScreen`에 넘긴다.
 * 스코프 없이 전 원생 이력을 모아 한 화면에서 보게 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 직원 스코프 적용 → `staff-data.ts`.
 * - 문의 목록을 붙이지 않음. 문의는 직원 상담 화면.
 *
 * 관련: `actions.ts`의 createDirectorCounselingMemo, `types.ts`.
 */

import { prisma } from "@/lib/db"; // server-only Prisma. 전 원생 메모만 읽는다.
import type { StaffCounselingMemo } from "@/features/counseling/types"; // 직원과 같은 행 형태. 문의 DTO는 없다.

/**
 * 최근 상담 메모 최대 500건. 학생 상세에서 해당 studentId만 걸러 보여 준다.
 */
export async function getDirectorCounselingMemos(): Promise< // 스코프 없음. 직원 staff-data와 나눈다.
    StaffCounselingMemo[] // 문의 목록은 붙이지 않는다. 문의는 직원 상담 화면.
> { // 원장 학생 관리용. 게스트 문의 큐가 아니다.
    const records = await prisma.counselingMemo.findMany({ // 전 원생. where 스코프를 넣지 않는다.
        orderBy: [{ counseledAt: "desc" }, { createdAt: "desc" }], // 상담 일시 우선.
        take: 500, // 스코프 없이 전 원생. 화면이 studentId로 다시 건다.
        select: { // 목록 행. 수정·삭제는 없다.
            id: true, // 메모 행.
            content: true, // 본문 2~2000자.
            counseledAt: true, // ISO로 내린다. 화면은 KST datetime.
            createdAt: true, // ISO 작성.
            studentId: true, // 원장 상세 패널이 이 키로 걸러 보여 준다.
            student: { // 원생 이름·학년. 문의 보호자가 아니다.
                select: { // 표시용. 쓰기 권한 판정이 아니다.
                    name: true, // 목록 이름.
                    grade: true, // 학년 표시.
                },
            },
            author: { // 작성자 User. onlyOwnMemos 필터는 직원 쪽.
                select: { // 이름만.
                    name: true, // 작성자 표시.
                },
            },
        },
    });

    return records.map((memo) => ({ // ISO 문자열. Prisma Date를 화면에 안 넘긴다.
        id: memo.id, // 메모 행. 수정·삭제는 없다.
        content: memo.content, // 상담 본문.
        counseledAt: memo.counseledAt.toISOString(), // ISO. 화면은 KST datetime.
        createdAt: memo.createdAt.toISOString(), // ISO 작성.
        studentId: memo.studentId, // 원장 상세가 이 키로 다시 건다.
        studentName: memo.student.name, // 목록 이름.
        studentGrade: memo.student.grade, // 학년 표시.
        authorName: memo.author.name, // 작성자 User 이름.
    }));
}
