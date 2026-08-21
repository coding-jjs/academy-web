import "server-only"; // 조회 전용. createInvoice 없음.

/**
 * 원장 청구·수납 화면에 쓸 학생 옵션과 Invoice 목록을 조회한다.
 *
 * 호출: 청구 관리 화면이 학생 선택지·목록을 그릴 때.
 * 생성 액션(`createInvoice`)은 아직 없다. 목록과 학부모 연결 정보만 넘긴다.
 *
 * 의도적으로 하지 않는 일:
 * - 발행·취소·수납 처리. `BillingManagementScreen` 버튼은 준비 중 안내만.
 * - 학부모 결제 대기 분할 → `parent-data.ts`.
 *
 * 관련: `types.ts`, `InvoiceCreationPanel` (UI only).
 */

import type { Prisma } from "@/generate/prisma/client"; // where 입력 타입.
import { prisma } from "@/lib/db"; // server-only Prisma.
import type { // 화면 DTO.
    BillingInvoiceRow, // 목록 행.
    BillingStudentOption, // 작성 패널 선택지.
} from "@/features/billing/types"; // UI only 입력은 InvoiceCreationPanel.

/**
 * 스코프 where를 받아 학생(학부모 링크 1건)과 최근 Invoice 100건을 병렬 조회한다.
 */
export async function getBillingManagementData( // 발행 액션이 아니다.
    { // 페이지가 넘기는 스코프.
        studentWhere, // 재원 등.
        invoiceWhere, // 선택. 없으면 전체.
    }: { // 인자.
        studentWhere: Prisma.StudentWhereInput; // 학생 필터.
        invoiceWhere?: Prisma.InvoiceWhereInput; // Invoice 필터.
    },
): Promise<{ // 작성 패널+목록.
    students: BillingStudentOption[]; // parentUserId 포함.
    invoices: BillingInvoiceRow[]; // 최근 100건.
}> { // 조회만.
    const [studentRecords, invoiceRecords] = await Promise.all([ // 생성 액션은 아직 없다. 조회 전용.
        prisma.student.findMany({ // 작성 패널 선택지.
            where: studentWhere, // 페이지 스코프.
            orderBy: { name: "asc" }, // 이름순.
            select: { // 링크·반만.
                id: true, // Student PK.
                name: true, // 표시 이름.
                parentLinks: { // 활성 링크 1명. 미연결이면 작성 패널이 학생을 선택지에서 뺀다.
                    where: { endedAt: null }, // 종료 링크 제외.
                    orderBy: { linkedAt: "desc" }, // 최신 링크.
                    take: 1, // 1명.
                    select: { // 학부모 id·이름.
                        parentUserId: true, // null이면 패널이 제외.
                        parent: { select: { name: true } }, // 표시 이름.
                    },
                },
                enrollments: { // 활성 반 1건.
                    where: { endedAt: null, status: "ACTIVE" }, // 취소 수강 제외.
                    take: 1, // 반 이름만.
                    select: { class: { select: { name: true } } }, // 반 이름.
                },
            },
        }),
        prisma.invoice.findMany({ // 최근 100건. createInvoice가 아직 없어 조회 전용이다.
            where: invoiceWhere, // 선택 필터.
            orderBy: { createdAt: "desc" }, // 최신순.
            take: 100, // 상한.
            select: { // 목록 필드.
                id: true, // Invoice PK.
                title: true, // 제목.
                totalAmount: true, // 합계.
                status: true, // DRAFT면 발행 버튼.
                dueDate: true, // 납기.
                issuedAt: true, // 발행 시각.
                paidAt: true, // 완납 시각.
                student: { select: { name: true } }, // 대상 학생.
                parent: { select: { name: true } }, // 학부모.
            },
        }),
    ]);

    const students = studentRecords.map((student) => { // 학부모 미연결이면 parentUserId=null. InvoiceCreationPanel이 걸러 낸다.
        const activeParentLink = student.parentLinks[0]; // 최신 활성 링크.
        const activeEnrollment = student.enrollments[0]; // 활성 반.

        return { // BillingStudentOption.
            id: student.id, // Student PK.
            name: student.name, // 표시 이름.
            parentUserId: activeParentLink?.parentUserId ?? null, // 없으면 패널 제외.
            parentName: activeParentLink?.parent.name ?? null, // 옵션 보조 문구.
            className: activeEnrollment?.class.name ?? null, // 반 이름.
        };
    });

    const invoices = invoiceRecords.map((invoice) => ({ // ISO 날짜. 발행·취소 액션은 아직 없다.
        id: invoice.id, // Invoice PK.
        title: invoice.title, // 제목.
        totalAmount: invoice.totalAmount, // 합계.
        status: invoice.status, // 칩·버튼 조건.
        dueDate: invoice.dueDate.toISOString(), // ISO.
        issuedAt: invoice.issuedAt?.toISOString() ?? null, // DRAFT면 null.
        paidAt: invoice.paidAt?.toISOString() ?? null, // 미납이면 null.
        studentName: invoice.student.name, // 대상.
        parentName: invoice.parent.name, // 학부모.
    }));

    return { students, invoices }; // 화면 props.
}
