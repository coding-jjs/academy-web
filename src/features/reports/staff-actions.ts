"use server"; // Server Action. 브라우저가 Prisma를 직접 치지 않는다.

/**
 * 교사·직원이 담당 범위 학생의 리포트 초안을 저장·재생성하고 승인을 요청한다.
 *
 * 호출: `(teacher)/teacher/reports/components/ReportEditor.tsx`.
 * writeAiReport 권한과 스태프 스코프를 확인한 뒤, 편집 가능 상태만 DRAFTING으로 올리고
 * PENDING_APPROVAL로 넘긴다. AI 초안은 Gemini 없으면 템플릿(`draft-generator`).
 *
 * 의도적으로 하지 않는 일:
 * - 학부모 발송 → 원장 `approveAndSendReport` (Message SENT).
 * - 근거 조회는 `evidence.ts`만. `evidence 2.ts`는 쓰지 않는다.
 *
 * 관련: `draft-generator.ts`, `staff-scope`, `userHasPermission`.
 */

import { revalidatePath } from "next/cache"; // 의존성. 초안만. 발송은 원장 승인 SENT.
import { auth } from "@/lib/auth"; // 의존성. 초안만. 발송은 원장 승인 SENT.
import { prisma } from "@/lib/db"; // 의존성. 초안만. 발송은 원장 승인 SENT.
import { userHasPermission } from "@/lib/permission-guard"; // 의존성. 초안만. 발송은 원장 승인 SENT.
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope"; // 의존성. 초안만. 발송은 원장 승인 SENT.
import { createReportDraft } from "@/features/reports/draft-generator"; // 의존성. 초안만. 발송은 원장 승인 SENT.
import { // 의존성. 초안만. 발송은 원장 승인 SENT.
    formatEvidenceSummary, // 초안만. 발송은 원장 승인 SENT.
    getReportEvidence, // 초안만. 발송은 원장 승인 SENT.
} from "@/features/reports/evidence"; // 초안만. 발송은 원장 승인 SENT.

type ActionResult = // 초안만. 발송은 원장 승인 SENT.
    | { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
          ok: true; // 성공해도 redirect 없이 화면이 메시지를 띄운다.
          reportId?: string; // upsert된 AiReport id. 편집기가 같은 행을 이어 쓴다.
          content?: string; // AI/템플릿 초안 본문. 저장만이면 비운다.
          message?: string; // 교사 화면 안내.
          evidenceSummary?: string; // 성적·출결 건수. AI 문장이 아니다.
      }
    | { ok: false; message: string }; // 권한·검증 실패. 부분 저장 없음.

type StaffSession = { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
    user: { id: string; role: string; name?: string | null }; // JWT. 원장은 이 액션에 못 들어온다.
};

/** TEACHER 또는 STAFF만. 원장은 이 액션이 아니라 승인 큐를 쓴다. */
async function requireStaffOrTeacher(): Promise<StaffSession | null> { // requireStaffOrTeacher. 초안만. 발송은 원장 승인 SENT.
    const session = await auth(); // JWT. proxy 가드 후에도 쓰기에서 역할을 다시 본다.
    if ( // 가드. 초안만. 발송은 원장 승인 SENT.
        !session?.user?.id || // 비로그인은 초안 쓰기를 열지 않는다.
        (session.user.role !== "TEACHER" && session.user.role !== "STAFF") // 원장·학부모는 staff-actions가 아니라 승인 큐/조회만.
    ) { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
        return null; // 호출부가 "직원 로그인"으로 거절한다.
    }
    return session as StaffSession; // TEACHER | STAFF만. writeAiReport는 다음 함수.
}

/** `writeAiReport` 권한이 없으면 저장·재생성·승인요청을 모두 막는다. */
async function requireWriteAiReport( // requireWriteAiReport. 초안만. 발송은 원장 승인 SENT.
    session: StaffSession, // session. 초안만. 발송은 원장 승인 SENT.
): Promise<string | null> { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
    const allowed = await userHasPermission(session.user.id, "writeAiReport"); // 역할만으로는 부족. 원장이 끈 직원은 막는다.
    if (!allowed) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return "AI 리포트 작성 권한이 없습니다. 원장에게 권한 부여를 요청하세요."; // 저장·재생성·승인요청을 한꺼번에 거절.
    }
    return null; // 통과. 스코프는 assertCanAccessStudent가 가른다.
}

function parseDateOnly(value: string, label: string): Date | null { // parseDateOnly. 초안만. 발송은 원장 승인 SENT.
    const trimmed = String(value ?? "").trim(); // YYYY-MM-DD만. 서버 TZ로 하루가 밀리지 않게 UTC 00:00으로 파싱한다.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return null; // 시각·다른 형식은 거절. 화면 기본 기간은 presentation이 UTC 월초·월말로 만든다.
    }
    const date = new Date(`${trimmed}T00:00:00.000Z`); // Date 컬럼 비교용. timestamptz 배타 상한은 evidence.ts가 다음날 00:00을 쓴다.
    if (Number.isNaN(date.getTime())) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return null; // 2월 31일 등 달력에 없는 날은 거절한다.
    }
    void label; // 호출부가 필드명을 넘기도록 남겨 두되, 파싱 자체는 형만 본다.
    return date; // 시작·종료 비교는 호출부가 periodEnd < periodStart로 한다.
}

/** 스코프 밖 학생은 작성 불가. viewAllStudents면 "없음", 아니면 담당반 안내. */
async function assertCanAccessStudent( // assertCanAccessStudent. 초안만. 발송은 원장 승인 SENT.
    session: StaffSession, // session. 초안만. 발송은 원장 승인 SENT.
    studentId: string, // studentId. 초안만. 발송은 원장 승인 SENT.
): Promise<string | null> { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
    const scope = await getStaffScope(session.user.id); // viewAllStudents면 전원, 아니면 담당반. 스코프 밖은 작성 불가.

    const student = await prisma.student.findFirst({ // student 시작. 초안만. 발송은 원장 승인 SENT.
        where: { // 필터. 초안만. 발송은 원장 승인 SENT.
            id: studentId, // 폼에서 온 Student PK. User id가 아니다.
            ...studentScopeWhere(scope), // 담당반 밖이면 행이 안 나온다.
        },
        select: { id: true }, // 존재·스코프만. 본문은 호출부가 따로 쓴다.
    });

    if (!student) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return scope.viewAllStudents // 반환. 초안만. 발송은 원장 승인 SENT.
            ? "학생을 찾을 수 없습니다." // 전교 조회인데도 없음.
            : "담당 반 학생만 작성할 수 있습니다."; // 타반 학생은 원장 큐가 아니라 이 액션에서 막는다.
    }

    return null; // 스코프 안. upsertDraft가 편집 가능 행만 덮는다.
}

const EDITABLE = new Set(["UNWRITTEN", "DRAFTING", "REJECTED"]); // SENT·PENDING은 덮지 않아 승인 큐·발송본을 보호한다.

/**
 * 편집 가능 행을 갱신하거나, forceNew면 새 DRAFTING 행을 만든다.
 * PENDING_APPROVAL·SENT는 덮지 않아 승인 큐·발송본을 보호한다.
 */
async function upsertDraft(params: { // upsertDraft. 초안만. 발송은 원장 승인 SENT.
    session: StaffSession; // session. 초안만. 발송은 원장 승인 SENT.
    studentId: string; // studentId. 초안만. 발송은 원장 승인 SENT.
    content: string; // content. 초안만. 발송은 원장 승인 SENT.
    keywords: string[]; // keywords. 초안만. 발송은 원장 승인 SENT.
    periodStart: Date; // periodStart. 초안만. 발송은 원장 승인 SENT.
    periodEnd: Date; // periodEnd. 초안만. 발송은 원장 승인 SENT.
    forceNew?: boolean; // 초안만. 발송은 원장 승인 SENT.
    reportId?: string; // 초안만. 발송은 원장 승인 SENT.
}) { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
    if (params.reportId && !params.forceNew) { // 지정 행이 있고 새 기간이 아니면 그 행만, 편집 가능 상태일 때 갱신.
        const existing = await prisma.aiReport.findFirst({ // existing 시작. 초안만. 발송은 원장 승인 SENT.
            where: { // 필터. 초안만. 발송은 원장 승인 SENT.
                id: params.reportId, // 편집기가 들고 있는 작업본.
                studentId: params.studentId, // 다른 학생 행을 덮지 못하게 같이 묶는다.
                status: { in: ["UNWRITTEN", "DRAFTING", "REJECTED"] }, // PENDING·SENT는 잠금.
            },
            select: { id: true, status: true }, // select 필드. 초안만. 발송은 원장 승인 SENT.
        });

        if (existing && EDITABLE.has(existing.status)) { // 반려도 다시 저장할 수 있게 REJECTED를 포함한다.
            return prisma.aiReport.update({ // 반환. 초안만. 발송은 원장 승인 SENT.
                where: { id: existing.id }, // 필터. 초안만. 발송은 원장 승인 SENT.
                data: { // data 필드. 초안만. 발송은 원장 승인 SENT.
                    authorUserId: params.session.user.id, // 마지막 작성자를 교사·직원으로 찍는다.
                    content: params.content, // AI를 여기서 호출하지 않는다. 입력 본문 또는 초안 생성기가 넘긴 문장.
                    keywords: params.keywords, // keywords. 초안만. 발송은 원장 승인 SENT.
                    periodStart: params.periodStart, // UTC 00:00 Date. 화면은 YYYY-MM-DD.
                    periodEnd: params.periodEnd, // periodEnd. 초안만. 발송은 원장 승인 SENT.
                    status: "DRAFTING", // 승인 대기가 아니라 초안. Message는 만들지 않는다.
                    rejectionReason: null, // 다시 저장하면 반려 사유를 비운다.
                },
                select: { id: true }, // select 필드. 초안만. 발송은 원장 승인 SENT.
            });
        }
    }

    if (!params.forceNew) { // reportId가 없거나 못 찾으면 학생의 최신 편집 가능 행을 덮는다.
        const existing = await prisma.aiReport.findFirst({ // existing 시작. 초안만. 발송은 원장 승인 SENT.
            where: { // 필터. 초안만. 발송은 원장 승인 SENT.
                studentId: params.studentId, // studentId. 초안만. 발송은 원장 승인 SENT.
                status: { in: ["UNWRITTEN", "DRAFTING", "REJECTED"] }, // SENT는 덮지 않는다.
            },
            orderBy: { updatedAt: "desc" }, // 방금 저장한 초안을 우선한다.
            select: { id: true, status: true }, // select 필드. 초안만. 발송은 원장 승인 SENT.
        });

        if (existing && EDITABLE.has(existing.status)) { // 가드. 초안만. 발송은 원장 승인 SENT.
            return prisma.aiReport.update({ // 반환. 초안만. 발송은 원장 승인 SENT.
                where: { id: existing.id }, // 필터. 초안만. 발송은 원장 승인 SENT.
                data: { // data 필드. 초안만. 발송은 원장 승인 SENT.
                    authorUserId: params.session.user.id, // authorUserId. 초안만. 발송은 원장 승인 SENT.
                    content: params.content, // content. 초안만. 발송은 원장 승인 SENT.
                    keywords: params.keywords, // keywords. 초안만. 발송은 원장 승인 SENT.
                    periodStart: params.periodStart, // periodStart. 초안만. 발송은 원장 승인 SENT.
                    periodEnd: params.periodEnd, // periodEnd. 초안만. 발송은 원장 승인 SENT.
                    status: "DRAFTING", // 학부모 parent-data는 SENT만 보므로 이 행은 가정에 안 보인다.
                    rejectionReason: null, // rejectionReason. 초안만. 발송은 원장 승인 SENT.
                },
                select: { id: true }, // select 필드. 초안만. 발송은 원장 승인 SENT.
            });
        }
    }

    return prisma.aiReport.create({ // PENDING·SENT는 덮지 않고 DRAFTING 행을 새로 만든다.
        data: { // data 필드. 초안만. 발송은 원장 승인 SENT.
            studentId: params.studentId, // Student PK. 학부모 링크는 원장 승인 때 조회한다.
            authorUserId: params.session.user.id, // authorUserId. 초안만. 발송은 원장 승인 SENT.
            content: params.content, // content. 초안만. 발송은 원장 승인 SENT.
            keywords: params.keywords, // keywords. 초안만. 발송은 원장 승인 SENT.
            periodStart: params.periodStart, // periodStart. 초안만. 발송은 원장 승인 SENT.
            periodEnd: params.periodEnd, // periodEnd. 초안만. 발송은 원장 승인 SENT.
            status: "DRAFTING", // 발송이 아니다. 원장 승인 때 같은 tx에서 Message SENT.
        },
        select: { id: true }, // select 필드. 초안만. 발송은 원장 승인 SENT.
    });
}

/**
 * 교사 입력 본문을 DRAFTING으로 저장한다. AI를 호출하지 않는다.
 */
export async function saveDraftReport(input: { // saveDraftReport. 초안만. 발송은 원장 승인 SENT.
    studentId: string; // studentId. 초안만. 발송은 원장 승인 SENT.
    content: string; // content. 초안만. 발송은 원장 승인 SENT.
    keywords: string[]; // keywords. 초안만. 발송은 원장 승인 SENT.
    periodStart: string; // periodStart. 초안만. 발송은 원장 승인 SENT.
    periodEnd: string; // periodEnd. 초안만. 발송은 원장 승인 SENT.
    forceNew?: boolean; // 초안만. 발송은 원장 승인 SENT.
    reportId?: string; // 초안만. 발송은 원장 승인 SENT.
}): Promise<ActionResult> { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
    const session = await requireStaffOrTeacher(); // 교사·직원만. 원장은 이 액션이 아니라 승인 큐를 쓴다.
    if (!session) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "직원 로그인이 필요합니다." }; // JWT 역할이 TEACHER/STAFF가 아님.
    }

    const permError = await requireWriteAiReport(session); // writeAiReport가 꺼진 직원은 저장을 막는다.
    if (permError) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: permError }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const studentId = String(input.studentId ?? "").trim(); // Student PK. 스코프 밖이면 아래에서 거절.
    const content = String(input.content ?? "").trim(); // 본문 필수. AI를 호출하지 않고 입력만 저장한다.
    const keywords = Array.isArray(input.keywords) // keywords. 초안만. 발송은 원장 승인 SENT.
        ? input.keywords.map(String).filter(Boolean) // 빈 칸 키워드는 버린다.
        : []; // 삼항 나머지. 초안만. 발송은 원장 승인 SENT.
    const reportId = String(input.reportId ?? "").trim() || undefined; // 지정 행. 없으면 최신 편집 가능 행.

    if (!studentId) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "학생 정보가 없습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }
    if (!content) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "본문을 입력해 주세요." }; // 빈 초안은 DRAFTING으로도 올리지 않는다.
    }

    const periodStart = parseDateOnly(input.periodStart, "시작일"); // YYYY-MM-DD → UTC 00:00.
    const periodEnd = parseDateOnly(input.periodEnd, "종료일"); // periodEnd. 초안만. 발송은 원장 승인 SENT.
    if (!periodStart || !periodEnd) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "기간 형식이 올바르지 않습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }
    if (periodEnd < periodStart) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "종료일이 시작일보다 빠를 수 없습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const accessError = await assertCanAccessStudent(session, studentId); // 담당반 밖은 작성 불가.
    if (accessError) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: accessError }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const report = await upsertDraft({ // 편집 가능 행을 DRAFTING으로. SENT는 만들지 않는다.
        session, // 초안만. 발송은 원장 승인 SENT.
        studentId, // 초안만. 발송은 원장 승인 SENT.
        content, // 초안만. 발송은 원장 승인 SENT.
        keywords, // 초안만. 발송은 원장 승인 SENT.
        periodStart, // 초안만. 발송은 원장 승인 SENT.
        periodEnd, // 초안만. 발송은 원장 승인 SENT.
        forceNew: Boolean(input.forceNew), // true면 잠긴 행을 덮지 않고 새 초안 행.
        reportId, // 초안만. 발송은 원장 승인 SENT.
    });

    revalidatePath("/teacher/reports"); // 교사 편집기.
    revalidatePath("/director/reports"); // 원장 큐가 최신 초안을 다시 읽게.

    return { // 반환. 초안만. 발송은 원장 승인 SENT.
        ok: true, // ok 선택.
        reportId: report.id, // reportId. 초안만. 발송은 원장 승인 SENT.
        message: input.forceNew // message. 초안만. 발송은 원장 승인 SENT.
            ? "새 기간 초안을 저장했습니다." // 삼항. 초안만. 발송은 원장 승인 SENT.
            : "초안을 저장했습니다.", // 삼항 나머지. 초안만. 발송은 원장 승인 SENT.
    };
}

/**
 * 근거를 모아 초안을 만든다. Gemini가 있으면 AI, 없으면 템플릿(`createReportDraft`).
 */
export async function regenerateDraftWithAi(input: { // regenerateDraftWithAi. 초안만. 발송은 원장 승인 SENT.
    studentId: string; // studentId. 초안만. 발송은 원장 승인 SENT.
    keywords: string[]; // keywords. 초안만. 발송은 원장 승인 SENT.
    tone: string; // tone. 초안만. 발송은 원장 승인 SENT.
    periodStart: string; // periodStart. 초안만. 발송은 원장 승인 SENT.
    periodEnd: string; // periodEnd. 초안만. 발송은 원장 승인 SENT.
    forceNew?: boolean; // 초안만. 발송은 원장 승인 SENT.
    reportId?: string; // 초안만. 발송은 원장 승인 SENT.
}): Promise<ActionResult> { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
    const session = await requireStaffOrTeacher(); // 교사·직원 + writeAiReport. 발송(SENT)은 하지 않는다.
    if (!session) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "직원 로그인이 필요합니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const permError = await requireWriteAiReport(session); // permError 조회. 초안만. 발송은 원장 승인 SENT.
    if (permError) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: permError }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const studentId = String(input.studentId ?? "").trim(); // studentId. 초안만. 발송은 원장 승인 SENT.
    const keywords = Array.isArray(input.keywords) // keywords. 초안만. 발송은 원장 승인 SENT.
        ? input.keywords.map(String).filter(Boolean) // 삼항. 초안만. 발송은 원장 승인 SENT.
        : []; // 삼항 나머지. 초안만. 발송은 원장 승인 SENT.
    const tone = String(input.tone ?? "격려·칭찬").trim() || "격려·칭찬"; // REPORT_TONE_OPTIONS와 맞춤. 그 외는 격려.

    if (!studentId) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "학생 정보가 없습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const periodStart = parseDateOnly(input.periodStart, "시작일"); // YYYY-MM-DD. 종료일이 시작일보다 빠를 수 없다.
    const periodEnd = parseDateOnly(input.periodEnd, "종료일"); // periodEnd. 초안만. 발송은 원장 승인 SENT.
    if (!periodStart || !periodEnd) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "기간 형식이 올바르지 않습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }
    if (periodEnd < periodStart) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "종료일이 시작일보다 빠를 수 없습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const accessError = await assertCanAccessStudent(session, studentId); // accessError 조회. 초안만. 발송은 원장 승인 SENT.
    if (accessError) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: accessError }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const student = await prisma.student.findUnique({ // student 시작. 초안만. 발송은 원장 승인 SENT.
        where: { id: studentId }, // 필터. 초안만. 발송은 원장 승인 SENT.
        select: { name: true }, // 프롬프트·템플릿 표시명. UUID는 넣지 않는다.
    });

    if (!student) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "학생을 찾을 수 없습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const evidence = await getReportEvidence({ // 런타임은 evidence.ts. evidence 2.ts는 미사용 중복이라 import하지 않는다.
        studentId, // 초안만. 발송은 원장 승인 SENT.
        periodStart: input.periodStart, // YYYY-MM-DD. Date 컬럼은 lte, timestamptz는 다음날 lt.
        periodEnd: input.periodEnd, // periodEnd. 초안만. 발송은 원장 승인 SENT.
    });
    const evidenceSummary = formatEvidenceSummary(evidence); // 건수 한 줄. AI 본문이 아니다.

    const draft = await createReportDraft({ // Gemini가 설정되어 있으면 AI, 없거나 실패하면 템플릿. usedAi로 화면에 알린다.
        studentName: student.name, // studentName. 초안만. 발송은 원장 승인 SENT.
        keywords, // 초안만. 발송은 원장 승인 SENT.
        tone, // 초안만. 발송은 원장 승인 SENT.
        periodStart: input.periodStart, // periodStart. 초안만. 발송은 원장 승인 SENT.
        periodEnd: input.periodEnd, // periodEnd. 초안만. 발송은 원장 승인 SENT.
        evidence, // 근거 밖 점수·출결을 창작하지 말라고 프롬프트가 고정한다.
    });

    const report = await upsertDraft({ // 초안만 DRAFTING. 학부모 Message는 원장 승인 때 같은 tx에서 SENT.
        session, // 초안만. 발송은 원장 승인 SENT.
        studentId, // 초안만. 발송은 원장 승인 SENT.
        content: draft.content, // content. 초안만. 발송은 원장 승인 SENT.
        keywords, // 초안만. 발송은 원장 승인 SENT.
        periodStart, // 초안만. 발송은 원장 승인 SENT.
        periodEnd, // 초안만. 발송은 원장 승인 SENT.
        forceNew: Boolean(input.forceNew), // forceNew. 초안만. 발송은 원장 승인 SENT.
        reportId: String(input.reportId ?? "").trim() || undefined, // reportId. 초안만. 발송은 원장 승인 SENT.
    });

    revalidatePath("/teacher/reports"); // 해당 화면 캐시만. redirect 없음.
    revalidatePath("/director/reports"); // 해당 화면 캐시만. redirect 없음.

    const verb = input.forceNew ? "신규 초안을 만들었습니다" : "AI 초안을 생성했습니다"; // verb. 초안만. 발송은 원장 승인 SENT.

    if (draft.usedAi) { // Gemini 성공. 근거 규모만 메시지에 붙인다.
        return { // 반환. 초안만. 발송은 원장 승인 SENT.
            ok: true, // ok 선택.
            reportId: report.id, // reportId. 초안만. 발송은 원장 승인 SENT.
            content: draft.content, // content. 초안만. 발송은 원장 승인 SENT.
            evidenceSummary, // 초안만. 발송은 원장 승인 SENT.
            message: `${verb}. (근거: ${evidenceSummary})`, // message. 초안만. 발송은 원장 승인 SENT.
        };
    }

    return { // 반환. 초안만. 발송은 원장 승인 SENT.
        ok: true, // ok 선택.
        reportId: report.id, // reportId. 초안만. 발송은 원장 승인 SENT.
        content: draft.content, // content. 초안만. 발송은 원장 승인 SENT.
        evidenceSummary, // 초안만. 발송은 원장 승인 SENT.
        message: draft.fallbackReason // message. 초안만. 발송은 원장 승인 SENT.
            ? `템플릿 초안을 사용했습니다. (${draft.fallbackReason} · 근거: ${evidenceSummary})` // 키 없음·호출 실패.
            : `템플릿 초안을 사용했습니다. (근거: ${evidenceSummary})`, // 삼항 나머지. 초안만. 발송은 원장 승인 SENT.
    };
}

/**
 * DRAFTING·REJECTED 초안을 PENDING_APPROVAL로 올려 원장 큐에 넣는다.
 * 발송(SENT)은 하지 않는다. 원장 승인 액션이 Message를 만든다.
 */
export async function requestReportApproval(input: { // requestReportApproval. 초안만. 발송은 원장 승인 SENT.
    reportId: string; // reportId. 초안만. 발송은 원장 승인 SENT.
}): Promise<ActionResult> { // 블록 시작. 초안만. 발송은 원장 승인 SENT.
    const session = await requireStaffOrTeacher(); // 교사·직원. 발송(SENT)은 하지 않고 원장 큐에만 올린다.
    if (!session) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "직원 로그인이 필요합니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const permError = await requireWriteAiReport(session); // permError 조회. 초안만. 발송은 원장 승인 SENT.
    if (permError) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: permError }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const reportId = String(input.reportId ?? "").trim(); // 빈 ID는 조회 전에 거절.
    if (!reportId) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "리포트 ID가 없습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const report = await prisma.aiReport.findUnique({ // report 시작. 초안만. 발송은 원장 승인 SENT.
        where: { id: reportId }, // 필터. 초안만. 발송은 원장 승인 SENT.
        select: { // select 필드. 초안만. 발송은 원장 승인 SENT.
            id: true, // id 선택.
            status: true, // SENT·PENDING은 아래에서 잠근다.
            content: true, // 빈 초안은 큐에 올리지 않는다.
            studentId: true, // 스코프 검사에 쓴다.
            authorUserId: true, // authorUserId 선택.
        },
    });

    if (!report) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: "리포트를 찾을 수 없습니다." }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    const accessError = await assertCanAccessStudent(session, report.studentId); // 타반 학생 초안은 승인 요청 불가.
    if (accessError) { // 가드. 초안만. 발송은 원장 승인 SENT.
        return { ok: false, message: accessError }; // 반환. 초안만. 발송은 원장 승인 SENT.
    }

    if (!EDITABLE.has(report.status) && report.status !== "DRAFTING") { // SENT·PENDING은 잠금. 미작성·작성중·반려만 큐로.
        return { // 반환. 초안만. 발송은 원장 승인 SENT.
            ok: false, // ok 선택.
            message: "작성 중이거나 반려된 리포트만 승인 요청할 수 있습니다.", // message. 초안만. 발송은 원장 승인 SENT.
        };
    }

    if (!report.content.trim()) { // 빈 초안은 원장 큐에 올리지 않는다.
        return { // 반환. 초안만. 발송은 원장 승인 SENT.
            ok: false, // ok 선택.
            message: "본문이 비어 있어 승인 요청할 수 없습니다.", // message. 초안만. 발송은 원장 승인 SENT.
        };
    }

    await prisma.aiReport.update({ // 발송이 아니라 승인 대기. Message는 원장이 승인할 때 SENT로 만들어진다.
        where: { id: report.id }, // 필터. 초안만. 발송은 원장 승인 SENT.
        data: { // data 필드. 초안만. 발송은 원장 승인 SENT.
            status: "PENDING_APPROVAL", // director-actions가 이 상태만 학부모 받은편지로 보낸다.
            authorUserId: session.user.id, // authorUserId. 초안만. 발송은 원장 승인 SENT.
            rejectionReason: null, // 다시 올리면 이전 반려 사유를 비운다.
        },
    });

    revalidatePath("/teacher/reports"); // 교사 편집기는 잠긴 제출로 보여 준다.
    revalidatePath("/director/reports"); // 원장 승인 큐.

    return { ok: true, message: "승인 요청을 보냈습니다." }; // SENT가 아니다. 학부모 화면은 아직 안 바뀐다.
}
