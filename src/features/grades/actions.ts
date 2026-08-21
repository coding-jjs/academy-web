"use server"; // Server Action. 브라우저가 직접 Prisma를 치지 않는다.

/**
 * 원장·교사·직원이 성적·오답 노트를 만들고 고치는 Server Action.
 *
 * 호출: `GradeRecordsPanel` / `WrongNotesPanel`이 저장·수정 시 직접 호출한다.
 * 전제: 세션 역할이 DIRECTOR | TEACHER | STAFF. 학부모·학생은 거절한다.
 *
 * 저장 전 `assertCanWriteStudent`가 스코프와 담당반/타반 권한을 가른다.
 * 활성 수강 1건(take:1)의 담임으로 내반을 보고, 타반이면 otherTeacherAttendanceGrade가 필요하다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 쓰기 → `viewer-data.ts`는 읽기 전용.
 * - 성적·오답 삭제 → 수정만 제공한다.
 *
 * 관련: `data.ts`(입력 화면 조회), `viewer-data.ts`(학부모/학생 읽기).
 */

import { revalidatePath } from "next/cache"; // 화면 캐시. 역할 경로만.
import { auth } from "@/lib/auth"; // JWT 세션. 폼에서 userId를 받지 않는다.
import { getKstDayRange } from "@/lib/date-kst"; // KST 오늘. UTC 자정 비교가 아니다.
import { prisma } from "@/lib/db"; // server-only Prisma. 브라우저가 직접 치지 않는다.
import { userHasPermission } from "@/lib/permission-guard"; // 권한 키. 역할만으로는 부족.
import { getStaffScope, studentScopeWhere } from "@/lib/staff-scope"; // 직원 스코프. 원장은 전 원생.

/** 성적·오답 저장 결과. 성공해도 redirect하지 않고 클라이언트가 메시지를 띄운다. */
export type GradesActionResult = // GradesActionResult 타입. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    | { ok: true; message: string; id?: string } // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    | { ok: false; message: string }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

const WRONG_STATUSES = ["OPEN", "REVIEWED", "MASTERED"] as const; // WRONG_STATUSES. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
type WrongStatus = (typeof WRONG_STATUSES)[number]; // WrongStatus 타입. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

type Actor = // Actor 타입. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    | { kind: "director"; userId: string } // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    | { kind: "staff"; userId: string }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

async function requireGradesActor(): Promise<Actor | { error: string }> { // requireGradesActor. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    const session = await auth(); // JWT. proxy 1차 가드 후에도 쓰기 액션이 DB 역할과 맞춘다.
    if (!session?.user?.id) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { error: "로그인이 필요합니다." }; // 비로그인은 viewer-data만 읽는다.
    }

    const role = session.user.role; // 역할 분기. 학부모·학생은 거절.
    const userId = session.user.id; // 세션 User. 클라이언트가 작성자를 고르지 않는다.

    if (role === "DIRECTOR") { // 원장은 스코프·키 없이 통과.
        return { kind: "director", userId }; // 스코프·권한 키 없이 전 학생 쓰기.
    }

    if (role === "TEACHER" || role === "STAFF") { // 교사·사무. 학부모·학생은 거절.
        return { kind: "staff", userId }; // 실제 쓰기 키는 assertCanWriteStudent가 가른다.
    }

    return { error: "성적/오답 관리 권한이 없습니다." }; // 학부모·학생·게스트는 거절.
}

function parseDateOnly(value: string): Date | null { // parseDateOnly. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    const trimmed = String(value ?? "").trim(); // YYYY-MM-DD만. 공백·다른 형식은 거절.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null; // date input이 아닌 값은 저장하지 않는다.
    const date = new Date(`${trimmed}T00:00:00.000Z`); // UTC 자정으로 파싱한 뒤 ISO 앞 10자가 입력과 같아야 한다.
    if (Number.isNaN(date.getTime())) return null; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    if (date.toISOString().slice(0, 10) !== trimmed) return null; // 2월 31일을 거절한다.
    return date; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
}

/** 평가일 문자열(YYYY-MM-DD)을 KST 오늘과 비교. Date 객체로 비교하면 TZ가 어긋난다. */
function isFutureKstDate(value: string) { // isFutureKstDate. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    return value > getKstDayRange().day; // 문자열 비교. Date 객체로 비교하면 TZ가 어긋난다.
}

function revalidateGrades() { // revalidateGrades. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    revalidatePath("/director/grades"); // 원장 입력 화면.
    revalidatePath("/teacher/grades"); // 교사 입력 화면. 직원 URL은 page가 같은 Screen을 쓴다.
    revalidatePath("/parent/grades"); // 학부모 뷰어도 같이 갱신.
    revalidatePath("/student/grades"); // 학생 뷰어.
}

/**
 * 이 학생 성적·오답을 쓸 수 있는지 검사한다.
 *
 * 원장은 학생만 있으면 통과. 직원은 스코프 안이어야 하고,
 * 활성 수강 1건의 담임이 본인이면 ownClassAttendanceGrade,
 * 다른 선생님 반이면 otherTeacherAttendanceGrade가 필요하다.
 * 담임이 없는 반은 내반으로 본다.
 */
async function assertCanWriteStudent( // assertCanWriteStudent. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    actor: Actor, // 원장 vs 직원. 권한 키는 직원만.
    studentId: string, // 원생 카드. User id가 아니다.
): Promise<string | null> { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    if (actor.kind === "director") { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        const student = await prisma.student.findFirst({ // 스코프·존재 검사. 학부모 뷰어 쿼리가 아니다.
            where: { id: studentId }, // where. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            select: { id: true }, // select. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        });
        return student ? null : "학생을 찾을 수 없습니다."; // 원장은 담당반/타반 키를 보지 않는다.
    }

    const scope = await getStaffScope(actor.userId); // 직원은 담당 범위 안.
    const student = await prisma.student.findFirst({ // 스코프·존재 검사. 학부모 뷰어 쿼리가 아니다.
        where: { // where. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            id: studentId, // id. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            ...studentScopeWhere(scope), // 전개. 알 수 없는 키를 통과시키지 않는다.
        },
        select: { // select. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            id: true, // id. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            enrollments: { // enrollments. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
                where: { status: "ACTIVE", endedAt: null }, // 해제 수강은 담임 판정에서 뺀다.
                take: 1, // 복수 수강이어도 첫 활성 1건만. 쓰기 권한의 기준 반을 하나로 고정한다.
                select: { // select. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
                    class: { select: { teacherUserId: true } }, // class. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
                },
            },
        },
    });

    if (!student) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return scope.viewAllStudents // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            ? "학생을 찾을 수 없습니다." // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            : "담당 범위의 학생만 입력할 수 있습니다."; // 스코프 밖은 권한 키를 보기 전에 막는다.
    }

    const teacherUserId = student.enrollments[0]?.class.teacherUserId ?? null; // take:1 반 담임. 없으면 내반으로 본다.
    const isOwnClass = teacherUserId === actor.userId; // 담임이 본인. 아니면 타반 키.

    if (isOwnClass || !teacherUserId) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        const allowed = await userHasPermission( // 권한 키. 역할만으로는 부족.
            actor.userId, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            "ownClassAttendanceGrade", // 담임이 본인이거나 미배정 반이면 내반 키.
        );
        if (!allowed) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            return "담당반 성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요."; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        }
    } else { // else. 로직은 그대로.
        const allowed = await userHasPermission( // 권한 키. 역할만으로는 부족.
            actor.userId, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            "otherTeacherAttendanceGrade", // 다른 선생님 반이면 타반 키가 필요하다.
        );
        if (!allowed) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            return "타 선생님반 성적 입력 권한이 없습니다. 원장에게 권한 부여를 요청하세요."; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        }
    }

    return null; // 거절. 부분 저장하지 않는다.
}

/**
 * 한 학생의 성적 행을 만든다.
 *
 * @param input.assessedAt YYYY-MM-DD. KST 오늘을 넘기면 거절한다.
 * @param input.classId 선택. 학생의 현재 반을 화면이 넘기며, 없으면 반 없이 저장한다.
 */
export async function createGradeRecord(input: { // createGradeRecord. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    studentId: string; // 원생 카드. User id가 아니다.
    title: string; // 제목. 서버가 길이를 다시 본다.
    subject: string; // 과목 키. 뷰어 하이라이트와 같다.
    score: number; // 점수. 만점을 넘으면 거절.
    maxScore: number; // 만점. 0 이하면 거절. percent는 뷰어만.
    assessedAt: string; // 평가일 YYYY-MM-DD. KST 오늘을 넘기면 거절.
    classId?: string | null; // 선택 반. 없으면 반 없이 저장.
}): Promise<GradesActionResult> { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    const actorOrError = await requireGradesActor(); // DIRECTOR | TEACHER | STAFF만. 학부모·학생은 여기서 막는다.
    if ("error" in actorOrError) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: actorOrError.error }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    const actor = actorOrError; // 원장 vs 직원. 권한 키는 직원만.

    const studentId = String(input.studentId ?? "").trim(); // 원생 카드. User id가 아니다.
    const title = String(input.title ?? "").trim(); // 제목. 서버가 길이를 다시 본다.
    const subject = String(input.subject ?? "").trim(); // 과목 키. 뷰어 하이라이트와 같다.
    const score = Number(input.score); // 점수. 만점을 넘으면 거절.
    const maxScore = Number(input.maxScore); // 만점. 0 이하면 거절. percent는 뷰어만.
    const assessedAtValue = String(input.assessedAt ?? "").trim(); // 문자열 비교용. Date 객체 TZ 비교가 아니다.
    const assessedAt = parseDateOnly(assessedAtValue); // 평가일 YYYY-MM-DD. KST 오늘을 넘기면 거절.
    const classId = input.classId?.trim() || null; // 공백은 반 없이 저장.

    if (!studentId) return { ok: false, message: "학생을 선택해 주세요." }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    if (!title || title.length > 120) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "제목을 1~120자로 입력해 주세요." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!subject || subject.length > 60) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!Number.isFinite(score) || score < 0) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "점수가 올바르지 않습니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "만점은 0보다 커야 합니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (score > maxScore) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "점수는 만점을 넘을 수 없습니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!assessedAt) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "평가일이 올바르지 않습니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (isFutureKstDate(assessedAtValue)) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            ok: false, // ok. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            message: "평가일은 오늘 이후로 지정할 수 없습니다.", // KST 오늘 상한. Date 객체 비교가 아니다.
        };
    }

    const accessError = await assertCanWriteStudent(actor, studentId); // 내반 ownClassAttendanceGrade vs 타반 otherTeacherAttendanceGrade (take:1 담임).
    if (accessError) return { ok: false, message: accessError }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

    if (classId) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        const cls = await prisma.class.findFirst({ // 반 존재. 없는 id로 저장하지 않는다.
            where: { id: classId }, // where. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            select: { id: true }, // select. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        });
        if (!cls) return { ok: false, message: "반 정보가 올바르지 않습니다." }; // 없는 id로 저장하지 않는다.
    }

    const row = await prisma.gradeRecord.create({ // 저장 행. 삭제는 없다.
        data: { // data. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            studentId, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            classId, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            createdBy: actor.userId, // 세션 사용자. 클라이언트가 작성자를 고르지 않는다.
            title, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            subject, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            score, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            maxScore, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            assessedAt, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        },
        select: { id: true }, // select. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    });

    revalidateGrades(); // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    return { ok: true, id: row.id, message: "성적을 저장했습니다." }; // redirect 없음. 화면이 메시지를 띄우고 refresh한다.
}

/**
 * 기존 성적 행을 고친다. studentId는 클라이언트가 넘기지 않고 기존 행에서 읽어 가로채기를 막는다.
 */
export async function updateGradeRecord(input: { // updateGradeRecord. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    gradeId: string; // 기존 행. studentId는 여기서 읽어 가로채기를 막는다.
    title: string; // 제목. 서버가 길이를 다시 본다.
    subject: string; // 과목 키. 뷰어 하이라이트와 같다.
    score: number; // 점수. 만점을 넘으면 거절.
    maxScore: number; // 만점. 0 이하면 거절. percent는 뷰어만.
    assessedAt: string; // 평가일 YYYY-MM-DD. KST 오늘을 넘기면 거절.
}): Promise<GradesActionResult> { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    const actorOrError = await requireGradesActor(); // DIRECTOR | TEACHER | STAFF만.
    if ("error" in actorOrError) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: actorOrError.error }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    const actor = actorOrError; // 원장 vs 직원. 권한 키는 직원만.

    const gradeId = String(input.gradeId ?? "").trim(); // 기존 행. studentId는 여기서 읽어 가로채기를 막는다.
    const title = String(input.title ?? "").trim(); // 제목. 서버가 길이를 다시 본다.
    const subject = String(input.subject ?? "").trim(); // 과목 키. 뷰어 하이라이트와 같다.
    const score = Number(input.score); // 점수. 만점을 넘으면 거절.
    const maxScore = Number(input.maxScore); // 만점. 0 이하면 거절. percent는 뷰어만.
    const assessedAtValue = String(input.assessedAt ?? "").trim(); // 문자열 비교용. Date 객체 TZ 비교가 아니다.
    const assessedAt = parseDateOnly(assessedAtValue); // 평가일 YYYY-MM-DD. KST 오늘을 넘기면 거절.

    if (!gradeId) return { ok: false, message: "성적 ID가 없습니다." }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    if (!title || title.length > 120) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "제목을 1~120자로 입력해 주세요." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!subject || subject.length > 60) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "과목을 1~60자로 입력해 주세요." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!Number.isFinite(score) || score < 0) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "점수가 올바르지 않습니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "만점은 0보다 커야 합니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (score > maxScore) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "점수는 만점을 넘을 수 없습니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (!assessedAt) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "평가일이 올바르지 않습니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    if (isFutureKstDate(assessedAtValue)) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            ok: false, // ok. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            message: "평가일은 오늘 이후로 지정할 수 없습니다.", // message. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        };
    }

    const existing = await prisma.gradeRecord.findUnique({ // 기존 행. 클라이언트가 studentId를 바꿔 가로채지 못하게.
        where: { id: gradeId }, // where. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        select: { id: true, studentId: true }, // 기존 행의 studentId로 권한을 본다. 클라이언트가 학생을 바꿔 가로채지 못하게.
    });
    if (!existing) return { ok: false, message: "성적을 찾을 수 없습니다." }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

    const accessError = await assertCanWriteStudent(actor, existing.studentId); // take:1 담임으로 내반/타반 키.
    if (accessError) return { ok: false, message: accessError }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

    await prisma.gradeRecord.update({ // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        where: { id: existing.id }, // where. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        data: { title, subject, score, maxScore, assessedAt }, // 제목·점수·평가일만. 학생·반은 바꾸지 않는다.
    });

    revalidateGrades(); // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    return { ok: true, id: existing.id, message: "성적을 수정했습니다." }; // redirect 없음.
}

/**
 * 오답 노트를 만든다. 문항 번호 또는 문제 본문 중 하나는 필수.
 * status가 허용 값이 아니면 OPEN으로 떨어뜨려 잘못된 코드가 DB에 들어가지 않게 한다.
 */
export async function createWrongNote(input: { // createWrongNote. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    studentId: string; // 원생 카드. User id가 아니다.
    gradeRecordId?: string | null; // 연결 성적. 다른 학생 성적에 못 붙인다.
    classId?: string | null; // 선택 반. 없으면 반 없이 저장.
    questionNo?: string | null; // 문항 번호. 본문과 둘 다 비면 거절.
    questionText?: string | null; // 문제 본문. 번호와 둘 다 비면 거절.
    studentAnswer?: string | null; // 학생 답. 선택.
    correctAnswer?: string | null; // 정답. 선택.
    explanation?: string | null; // 해설. 선택.
    status?: string; // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
}): Promise<GradesActionResult> { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    const actorOrError = await requireGradesActor(); // DIRECTOR | TEACHER | STAFF만.
    if ("error" in actorOrError) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: actorOrError.error }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    const actor = actorOrError; // 원장 vs 직원. 권한 키는 직원만.

    const studentId = String(input.studentId ?? "").trim(); // 원생 카드. User id가 아니다.
    const gradeRecordId = input.gradeRecordId?.trim() || null; // 연결 성적. 다른 학생 성적에 못 붙인다.
    const classId = input.classId?.trim() || null; // 선택 반. 없으면 반 없이 저장.
    const questionNo = String(input.questionNo ?? "").trim() || null; // 문항 번호. 본문과 둘 다 비면 거절.
    const questionText = String(input.questionText ?? "").trim() || null; // 문제 본문. 번호와 둘 다 비면 거절.
    const studentAnswer = String(input.studentAnswer ?? "").trim() || null; // 학생 답. 선택.
    const correctAnswer = String(input.correctAnswer ?? "").trim() || null; // 정답. 선택.
    const explanation = String(input.explanation ?? "").trim() || null; // 해설. 선택.
    const statusRaw = String(input.status ?? "OPEN").trim(); // 클라이언트가 보낸 상태. 허용 목록만.
    const status = (WRONG_STATUSES as readonly string[]).includes(statusRaw) // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
        ? (statusRaw as WrongStatus) // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        : "OPEN"; // 허용 값이 아니면 OPEN. 잘못된 코드가 DB에 들어가지 않게.

    if (!studentId) return { ok: false, message: "학생을 선택해 주세요." }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    if (!questionText && !questionNo) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            ok: false, // ok. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            message: "문항 번호 또는 문제 내용을 입력해 주세요.", // 둘 다 비면 거절.
        };
    }

    const accessError = await assertCanWriteStudent(actor, studentId); // 내반 vs 타반 키 (take:1 담임).
    if (accessError) return { ok: false, message: accessError }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

    if (gradeRecordId) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        const grade = await prisma.gradeRecord.findFirst({ // 연결 성적. studentId를 같이 본다.
            where: { id: gradeRecordId, studentId }, // 다른 학생 성적에 오답을 붙이지 못하게 studentId를 같이 본다.
            select: { id: true }, // select. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        });
        if (!grade) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            return { ok: false, message: "연결할 성적을 찾을 수 없습니다." }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        }
    }

    const row = await prisma.wrongNote.create({ // 저장 행. 삭제는 없다.
        data: { // data. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            studentId, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            gradeRecordId, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            classId, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            authorUserId: actor.userId, // 세션 사용자.
            questionNo, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            questionText, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            studentAnswer, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            correctAnswer, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            explanation, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            status, // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        },
        select: { id: true }, // select. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    });

    revalidateGrades(); // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    return { ok: true, id: row.id, message: "오답을 저장했습니다." }; // redirect 없음. 이미지 업로드는 이 액션이 아니다.
}

/**
 * 기존 오답 노트를 고친다. 연결 성적(gradeRecordId)은 여기서 바꾸지 않는다 — 화면이 수정 중 select를 잠근다.
 */
export async function updateWrongNote(input: { // updateWrongNote. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    wrongNoteId: string; // 기존 오답. 연결 성적은 안 바꾼다.
    questionNo?: string | null; // 문항 번호. 본문과 둘 다 비면 거절.
    questionText?: string | null; // 문제 본문. 번호와 둘 다 비면 거절.
    studentAnswer?: string | null; // 학생 답. 선택.
    correctAnswer?: string | null; // 정답. 선택.
    explanation?: string | null; // 해설. 선택.
    status: string; // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.
}): Promise<GradesActionResult> { // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    const actorOrError = await requireGradesActor(); // DIRECTOR | TEACHER | STAFF만.
    if ("error" in actorOrError) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: actorOrError.error }; // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    }
    const actor = actorOrError; // 원장 vs 직원. 권한 키는 직원만.

    const wrongNoteId = String(input.wrongNoteId ?? "").trim(); // 기존 오답. 연결 성적은 안 바꾼다.
    if (!wrongNoteId) return { ok: false, message: "오답 ID가 없습니다." }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

    const statusRaw = String(input.status ?? "").trim(); // 클라이언트가 보낸 상태. 허용 목록만.
    if (!(WRONG_STATUSES as readonly string[]).includes(statusRaw)) { // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        return { ok: false, message: "오답 상태가 올바르지 않습니다." }; // create처럼 OPEN으로 떨어뜨리지 않는다.
    }
    const status = statusRaw as WrongStatus; // OPEN/REVIEWED/MASTERED. 잘못된 코드는 create만 OPEN으로.

    const existing = await prisma.wrongNote.findUnique({ // 기존 행. 클라이언트가 studentId를 바꿔 가로채지 못하게.
        where: { id: wrongNoteId }, // where. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        select: { id: true, studentId: true }, // 기존 행의 studentId로 권한을 본다. 연결 성적은 여기서 바꾸지 않는다.
    });
    if (!existing) return { ok: false, message: "오답을 찾을 수 없습니다." }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

    const accessError = await assertCanWriteStudent(actor, existing.studentId); // take:1 담임으로 내반/타반 키.
    if (accessError) return { ok: false, message: accessError }; // 가드. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.

    await prisma.wrongNote.update({ // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        where: { id: existing.id }, // where. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
        data: { // data. 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
            questionNo: String(input.questionNo ?? "").trim() || null, // 문항 번호. 본문과 둘 다 비면 거절.
            questionText: String(input.questionText ?? "").trim() || null, // 문제 본문. 번호와 둘 다 비면 거절.
            studentAnswer: String(input.studentAnswer ?? "").trim() || null, // 학생 답. 선택.
            correctAnswer: String(input.correctAnswer ?? "").trim() || null, // 정답. 선택.
            explanation: String(input.explanation ?? "").trim() || null, // 해설. 선택.
            status, // 문항·답·해설·상태만. 연결 성적은 화면이 select를 잠근다.
        },
    });

    revalidateGrades(); // 성적 쓰기. take:1 담임 내반 ownClass vs 타반 otherTeacher. 삭제 없음.
    return { ok: true, id: existing.id, message: "오답을 수정했습니다." }; // redirect 없음.
}
