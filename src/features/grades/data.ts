import "server-only";

/**
 * 원장·직원 성적 입력 화면용 학생·성적·오답 조회.
 *
 * 호출: `/director/grades`, `/teacher/grades` 페이지가 where를 만들어 넘긴다.
 * 권한 스코프는 호출부가 넣은 where에만 두고, 이 파일은 화면용 묶음으로 바꾼다.
 *
 * 학생 목록의 활성 수강 take:1은 표시용 반 이름이다. 쓰기 권한의 담임 판정은 `actions.ts`가 다시 한다.
 *
 * 의도적으로 하지 않는 일:
 * - 학부모/학생 뷰어 조회 → `viewer-data.ts`.
 * - where를 여기서 넓히지 않음. 스코프를 빼면 전 원생이 보인다.
 *
 * 관련: `GradesManagementScreen.tsx`, `actions.ts`.
 */

import type { Prisma } from "@/generate/prisma/client";
import { prisma } from "@/lib/db";
import type {
    GradesGradeRow,
    GradesStudentOption,
    GradesWrongRow,
} from "@/features/grades/types";

type GradesManagementData = {
    students: GradesStudentOption[];
    grades: GradesGradeRow[];
    wrongNotes: GradesWrongRow[];
};

/**
 * 스코프가 적용된 where로 학생·최근 성적·오답을 한 묶음으로 읽는다.
 * 성적·오답은 최근 200건. 화면은 selectedStudentId로 다시 걸러 쓴다.
 */
export async function getGradesManagementData({
    studentWhere,
    gradeWhere,
    wrongNoteWhere,
}: {
    studentWhere: Prisma.StudentWhereInput;
    gradeWhere?: Prisma.GradeRecordWhereInput;
    wrongNoteWhere?: Prisma.WrongNoteWhereInput;
}): Promise<GradesManagementData> {
    const [studentRecords, gradeRecords, wrongNoteRecords] = await Promise.all([
        prisma.student.findMany({
            where: studentWhere,
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                enrollments: {
                    where: { endedAt: null, status: "ACTIVE" },
                    take: 1,
                    select: {
                        classId: true,
                        class: { select: { name: true } },
                    },
                },
            },
        }),
        prisma.gradeRecord.findMany({
            where: gradeWhere,
            orderBy: { assessedAt: "desc" },
            take: 200,
            select: {
                id: true,
                studentId: true,
                title: true,
                subject: true,
                score: true,
                maxScore: true,
                assessedAt: true,
                class: { select: { name: true } },
            },
        }),
        prisma.wrongNote.findMany({
            where: wrongNoteWhere,
            orderBy: { createdAt: "desc" },
            take: 200,
            select: {
                id: true,
                studentId: true,
                gradeRecordId: true,
                questionNo: true,
                questionText: true,
                studentAnswer: true,
                correctAnswer: true,
                explanation: true,
                status: true,
                createdAt: true,
                gradeRecord: { select: { title: true } },
            },
        }),
    ]);

    const students = studentRecords.map((student) => {
        const activeEnrollment = student.enrollments[0];

        return {
            id: student.id,
            name: student.name,
            classId: activeEnrollment?.classId ?? null,
            className: activeEnrollment?.class.name ?? null,
        };
    });

    const grades = gradeRecords.map((grade) => ({
        id: grade.id,
        studentId: grade.studentId,
        title: grade.title,
        subject: grade.subject,
        score: Number(grade.score),
        maxScore: Number(grade.maxScore),
        assessedAt: grade.assessedAt.toISOString(),
        className: grade.class?.name ?? null,
    }));

    const wrongNotes = wrongNoteRecords.map((wrongNote) => ({
        id: wrongNote.id,
        studentId: wrongNote.studentId,
        gradeRecordId: wrongNote.gradeRecordId,
        questionNo: wrongNote.questionNo,
        questionText: wrongNote.questionText,
        studentAnswer: wrongNote.studentAnswer,
        correctAnswer: wrongNote.correctAnswer,
        explanation: wrongNote.explanation,
        status: wrongNote.status,
        createdAt: wrongNote.createdAt.toISOString(),
        gradeTitle: wrongNote.gradeRecord?.title ?? null,
    }));

    return { students, grades, wrongNotes };
}
