import "server-only";

/**
 * 학부모 링크 / 학생 userId로만 읽는 성적·오답 조회.
 *
 * 호출: `/parent/grades`, `/student/grades`, 챗봇 컨텍스트.
 * 쓰기 액션(`actions.ts`)과 쿼리를 분리해 뷰어가 저장 API를 타지 않게 한다.
 *
 * 미연결 학생 계정은 빈 데이터(linked=false)로 돌려 타 학생 기록이 노출되지 않게 한다.
 * 학부모는 imageCount만, 학생은 imageUrls까지 붙인다.
 *
 * 의도적으로 하지 않는 일:
 * - 성적 입력 → `actions.ts` / `data.ts`.
 * - 링크가 끝난 자녀를 넣지 않음 → endedAt: null만.
 *
 * 관련: `types.ts`, `formatters.ts`.
 */

import { prisma } from "@/lib/db";
import type {
    GradeHighlight,
    ParentGradesChild,
    StudentGradeRecord,
    StudentGradesData,
    StudentWrongNote,
    WrongNoteStatus,
} from "@/features/grades/types";

const gradeRecordSelection = {
    id: true,
    title: true,
    subject: true,
    score: true,
    maxScore: true,
    assessedAt: true,
    class: { select: { name: true } },
} as const;

const wrongNoteSelection = {
    id: true,
    questionNo: true,
    questionText: true,
    studentAnswer: true,
    correctAnswer: true,
    explanation: true,
    status: true,
    createdAt: true,
    class: { select: { name: true } },
    gradeRecord: { select: { title: true, subject: true } },
    images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, url: true },
    },
} as const;

/**
 * 학부모 userId에 연결된 자녀별 성적·오답.
 * 링크가 없으면 빈 배열 — 다른 학부모 자녀를 채워 넣지 않는다.
 */
export async function getParentGradesChildren(
    parentUserId: string,
): Promise<ParentGradesChild[]> {
    const links = await prisma.parentStudentLink.findMany({
        where: { parentUserId, endedAt: null },
        orderBy: { linkedAt: "asc" },
        select: {
            student: {
                select: {
                    id: true,
                    name: true,
                    schoolName: true,
                    grade: true,
                    enrollments: {
                        where: { status: "ACTIVE", endedAt: null },
                        take: 1,
                        select: {
                            class: {
                                select: {
                                    name: true,
                                    teacher: { select: { name: true } },
                                },
                            },
                        },
                    },
                    gradeRecords: {
                        orderBy: { assessedAt: "desc" },
                        take: 20,
                        select: gradeRecordSelection,
                    },
                    wrongNotes: {
                        orderBy: { createdAt: "desc" },
                        take: 20,
                        select: wrongNoteSelection,
                    },
                },
            },
        },
    });

    return links.map(({ student }) => {
        const grades = student.gradeRecords.map(mapGradeRecord);
        const wrongNotes = student.wrongNotes.map(mapWrongNote);
        return {
            id: student.id,
            name: student.name,
            schoolName: student.schoolName,
            grade: student.grade,
            className: student.enrollments[0]?.class.name ?? null,
            teacherName: student.enrollments[0]?.class.teacher?.name ?? null,
            highlights: getGradeHighlights(grades),
            openWrongCount: countOpenWrongNotes(wrongNotes),
            grades,
            wrongNotes,
        };
    });
}

/**
 * 로그인한 학생 계정의 성적. Student.userId가 없으면 빈 화면용 데이터를 준다.
 *
 * @param fallbackStudentName 미연결일 때 헤더에 쓸 세션 이름.
 */
export async function getStudentGradesData(
    studentUserId: string,
    fallbackStudentName: string,
): Promise<StudentGradesData> {
    const student = await prisma.student.findFirst({
        where: { userId: studentUserId },
        select: {
            id: true,
            name: true,
            schoolName: true,
            grade: true,
            enrollments: {
                where: { status: "ACTIVE", endedAt: null },
                take: 1,
                select: gradeRecordSelection,
            },
            wrongNotes: {
                orderBy: { createdAt: "desc" },
                take: 30,
                select: wrongNoteSelection,
            },
        },
    });

    if (!student) return createUnlinkedGradesData(fallbackStudentName);

    const grades = student.gradeRecords.map(mapGradeRecord);
    const wrongNotes = student.wrongNotes.map((note) => ({
        ...mapWrongNote(note),
        imageUrls: note.images.map((image) => image.url),
    }));

    return {
        linked: true,
        studentName: student.name,
        schoolName: student.schoolName,
        grade: student.grade,
        className: student.enrollments[0]?.class.name ?? null,
        teacherName: student.enrollments[0]?.class.teacher?.name ?? null,
        highlights: getGradeHighlights(grades),
        openWrongCount: countOpenWrongNotes(wrongNotes),
        grades,
        wrongNotes,
    };
}

function mapGradeRecord(
    gradeRecord: {
        id: string;
        title: string;
        subject: string;
        score: unknown;
        maxScore: unknown;
        assessedAt: Date;
        class: { name: string } | null;
    },
): StudentGradeRecord {
    const score = Number(gradeRecord.score);
    const maxScore = Number(gradeRecord.maxScore);
    return {
        id: gradeRecord.id,
        title: gradeRecord.title,
        subject: gradeRecord.subject,
        className: gradeRecord.class?.name ?? null,
        score,
        maxScore,
        percent: maxScore > 0 ? Math.round((score / maxScore) * 100) : null,
        assessedAt: gradeRecord.assessedAt.toISOString(),
    };
}

function mapWrongNote(note: {
    id: string;
    questionNo: string | null;
    questionText: string | null;
    studentAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    status: string;
    createdAt: Date;
    class: { name: string } | null;
    gradeRecord: { title: string; subject: string } | null;
    images: Array<{ id: string; url: string }>;
}): StudentWrongNote {
    return {
        id: note.id,
        questionNo: note.questionNo,
        questionText: note.questionText,
        studentAnswer: note.studentAnswer,
        correctAnswer: note.correctAnswer,
        explanation: note.explanation,
        status: note.status as WrongNoteStatus,
        createdAt: note.createdAt.toISOString(),
        className: note.class?.name ?? null,
        subject: note.gradeRecord?.subject ?? null,
        gradeTitle: note.gradeRecord?.title ?? null,
        imageCount: note.images.length,
    };
}

function getGradeHighlights(grades: StudentGradeRecord[]): GradeHighlight[] {
    const latestBySubject = new Map<
        string,
        { score: number; previous: number | null }
    >();

    for (const grade of grades) {
        const latest = latestBySubject.get(grade.subject);
        if (!latest) {
            latestBySubject.set(grade.subject, {
                score: grade.score,
                previous: null,
            });
        } else if (latest.previous == null) {
            latest.previous = grade.score;
        }
    }

    return Array.from(latestBySubject, ([subject, values]) => ({
        subject,
        score: values.score,
        delta:
            values.previous == null
                ? null
                : Math.round((values.score - values.previous) * 10) / 10,
    })).slice(0, 3);
}

function countOpenWrongNotes(notes: Array<{ status: WrongNoteStatus }>) {
    return notes.filter((note) => note.status === "OPEN").length;
}

function createUnlinkedGradesData(studentName: string): StudentGradesData {
    return {
        linked: false,
        studentName,
        schoolName: null,
        grade: null,
        className: null,
        teacherName: null,
        highlights: [],
        openWrongCount: 0,
        grades: [],
        wrongNotes: [],
    };
}
